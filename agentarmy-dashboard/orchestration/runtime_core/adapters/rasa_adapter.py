"""
Adapter for Rasa agents
Implements UniversalAgentInterface for Rasa-based agents.
"""
from ..universal_agent_interface import UniversalAgentInterface
from ..event_bus import EventBus

class RasaAgentAdapter(UniversalAgentInterface):
    def __init__(self, config=None):
        self.config = config or {}
        self.event_bus = None

    def attach_event_bus(self, event_bus: EventBus):
        self.event_bus = event_bus

    def step(self):
        # Integrate Rasa agent step logic here
        pass

    def shutdown(self):
        # Clean up Rasa agent resources
        pass
