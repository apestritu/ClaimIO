"""Ingest Agent — OCR + classify every document in the case folder."""

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from pathlib import Path
from statistics import mean

from agents import Agent, Runner, function_tool

from a2a import EventBus, TaskEvent, TaskStatus
from tools.ocr import extract_pdf_text, extract_txt_file
from tools.classify import classify_text

logger = logging.getLogger(__name__)

INPUT_DIR = Path(__file__).resolve().parent.parent.parent / "input"

REQUIRED_TYPES_BAGGAGE = {"Policy", "ClaimForm", "BagReport", "FlightTicket", "Receipt"}
REQUIRED_TYPES_CANCELLATION = {"Policy", "ClaimForm", "FlightTicket", "PhysicianStatement"}


@function_tool
def ocr_and_classify_document(case_id: str, filename: str) -> str:
    """OCR a document and classify it into a document type.

    Args:
        case_id: The case folder name.
        filename: The document filename.
    """
    file_path = INPUT_DIR / case_id / filename
    if not file_path.exists():
        return json.dumps({"error": f"File not found: {filename}"})

    if file_path.suffix.lower() == ".txt":
        text, ocr_conf = extract_txt_file(file_path)
    else:
        text, ocr_conf = extract_pdf_text(file_path)

    label, cls_conf = classify_text(text)

    return json.dumps({
        "filename": filename,
        "type": label,
        "text": text[:8000],
        "ocr_confidence": ocr_conf,
        "classify_confidence": cls_conf,
    })


ingest_agent = Agent(
    name="IngestAgent",
    instructions=(
        "You are a document ingestion agent for insurance claims. "
        "Given a case_id, you must OCR and classify every document in the case folder. "
        "Use the ocr_and_classify_document tool for each file. "
        "After processing all documents, provide a summary of what you found as JSON with: "
        '{"documents": [...], "docs_by_type": {...}, "missing_docs": bool, "docs_confidence": float}'
    ),
    tools=[ocr_and_classify_document],
    model="gpt-5.4",
)


async def run_ingest(case_id: str, bus: EventBus) -> dict:
    """Run the ingest agent and return structured results."""
    await bus.publish(TaskEvent(
        agent="IngestAgent",
        status=TaskStatus.WORKING,
        message="Starting document ingestion — OCR + classification",
    ))

    case_dir = INPUT_DIR / case_id
    files = [f.name for f in sorted(case_dir.iterdir())
             if f.suffix.lower() in (".pdf", ".txt") and not f.name.startswith(".")]

    docs = {}
    docs_by_type = defaultdict(list)

    for filename in files:
        await bus.publish(TaskEvent(
            agent="IngestAgent",
            status=TaskStatus.WORKING,
            message=f"Processing: {filename}",
        ))

        file_path = case_dir / filename
        loop = asyncio.get_running_loop()
        if file_path.suffix.lower() == ".txt":
            text, ocr_conf = await loop.run_in_executor(None, extract_txt_file, file_path)
        else:
            text, ocr_conf = await loop.run_in_executor(None, extract_pdf_text, file_path)

        label, cls_conf = await loop.run_in_executor(None, classify_text, text)

        file_size_bytes = file_path.stat().st_size
        if file_size_bytes >= 1024 * 1024:
            file_size_str = f"{file_size_bytes / (1024 * 1024):.1f} MB"
        else:
            file_size_str = f"{file_size_bytes / 1024:.0f} KB"

        docs[filename] = {
            "filename": filename,
            "type": label,
            "text": text,
            "ocr_conf": ocr_conf,
            "classify_conf": cls_conf,
            "file_size": file_size_str,
        }
        docs_by_type[label].append(filename)

        await bus.publish(TaskEvent(
            agent="IngestAgent",
            status=TaskStatus.WORKING,
            message=f"Classified {filename} as {label} (conf: {cls_conf:.2f})",
            data={"filename": filename, "type": label, "confidence": cls_conf, "file_size": file_size_str},
        ))

    by_type = dict(docs_by_type)
    present_types = set(by_type.keys())
    missing_baggage = REQUIRED_TYPES_BAGGAGE - present_types
    missing_cancel = REQUIRED_TYPES_CANCELLATION - present_types
    missing_docs = bool(min(len(missing_baggage), len(missing_cancel)))

    confs = [docs[fn]["classify_conf"] for fn in docs]
    docs_confidence = mean(confs) if confs else 0.0

    documents_summary = [
        {
            "filename": meta["filename"],
            "type": meta["type"],
            "confidence": meta["classify_conf"],
            "file_size": meta.get("file_size", ""),
        }
        for meta in docs.values()
    ]

    await bus.publish(TaskEvent(
        agent="IngestAgent",
        status=TaskStatus.COMPLETED,
        message=f"Ingested {len(docs)} documents. Confidence: {docs_confidence:.2f}",
        data={
            "document_count": len(docs),
            "types_found": list(present_types),
            "docs_confidence": round(docs_confidence, 3),
            "missing_docs": missing_docs,
            "documents": documents_summary,
        },
    ))

    return {
        "docs": docs,
        "docs_by_type": by_type,
        "missing_docs": missing_docs,
        "docs_confidence": docs_confidence,
    }
