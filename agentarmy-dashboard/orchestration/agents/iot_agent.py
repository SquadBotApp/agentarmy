"""
IoTAgent: Listens for IoT device events (MQTT, HTTP, etc.).
"""
from ..runtime_core.universal_agent_interface import UniversalAgentInterface

class IoTAgent(UniversalAgentInterface):
    def __init__(self, event_bus):
        self.event_bus = event_bus
        self.event_bus.subscribe('iot_event', self.on_iot_event)
    def on_iot_event(self, event):
        print(f"[IoTAgent] IoT event: {event.get('device_id')} {event.get('status')}")
        # Add logic to trigger automations, alerts, etc.
    def step(self):
        pass
