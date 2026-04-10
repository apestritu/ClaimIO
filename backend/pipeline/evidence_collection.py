"""Evidence Collection Agent — verify required document types are present."""

from __future__ import annotations

import logging
from statistics import mean
from types import SimpleNamespace

from a2a import EventBus, TaskEvent, TaskStatus

logger = logging.getLogger(__name__)

REQUIRED_TYPES = {"Policy", "ClaimForm", "BagReport", "FlightTicket", "Receipt",
                  "PhysicianStatement", "CancellationConfirmation", "TripSummary"}


async def run_evidence_collection(ctx: dict, bus: EventBus) -> dict:
    """Check which required document types are present and compute confidence."""
    await bus.publish(TaskEvent(
        agent="EvidenceCollectionAgent",
        status=TaskStatus.WORKING,
        message="Verifying required evidence is present",
    ))

    docs = ctx["docs"]
    docs_by_type = ctx["docs_by_type"]

    provided = {}
    confs = []

    for doc_type, filenames in docs_by_type.items():
        if doc_type in REQUIRED_TYPES:
            avg_conf = mean(docs[fn]["classify_conf"] for fn in filenames)
            provided[doc_type] = {
                "filenames": filenames,
                "count": len(filenames),
                "classify_conf": round(avg_conf, 3),
            }
            confs.append(avg_conf)

    docs_confidence = mean(confs) if confs else 0.0

    checklist = []
    for req in sorted(REQUIRED_TYPES):
        entry = provided.get(req)
        if entry:
            checklist.append({
                "requirement": req,
                "status": "provided",
                "files": entry["filenames"],
                "confidence": entry["classify_conf"],
            })
        else:
            checklist.append({
                "requirement": req,
                "status": "missing",
                "files": [],
                "confidence": 0.0,
            })

    await bus.publish(TaskEvent(
        agent="EvidenceCollectionAgent",
        status=TaskStatus.COMPLETED,
        message=f"Evidence check complete. {len(provided)}/{len(REQUIRED_TYPES)} types found. Confidence: {docs_confidence:.2f}",
        data={
            "checklist": checklist,
            "docs_confidence": round(docs_confidence, 3),
            "provided_count": len(provided),
            "total_required": len(REQUIRED_TYPES),
        },
    ))

    ctx["evidence_checklist"] = checklist
    ctx["docs_confidence"] = docs_confidence
    return ctx
