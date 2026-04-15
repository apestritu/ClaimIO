"""FastAPI server — SSE endpoint for real-time claim processing."""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

load_dotenv()

from a2a import EventBus, TaskEvent
from orchestrator import run_pipeline

# --------------- JSON-file claim history ---------------
HISTORY_PATH = Path(__file__).resolve().parent / "data" / "history.json"
RUNS_DIR = Path(__file__).resolve().parent / "data" / "runs"


def _load_history() -> list[dict]:
    if HISTORY_PATH.exists():
        try:
            return json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return []
    return []


def _persist_history(history: list[dict]) -> None:
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    HISTORY_PATH.write_text(json.dumps(history, indent=2), encoding="utf-8")


def _strip_event(evt: dict) -> dict:
    """Remove large raw text fields from event data to keep run files small."""
    cleaned = {**evt}
    data = cleaned.get("data")
    if isinstance(data, dict):
        data = {**data}
        data.pop("text", None)
        data.pop("raw", None)
        if "evaluation" in data:
            data["evaluation"] = [
                {k: v for k, v in row.items() if k != "facts"}
                for row in data["evaluation"]
            ]
        cleaned["data"] = data
    return cleaned


def _save_run(case_id: str, events: list[dict], status: str, summary: dict | None) -> dict:
    run_id = uuid.uuid4().hex[:12]
    entry = {
        "id": run_id,
        "case_id": case_id,
        "status": status,
        "started_at": events[0]["timestamp"] if events else time.time(),
        "finished_at": events[-1]["timestamp"] if events else time.time(),
        "event_count": len(events),
        "agents_completed": list({e["agent"] for e in events if e.get("status") == "completed"}),
        "summary": summary,
    }
    history = _load_history()
    history.insert(0, entry)
    _persist_history(history)

    # Save full events to per-run file
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    run_file = RUNS_DIR / f"{run_id}.json"
    run_data = {
        "id": run_id,
        "case_id": case_id,
        "started_at": entry["started_at"],
        "finished_at": entry["finished_at"],
        "events": [_strip_event(e) for e in events],
    }
    run_file.write_text(json.dumps(run_data, indent=2), encoding="utf-8")

    return entry

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

INPUT_DIR = Path(__file__).resolve().parent.parent / "input"

app = FastAPI(title="ClaimIO API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/cases")
async def list_cases():
    """List available claim cases."""
    cases = []
    for d in sorted(INPUT_DIR.iterdir()):
        if d.is_dir() and not d.name.startswith("."):
            files = [f.name for f in d.iterdir() if f.suffix.lower() in (".pdf", ".txt")]
            cases.append({
                "id": d.name,
                "name": d.name,
                "document_count": len(files),
                "documents": sorted(files),
            })
    return {"cases": cases}


@app.get("/api/claims/{case_id}/process")
async def process_claim(case_id: str):
    """Process a claim case — streams A2A events via SSE."""
    case_dir = INPUT_DIR / case_id
    if not case_dir.exists():
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

    bus = EventBus()

    async def event_stream():
        queue = bus.subscribe()
        collected: list[dict] = []
        run_status = "completed"
        run_summary = None

        pipeline_task = asyncio.create_task(run_pipeline(case_id, bus))

        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=300)
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'type': 'keepalive'})}\n\n"
                    continue

                if event is None:
                    break

                evt_dict = json.loads(event.to_sse())
                collected.append(evt_dict)

                if evt_dict.get("agent") == "Orchestrator" and evt_dict.get("status") == "failed":
                    run_status = "failed"
                if evt_dict.get("agent") == "Orchestrator" and evt_dict.get("status") == "completed":
                    run_summary = evt_dict.get("data", {}).get("final_summary")

                yield f"data: {event.to_sse()}\n\n"
        except asyncio.CancelledError:
            run_status = "cancelled"
            pipeline_task.cancel()
        finally:
            bus.unsubscribe(queue)
            if not pipeline_task.done():
                pipeline_task.cancel()
                try:
                    await pipeline_task
                except (asyncio.CancelledError, Exception):
                    pass
            _save_run(case_id, collected, run_status, run_summary)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/history")
async def get_history():
    """Return the list of past claim runs."""
    return {"runs": _load_history()}


@app.get("/api/history/{run_id}/events")
async def get_run_events(run_id: str):
    """Fetch the full saved event stream for a past run."""
    run_file = RUNS_DIR / f"{run_id}.json"
    if not run_file.exists():
        raise HTTPException(status_code=404, detail="Run events not found")
    try:
        data = json.loads(run_file.read_text(encoding="utf-8"))
        return data
    except (json.JSONDecodeError, OSError) as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/api/history/{run_id}")
async def delete_history_entry(run_id: str):
    """Delete a single history entry and its run file."""
    history = _load_history()
    filtered = [h for h in history if h["id"] != run_id]
    if len(filtered) == len(history):
        raise HTTPException(status_code=404, detail="Run not found")
    _persist_history(filtered)
    run_file = RUNS_DIR / f"{run_id}.json"
    if run_file.exists():
        run_file.unlink()
    return {"deleted": run_id}


@app.delete("/api/history")
async def clear_history():
    """Clear all history and run files."""
    count = len(_load_history())
    _persist_history([])
    if RUNS_DIR.exists():
        for f in RUNS_DIR.glob("*.json"):
            f.unlink()
    return {"cleared": count}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
