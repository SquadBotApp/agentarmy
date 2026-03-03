"""
SlackEchoAgent: Example agent that listens for Slack messages and echoes them back (mind-blowing event-driven demo).
"""
from ..runtime_core.universal_agent_interface import UniversalAgentInterface

class SlackEchoAgent(UniversalAgentInterface):
    def __init__(self, event_bus, slack_client=None):
        self.event_bus = event_bus
        self.slack_client = slack_client  # Optionally inject a Slack WebClient for replies
        self.event_bus.subscribe('slack_message', self.on_slack_message)

    def on_slack_message(self, event):
        user = event.get('user')
        text = event.get('text')
        channel = event.get('channel')
        if user and text and channel:
            print(f"[SlackEchoAgent] Echoing: {text} (from {user})")
            # If a Slack client is provided, send a reply (requires Slack Bot Token)
            if self.slack_client:
                self.slack_client.chat_postMessage(channel=channel, text=f"Echo: {text}")

    def step(self):
        pass  # No-op for this demo agent
