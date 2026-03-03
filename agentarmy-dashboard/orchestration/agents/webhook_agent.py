"""
WebhookAgent: Handles generic webhook events (GitHub, Stripe, etc.).
"""
from ..runtime_core.universal_agent_interface import UniversalAgentInterface

class WebhookAgent(UniversalAgentInterface):
    def __init__(self, event_bus):
        self.event_bus = event_bus
        self.event_bus.subscribe('webhook_event', self.on_webhook)
    def on_webhook(self, event):
        print(f"[WebhookAgent] Webhook received: {event.get('source')} {event.get('action')}")
        # Add logic to trigger workflows, notify agents, etc.
    def step(self):
        pass
