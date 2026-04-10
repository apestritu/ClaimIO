"""Tests for the A2A event bus."""

import asyncio
import pytest
from a2a import EventBus, TaskEvent, TaskStatus


@pytest.mark.asyncio
async def test_publish_subscribe():
    bus = EventBus()
    q = bus.subscribe()

    await bus.publish(TaskEvent(agent="TestAgent", status=TaskStatus.WORKING, message="hello"))
    await bus.publish(TaskEvent(agent="TestAgent", status=TaskStatus.COMPLETED, message="done"))

    e1 = await q.get()
    e2 = await q.get()

    assert e1.status == TaskStatus.WORKING
    assert e2.status == TaskStatus.COMPLETED

    bus.unsubscribe(q)


@pytest.mark.asyncio
async def test_event_serialization():
    event = TaskEvent(agent="X", status=TaskStatus.COMPLETED, message="ok", data={"key": "val"})
    json_str = event.to_sse()
    assert '"agent":"X"' in json_str or '"agent": "X"' in json_str
    assert "completed" in json_str


def test_task_event_model():
    event = TaskEvent(agent="A", status=TaskStatus.WORKING, message="test")
    assert event.agent == "A"
    assert event.status == TaskStatus.WORKING
    assert event.message == "test"
    assert isinstance(event.id, str)
    assert event.timestamp > 0
