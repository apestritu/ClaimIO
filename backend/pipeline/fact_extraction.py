"""Fact Extraction Agent — per-document structured extraction via GPT."""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path

from openai import OpenAI

from a2a import EventBus, TaskEvent, TaskStatus

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "fact_extract.md"
PROMPT_TEXT = PROMPT_PATH.read_text(encoding="utf-8")

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


def _extract_one(filename: str, text: str) -> dict:
    """Synchronous single-document extraction."""
    resp = _get_client().responses.create(
        model="gpt-5.4",
        reasoning={"effort": "medium"},
        instructions=PROMPT_TEXT,
        input=[
            {"role": "user", "content": text[:14000]},
        ],
    )
    content = resp.output_text or "{}"
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {"error": "Failed to parse extraction", "raw": content[:500]}


async def run_fact_extraction(ctx: dict, bus: EventBus) -> dict:
    """Extract facts from every document in parallel."""
    await bus.publish(TaskEvent(
        agent="FactExtractionAgent",
        status=TaskStatus.WORKING,
        message=f"Starting parallel fact extraction for {len(ctx['docs'])} documents",
    ))

    docs = ctx["docs"]
    fact_map = {}

    loop = asyncio.get_running_loop()

    tasks = {}
    for fn, meta in docs.items():
        tasks[fn] = loop.run_in_executor(None, _extract_one, fn, meta["text"])

    results = await asyncio.gather(*tasks.values(), return_exceptions=True)

    for fn, result in zip(tasks.keys(), results):
        if isinstance(result, Exception):
            logger.error("Extraction failed for %s: %s", fn, result)
            fact_map[fn] = {"error": str(result), "confidence_extraction": 0.0}
            docs[fn]["extract_conf"] = 0.0
        else:
            fact_map[fn] = result
            conf = float(result.get("confidence_extraction", 0.0))
            docs[fn]["extract_conf"] = conf

        key_facts = []
        if not isinstance(result, Exception):
            facts = result.get("facts", {}) or {}
            for k, v in facts.items():
                if v and k not in ("raw_text",):
                    key_facts.append(f"{k}: {v}")

        await bus.publish(TaskEvent(
            agent="FactExtractionAgent",
            status=TaskStatus.WORKING,
            message=f"Extracted facts from {fn}",
            data={
                "filename": fn,
                "doc_type": result.get("doc_type", "Unknown") if not isinstance(result, Exception) else "Error",
                "summary": result.get("summary", "") if not isinstance(result, Exception) else str(result),
                "confidence": docs[fn].get("extract_conf", 0.0),
                "key_facts": key_facts[:6],
            },
        ))

    fact_map_summary = {}
    for fn, fm in fact_map.items():
        fact_map_summary[fn] = {
            "doc_type": fm.get("doc_type", "Unknown"),
            "summary": fm.get("summary", ""),
            "confidence_extraction": fm.get("confidence_extraction", 0.0),
            "facts": {k: v for k, v in (fm.get("facts", {}) or {}).items() if k != "raw_text"},
        }

    await bus.publish(TaskEvent(
        agent="FactExtractionAgent",
        status=TaskStatus.COMPLETED,
        message=f"Extracted facts from {len(fact_map)} documents",
        data={"document_count": len(fact_map), "fact_map": fact_map_summary},
    ))

    ctx["fact_map"] = fact_map
    return ctx
