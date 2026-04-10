"""Tests for FastAPI server endpoints."""

import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_list_cases():
    resp = client.get("/api/cases")
    assert resp.status_code == 200
    data = resp.json()
    assert "cases" in data
    case_ids = [c["id"] for c in data["cases"]]
    assert "ShowCase1" in case_ids
    assert "ShowCase2" in case_ids


def test_process_invalid_case():
    resp = client.get("/api/claims/NonExistentCase/process")
    assert resp.status_code == 404
