"""Stub payment gateway — always succeeds."""

import asyncio
import logging

logger = logging.getLogger(__name__)


async def send_payment(method: str, account: str, amount: float) -> bool:
    """Simulate sending a payment. Always succeeds after a short delay."""
    logger.info("[PAYMENT] Sending $%.2f via %s to %s", amount, method, account)
    await asyncio.sleep(0.5)
    logger.info("[PAYMENT] Success")
    return True
