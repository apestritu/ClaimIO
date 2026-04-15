"""Compliance Agent — sanctions screening + fraud risk scoring."""

from __future__ import annotations

import logging

from a2a import EventBus, TaskEvent, TaskStatus
from tools.sanctions import check_sanctions
from tools.fraud import compute_fraud_risk

logger = logging.getLogger(__name__)


async def run_compliance(ctx: dict, bus: EventBus) -> dict:
    """Screen for sanctions and compute fraud risk."""
    await bus.publish(TaskEvent(
        agent="ComplianceAgent",
        status=TaskStatus.WORKING,
        message="Running sanctions screening and fraud risk analysis",
    ))

    claimant_name = "Unknown"
    for fm in ctx["fact_map"].values():
        facts = fm.get("facts", {}) or {}
        if facts.get("claimant_name"):
            claimant_name = facts["claimant_name"]
            break

    is_hit, sanc_conf = check_sanctions(claimant_name)

    receipt_amounts = [
        (fm.get("facts", {}) or {}).get("total_amount", 0) or 0
        for fm in ctx["fact_map"].values()
        if fm.get("doc_type") == "Receipt"
    ]
    fraud_score = compute_fraud_risk(receipt_amounts)

    compliance = {
        "sanction_hit": is_hit,
        "sanctions_confidence": sanc_conf,
        "fraud_risk_score": fraud_score,
        "claimant_name": claimant_name,
        "receipt_amounts": receipt_amounts,
    }

    await bus.publish(TaskEvent(
        agent="ComplianceAgent",
        status=TaskStatus.COMPLETED,
        message=f"Compliance check done. Sanctions hit: {is_hit}. Fraud risk: {fraud_score:.2f}",
        data=compliance,
    ))

    ctx["compliance"] = compliance
    return ctx
