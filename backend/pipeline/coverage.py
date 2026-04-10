"""Coverage Reasoning Agent — compare facts against policy terms."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from functools import partial
from pathlib import Path

from openai import OpenAI

from a2a import EventBus, TaskEvent, TaskStatus

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "coverage_reason.md"
PROMPT_TEXT = PROMPT_PATH.read_text(encoding="utf-8")

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


def _reformat(mmddyyyy: str) -> str:
    """MM/DD/YYYY -> YYYY-MM-DD"""
    parts = mmddyyyy.split("/")
    if len(parts) == 3:
        m, d, y = parts
        return f"{y}-{m.zfill(2)}-{d.zfill(2)}"
    return mmddyyyy


def _merge_facts(ctx: dict) -> dict:
    """Merge all per-document facts into a unified summary."""
    out: dict = {}

    for fm in ctx["fact_map"].values():
        facts = fm.get("facts", {}) or {}
        for key in ["incident_date", "bag_delay_start", "bag_delivered",
                     "cancellation_date", "cancellation_reason", "medical_condition"]:
            if facts.get(key) and not out.get(key):
                out[key] = facts[key]

    total_receipts = sum(
        (fm.get("facts", {}) or {}).get("total_amount", 0) or 0
        for fm in ctx["fact_map"].values()
        if fm.get("doc_type") == "Receipt"
    )
    out["total_receipts"] = round(total_receipts, 2)

    total_refunds = sum(
        (fm.get("facts", {}) or {}).get("refund_amount", 0) or 0
        for fm in ctx["fact_map"].values()
        if fm.get("doc_type") in ("CancellationConfirmation",)
    )
    out["total_refunds"] = round(total_refunds, 2)

    for meta in ctx["docs"].values():
        if meta["type"] == "Policy":
            text = meta["text"]

            dates = re.search(
                r"Effective\s+(\d{2}/\d{2}/\d{4}).*?Expires\s+(\d{2}/\d{2}/\d{4})",
                text, re.S,
            )
            if dates:
                out["policy_effective"] = _reformat(dates.group(1))
                out["policy_expires"] = _reformat(dates.group(2))

            td_per_day = re.search(r"Travel Delay.*?\$(\d+)", text)
            bd_flat = re.search(r"Baggage Delay.*?\$(\d+)", text)
            td_max = re.search(r"Travel Delay[^$]*\$(\d+)[^\n]+Overall", text, re.S)
            tc_max = re.search(r"Trip Cancellation.*?\$(\d[\d,]*)", text)

            out["coverage_limits"] = {
                "TravelDelayPerDay": int(td_per_day.group(1)) if td_per_day else 0,
                "BaggageDelayFlat": int(bd_flat.group(1)) if bd_flat else 0,
                "TravelDelayMax": int(td_max.group(1)) if td_max else 2000,
                "TripCancellationMax": int(tc_max.group(1).replace(",", "")) if tc_max else 10000,
            }
            break

    if "coverage_limits" not in out:
        out["coverage_limits"] = {
            "TravelDelayPerDay": 200,
            "BaggageDelayFlat": 200,
            "TravelDelayMax": 2000,
            "TripCancellationMax": 10000,
        }

    return out


def _rule_check(facts: dict) -> tuple[bool, list[str]]:
    """Deterministic guard-rail rules."""
    from datetime import datetime
    issues = []

    def _to_date(s):
        try:
            return datetime.strptime(s, "%Y-%m-%d").date() if s else None
        except ValueError:
            return None

    bag_start = _to_date(facts.get("bag_delay_start"))
    bag_delivered = _to_date(facts.get("bag_delivered"))
    if bag_start and bag_delivered:
        hrs = (bag_delivered - bag_start).days * 24
        if hrs < 24:
            issues.append("Bag delay < 24h")

    total = facts.get("total_receipts") or 0
    limits = facts.get("coverage_limits", {})
    cap = limits.get("TravelDelayMax", 0) + limits.get("BaggageDelayFlat", 0)
    if cap > 0 and total > cap + 1e-3:
        issues.append("Claim exceeds policy limits")

    return (len(issues) == 0), issues


async def run_coverage(ctx: dict, bus: EventBus) -> dict:
    """Run coverage reasoning — GPT analysis + deterministic rules."""
    await bus.publish(TaskEvent(
        agent="CoverageReasoningAgent",
        status=TaskStatus.WORKING,
        message="Merging facts and analyzing coverage against policy terms",
    ))

    facts = _merge_facts(ctx)
    policy_text = next(
        (meta["text"] for meta in ctx["docs"].values() if meta["type"] == "Policy"), ""
    )

    await bus.publish(TaskEvent(
        agent="CoverageReasoningAgent",
        status=TaskStatus.WORKING,
        message="Sending merged facts to GPT for coverage reasoning",
        data={"merged_facts": {k: v for k, v in facts.items() if k != "policy_text"}},
    ))

    loop = asyncio.get_running_loop()
    resp = await loop.run_in_executor(
        None,
        partial(
            _get_client().responses.create,
            model="gpt-5.4",
            reasoning={"effort": "medium"},
            instructions=PROMPT_TEXT,
            input=[
                {"role": "user", "content": json.dumps({"policy_text": policy_text[:12000], "facts": facts})},
            ],
        ),
    )

    try:
        gpt_result = json.loads(resp.output_text or "{}")
    except json.JSONDecodeError:
        gpt_result = {
            "meets_thresholds": False,
            "approved_amount": 0,
            "coverage_confidence": 0.3,
            "issues": ["Failed to parse GPT response"],
            "reasoning": resp.output_text or "",
        }

    valid, rule_issues = _rule_check(facts)
    if not valid:
        gpt_result.setdefault("issues", []).extend(rule_issues)
        gpt_result["coverage_confidence"] = min(
            gpt_result.get("coverage_confidence", 0.5), 0.4
        )

    coverage_summary = {
        "facts": facts,
        "gpt_result": gpt_result,
        "coverage_confidence": gpt_result.get("coverage_confidence", 0.5),
        "meets_thresholds": gpt_result.get("meets_thresholds"),
        "approved_amount": gpt_result.get("approved_amount", 0),
        "issues": gpt_result.get("issues", []),
        "reasoning": gpt_result.get("reasoning", ""),
        "docs_confidence": ctx.get("docs_confidence", 0.0),
        "mean_extract_conf": ctx.get("mean_extract_conf", 0.0),
    }

    await bus.publish(TaskEvent(
        agent="CoverageReasoningAgent",
        status=TaskStatus.COMPLETED,
        message=f"Coverage analysis complete. Meets thresholds: {gpt_result.get('meets_thresholds')}. "
                f"Approved: ${gpt_result.get('approved_amount', 0):.2f}",
        data={
            "meets_thresholds": gpt_result.get("meets_thresholds"),
            "approved_amount": gpt_result.get("approved_amount", 0),
            "coverage_confidence": gpt_result.get("coverage_confidence", 0.5),
            "issues": gpt_result.get("issues", []),
            "reasoning": gpt_result.get("reasoning", ""),
        },
    ))

    ctx["coverage_summary"] = coverage_summary
    return ctx
