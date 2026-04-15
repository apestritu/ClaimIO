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
    "Insurance Claim Form": "ClaimForm",
    "Policy Certificate": "Policy",
    "Insurance Policy": "Policy",
    "Policy Document": "Policy",
    "Forwarded Policy Email": "Policy",
    "Policy Email": "Policy",
    "Delayed Baggage Report": "BagReport",
    "Delayed Baggage Report (CDG)": "BagReport",
    "Return Bag Report": "BagReport",
    "Delayed Bag Report": "BagReport",
    "Delayed bag report": "BagReport",
    "Baggage Report": "BagReport",
    "Lost Baggage Report": "BagReport",
    "Flight Ticket": "FlightTicket",
    "Flight Itinerary": "FlightTicket",
    "Boarding Pass": "FlightTicket",
    "E-Ticket": "FlightTicket",
    "Airline Ticket": "FlightTicket",
    "Flight Confirmation": "FlightTicket",
    "Itinerary": "FlightTicket",
    "Physician Statement": "PhysicianStatement",
    "Medical Statement": "PhysicianStatement",
    "Doctor Statement": "PhysicianStatement",
    "Medical Certificate": "PhysicianStatement",
    "Cancellation Confirmation": "CancellationConfirmation",
    "Refund Confirmation": "CancellationConfirmation",
    "Cancellation Notice": "CancellationConfirmation",
    "Trip Summary": "TripSummary",
    "Customer Summary": "TripSummary",
    "Travel Summary": "TripSummary",
    "Trip Overview": "TripSummary",
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


def _filename_hint(filename: str) -> str | None:
    """Try to infer label from the filename when OCR text is ambiguous."""
    fn = filename.lower()
    if "policy" in fn:
        return "Policy"
    if "claim" in fn and "form" in fn:
        return "ClaimForm"
    if "bag" in fn or "baggage" in fn:
        return "BagReport"
    if "ticket" in fn or "itinerary" in fn or "boarding" in fn or "flight" in fn:
        return "FlightTicket"
    if "receipt" in fn or "invoice" in fn:
        return "Receipt"
    if "physician" in fn or "medical" in fn or "doctor" in fn:
        return "PhysicianStatement"
    if "cancel" in fn or "refund" in fn:
        return "CancellationConfirmation"
    if "summary" in fn or "trip" in fn:
        return "TripSummary"
    return None


def classify_text(text: str, filename: str = "") -> Tuple[str, float]:
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
        if "delayed bag report" in lower or "delayed baggage report" in lower or "lost baggage" in lower:
            label = "BagReport"
        elif "physician" in lower or "medical statement" in lower or "doctor" in lower:
            label = "PhysicianStatement"
        elif "flight itinerary" in lower or "boarding pass" in lower or "e-ticket" in lower:
            label = "FlightTicket"
        elif "cancellation" in lower or "refund confirmation" in lower:
            label = "CancellationConfirmation"
        elif "policy" in lower and ("effective" in lower or "coverage" in lower):
            label = "Policy"
        elif "receipt" in lower or "invoice" in lower:
            label = "Receipt"

    if label not in LABELS and filename:
        hint = _filename_hint(filename)
        if hint:
            label = hint

    if label not in LABELS:
        label = "Other"

    return label, float(data.get("confidence", 0.2))
