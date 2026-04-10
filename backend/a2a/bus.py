"""In-memory A2A event bus — agents publish, the SSE endpoint subscribes."""

from __future__ import annotations

import asyncio
from typing import AsyncIterator

from .models import TaskEvent


class EventBus:
    """Simple async pub/sub for TaskEvent messages."""

    def __init__(self) -> None:
        self._subscribers: list[asyncio.Queue[TaskEvent | None]] = []

    def subscribe(self) -> asyncio.Queue[TaskEvent | None]:
        q: asyncio.Queue[TaskEvent | None] = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue[TaskEvent | None]) -> None:
        self._subscribers = [s for s in self._subscribers if s is not q]

    async def publish(self, event: TaskEvent) -> None:
        for q in self._subscribers:
            await q.put(event)

    async def close(self) -> None:
        for q in self._subscribers:
            await q.put(None)

    async def stream(self) -> AsyncIterator[TaskEvent]:
        q = self.subscribe()
        try:
            while True:
                event = await q.get()
                if event is None:
                    break
                yield event
        finally:
            self.unsubscribe(q)
