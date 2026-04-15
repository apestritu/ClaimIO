"""Decision Agent — approve / deny / escalate based on confidence."""

from __future__ import annotations

import logging

from a2a import EventBus, TaskEvent, TaskStatus

logger = logging.getLogger(__name__)

W_DOCS = 0.3
W_EXTRACT = 0.3
W_COVERAGE = 0.3
W_FRAUD = 0.2
AUTOMATIC_THRESHOLD = 0.70


def _global_confidence(ctx: dict) -> float:
    cs = ctx.get("coverage_summary", {})
    cd = cs.get("docs_confidence", 0.0)
    ce = cs.get("mean_extract_conf", 0.0)
    ccov = cs.get("coverage_confidence", 0.0)
    fraud = (ctx.get("compliance") or {}).get("fraud_risk_score", 0.0)
    g = W_DOCS * cd + W_EXTRACT * ce + W_COVERAGE * ccov - W_FRAUD * fraud
    return max(0.0, min(1.0, g))


async def run_decision(ctx: dict, bus: EventBus) -> dict:
    """Make the final claim decision."""
    await bus.publish(TaskEvent(
        agent="DecisionAgent",
        status=TaskStatus.WORKING,
        message="Computing global confidence and making decision",
    ))

    G = _global_confidence(ctx)
    cs = ctx.get("coverage_summary", {})

    status = "APPROVED" if cs.get("meets_thresholds") else "DENIED"
    amount = cs.get("approved_amount", 0.0)

    if (ctx.get("compliance") or {}).get("sanction_hit"):
        status = "ESCALATE"

    if G < AUTOMATIC_THRESHOLD and status == "APPROVED":
        status = "ESCALATE"

    fraud = (ctx.get("compliance") or {}).get("fraud_risk_score", 0.0)
    metrics = [
        {"label": "C_docs", "value": round(cs.get("docs_confidence", 0.0), 3), "weight": W_DOCS, "icon": "📄"},
        {"label": "C_extract", "value": round(cs.get("mean_extract_conf", 0.0), 3), "weight": W_EXTRACT, "icon": "🧠"},
        {"label": "C_coverage", "value": round(cs.get("coverage_confidence", 0.0), 3), "weight": W_COVERAGE, "icon": "⚖️"},
        {"label": "Fraud", "value": round(fraud, 3), "weight": W_FRAUD, "icon": "🔍", "subtract": True},
    ]

    decision = {
        "status": status,
        "amount": amount,
        "global_confidence": round(G, 3),
        "threshold": AUTOMATIC_THRESHOLD,
        "metrics": metrics,
        "reasoning": f"Global confidence: {G:.3f}. "
                     f"Coverage meets thresholds: {cs.get('meets_thresholds')}. "
                     f"Sanctions hit: {(ctx.get('compliance') or {}).get('sanction_hit', False)}. "
                     f"Threshold for auto-decision: {AUTOMATIC_THRESHOLD}.",
    }

    await bus.publish(TaskEvent(
        agent="DecisionAgent",
        status=TaskStatus.COMPLETED,
        message=f"Decision: {status}. Amount: ${amount:.2f}. Confidence: {G:.3f}",
        data=decision,
    ))

    ctx["decision"] = decision
    return ctx
