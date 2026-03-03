"""
EmailAgent: Listens for email events and reacts (e.g., auto-reply, trigger workflows).
"""
from ..runtime_core.universal_agent_interface import UniversalAgentInterface

class EmailAgent(UniversalAgentInterface):
    def __init__(self, event_bus):
        self.event_bus = event_bus
        self.event_bus.subscribe('email_received', self.on_email)
    def on_email(self, event):
        print(f"[EmailAgent] Received email: {event.get('subject')}")
        # Add logic to auto-reply, trigger workflows, etc.
    def step(self):
        pass
