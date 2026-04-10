"""Payment Agent — process approved payments (stub)."""

from __future__ import annotations

import logging

from a2a import EventBus, TaskEvent, TaskStatus
from tools.payment_api import send_payment

logger = logging.getLogger(__name__)


async def run_payment(ctx: dict, bus: EventBus) -> dict:
    """Process payment for approved claims."""
    decision = ctx.get("decision", {})

    if decision.get("status") != "APPROVED":
        await bus.publish(TaskEvent(
            agent="PaymentAgent",
            status=TaskStatus.COMPLETED,
            message=f"Skipping payment — claim status is {decision.get('status', 'UNKNOWN')}",
        ))
        ctx["payment"] = {"processed": False, "reason": "Not approved"}
        return ctx

    await bus.publish(TaskEvent(
        agent="PaymentAgent",
        status=TaskStatus.WORKING,
        message=f"Processing payment of ${decision.get('amount', 0):.2f}",
    ))

    amount = decision.get("amount", 0)
    success = await send_payment("ACH", "****9876", amount)

    ctx["payment"] = {
        "processed": True,
        "success": success,
        "method": "ACH",
        "amount": amount,
    }

    await bus.publish(TaskEvent(
        agent="PaymentAgent",
        status=TaskStatus.COMPLETED,
        message=f"Payment of ${amount:.2f} processed successfully" if success
                else f"Payment of ${amount:.2f} failed",
        data=ctx["payment"],
    ))

    return ctx
