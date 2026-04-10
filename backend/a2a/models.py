"""A2A-style task event models for inter-agent communication."""

from __future__ import annotations

import time
import uuid
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    SUBMITTED = "submitted"
    WORKING = "working"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskEvent(BaseModel):
    """An event emitted by an agent during pipeline execution."""

    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    agent: str
    status: TaskStatus
    message: str = ""
    data: dict[str, Any] = Field(default_factory=dict)
    timestamp: float = Field(default_factory=time.time)

    def to_sse(self) -> str:
        """Serialize as an SSE data line."""
        return self.model_dump_json()
