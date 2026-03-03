"""
EventLoggerAgent: Logs and visualizes all events for dashboards.
"""
from ..runtime_core.universal_agent_interface import UniversalAgentInterface

class EventLoggerAgent(UniversalAgentInterface):
    def __init__(self, event_bus):
        self.event_bus = event_bus
        self.event_bus.subscribe('*', self.on_any_event)
    def on_any_event(self, event):
        print(f"[EventLoggerAgent] Event: {event}")
        # Add logic to store, visualize, or forward events to dashboards
    def step(self):
        pass
