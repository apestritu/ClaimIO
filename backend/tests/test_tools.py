"""Tests for deterministic tools (no API calls)."""

from tools.fraud import compute_fraud_risk
from tools.sanctions import check_sanctions


def test_fraud_no_amounts():
    assert compute_fraud_risk([]) == 0.1


def test_fraud_no_duplicates():
    assert compute_fraud_risk([100.0, 200.0, 50.0]) == 0.2


def test_fraud_with_duplicates():
    assert compute_fraud_risk([100.0, 100.0, 50.0]) == 0.8


def test_sanctions_stub():
    hit, conf = check_sanctions("John Doe")
    assert hit is False
    assert conf == 0.95
