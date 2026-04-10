"""Stub sanctions screening — simulates OFAC API check."""

from random import random


def check_sanctions(name: str) -> tuple[bool, float]:
    """Returns (is_hit, confidence). POC: always returns no hit."""
    return (False, 0.95)
