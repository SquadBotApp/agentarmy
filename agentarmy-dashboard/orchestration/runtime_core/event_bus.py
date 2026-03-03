"""
Event Bus for AgentArmy Runtime Core
------------------------------------
A minimal, extensible event bus for decoupled subsystem communication.
"""
from typing import Callable, Dict, List, Any, Type

class Event:
    """Base class for all events."""
    def __init__(self, type: str, payload: Any = None):
        self.type = type
        self.payload = payload

class EventBus:
    """Simple publish/subscribe event bus."""
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[Event], None]]] = {}

    def subscribe(self, event_type: str, handler: Callable[[Event], None]):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)

    def unsubscribe(self, event_type: str, handler: Callable[[Event], None]):
        if event_type in self._subscribers:
            self._subscribers[event_type].remove(handler)
            if not self._subscribers[event_type]:
                del self._subscribers[event_type]

    def publish(self, event: Event):
        for handler in self._subscribers.get(event.type, []):
            handler(event)
