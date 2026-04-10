"""Evidence Evaluation Agent — assess quality and relevance of extracted facts."""

from __future__ import annotations

import logging
from statistics import mean

from a2a import EventBus, TaskEvent, TaskStatus

logger = logging.getLogger(__name__)


def _impact(doc_type: str) -> str:
    return {
        "BagReport": "Confirms bag delay duration and circumstances",
        "Receipt": "Supports claimed expense amount",
        "Policy": "Defines coverage limits and terms",
        "ClaimForm": "Provides claimant details and incident description",
        "FlightTicket": "Confirms travel dates and itinerary",
        "PhysicianStatement": "Medical evidence for cancellation claims",
        "CancellationConfirmation": "Confirms booking cancellation and refund",
        "TripSummary": "Overview of trip and booking details",
        "Email": "Supporting correspondence",
    }.get(doc_type, "General context")


async def run_evidence_evaluation(ctx: dict, bus: EventBus) -> dict:
    """Evaluate each document's extracted facts for quality and relevance."""
    await bus.publish(TaskEvent(
        agent="EvidenceEvaluationAgent",
        status=TaskStatus.WORKING,
        message="Evaluating evidence quality and relevance",
    ))

    docs = ctx["docs"]
    fact_map = ctx["fact_map"]
    rows = []

    for fn, meta in docs.items():
        fm = fact_map.get(fn, {})
        row = {
            "filename": fn,
            "doc_type": meta["type"],
            "facts": fm.get("facts", {}) or {},
            "summary": fm.get("summary", "—"),
            "impact": _impact(meta["type"]),
            "confidence": meta.get("extract_conf", 0.0),
        }
        rows.append(row)

    mean_conf = mean(r["confidence"] for r in rows) if rows else 0.0

    await bus.publish(TaskEvent(
        agent="EvidenceEvaluationAgent",
        status=TaskStatus.COMPLETED,
        message=f"Evaluated {len(rows)} documents. Mean extraction confidence: {mean_conf:.2f}",
        data={
            "evaluation": rows,
            "mean_extraction_confidence": round(mean_conf, 3),
        },
    ))

    ctx["evidence_evaluation"] = rows
    ctx["mean_extract_conf"] = mean_conf
    return ctx
