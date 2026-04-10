"""GPT-based document classifier — returns (label, confidence)."""

from __future__ import annotations

import json
import re
from typing import Tuple

from openai import OpenAI

_client: OpenAI | None = None

LABELS = [
    "Policy",
    "ClaimForm",
    "BagReport",
    "FlightTicket",
    "Receipt",
    "Email",
    "PhysicianStatement",
    "CancellationConfirmation",
    "TripSummary",
    "Other",
]

_NORMALISE = {
    "Claim Form": "ClaimForm",
    "Trip Claim Form": "ClaimForm",
    "Customer Claim Form": "ClaimForm",
    "Policy Certificate": "Policy",
    "Delayed Baggage Report": "BagReport",
    "Delayed Baggage Report (CDG)": "BagReport",
    "Return Bag Report": "BagReport",
    "Delayed Bag Report": "BagReport",
    "Delayed bag report": "BagReport",
    "Physician Statement": "PhysicianStatement",
    "Cancellation Confirmation": "CancellationConfirmation",
    "Trip Summary": "TripSummary",
    "Customer Summary": "TripSummary",
}

_SYSTEM_MSG = (
    "You are a strict document classifier.\n"
    f"Allowed labels: {', '.join(LABELS)}.\n"
    'Respond ONLY with JSON: {"label": <label>, "confidence": <float 0-1>}.'
)


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


def classify_text(text: str) -> Tuple[str, float]:
    """Classify document text into a canonical label.

    Returns (canonical_label, confidence).
    """
    snippet = text[:4000]
    resp = _get_client().responses.create(
        model="gpt-5.4",
        reasoning={"effort": "medium"},
        instructions=_SYSTEM_MSG,
        input=[
            {"role": "user", "content": f"Classify this document:\n-----\n{snippet}\n-----"},
        ],
    )
    match = re.search(r"\{.*\}", resp.output_text or "", re.S)
    if not match:
        return "Other", 0.2
    data = json.loads(match.group())
    label = data.get("label", "Other")

    label = _NORMALISE.get(label, label)

    if label not in LABELS:
        lower = text.lower()[:3000]
        if "delayed bag report" in lower or "delayed baggage report" in lower:
            label = "BagReport"
        elif "physician" in lower or "medical" in lower:
            label = "PhysicianStatement"

    if label not in LABELS:
        label = "Other"

    return label, float(data.get("confidence", 0.2))
