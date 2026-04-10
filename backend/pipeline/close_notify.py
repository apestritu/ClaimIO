"""Close & Notify Agent — generate final summary and notify claimant."""

from __future__ import annotations

import logging

from a2a import EventBus, TaskEvent, TaskStatus

logger = logging.getLogger(__name__)


async def run_close_notify(ctx: dict, bus: EventBus) -> dict:
    """Generate final summary and close the claim."""
    await bus.publish(TaskEvent(
        agent="CloseNotifyAgent",
        status=TaskStatus.WORKING,
        message="Generating final claim summary",
    ))

    decision = ctx.get("decision", {})
    coverage = ctx.get("coverage_summary", {})
    compliance = ctx.get("compliance", {})
    payment = ctx.get("payment", {})

    summary = {
        "claim_status": decision.get("status", "UNKNOWN"),
        "approved_amount": decision.get("amount", 0),
        "global_confidence": decision.get("global_confidence", 0),
        "coverage_confidence": coverage.get("coverage_confidence", 0),
        "meets_thresholds": coverage.get("meets_thresholds", False),
        "issues": coverage.get("issues", []),
        "coverage_reasoning": coverage.get("reasoning", ""),
        "fraud_risk": compliance.get("fraud_risk_score", 0),
        "sanctions_hit": compliance.get("sanction_hit", False),
        "payment_processed": payment.get("processed", False),
        "payment_success": payment.get("success", False),
        "documents_processed": len(ctx.get("docs", {})),
        "evidence_evaluation": ctx.get("evidence_evaluation", []),
        "evidence_checklist": ctx.get("evidence_checklist", []),
        "merged_facts": coverage.get("facts", {}),
    }

    email_body = (
        f"Hello,\n\n"
        f"We have completed the assessment of your claim.\n\n"
        f"Decision: {decision.get('status')}\n"
        f"Approved amount: ${decision.get('amount', 0):.2f}\n"
        f"AI confidence score: {decision.get('global_confidence', 0):.2f}\n\n"
        f"Thank you for choosing Go Ready Insurance."
    )

    await bus.publish(TaskEvent(
        agent="CloseNotifyAgent",
        status=TaskStatus.COMPLETED,
        message=f"Claim closed. Status: {decision.get('status')}. Notification sent.",
        data={
            "summary": summary,
            "notification_sent": True,
            "email_preview": email_body,
        },
    ))

    ctx["final_summary"] = summary
    ctx["status"] = "CLOSED"
    return ctx
