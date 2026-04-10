"""Simple heuristic fraud risk scoring."""

from collections import Counter


def compute_fraud_risk(receipt_amounts: list[float]) -> float:
    """Higher score = higher risk. Flags duplicate receipt totals."""
    if not receipt_amounts:
        return 0.1
    c = Counter(receipt_amounts)
    has_duplicates = any(v > 1 for v in c.values())
    return 0.8 if has_duplicates else 0.2
