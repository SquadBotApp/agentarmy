"""
SlackTrigger: Handles incoming Slack events and dispatches them to the event bus.
"""
import json

class SlackTrigger:
    def __init__(self, runtime):
        self.runtime = runtime
        # Register this trigger with the event bus
        if hasattr(self.runtime, 'register_trigger'):
            self.runtime.register_trigger('slack', self)

    def handle_event(self, event):
        """
        Process an incoming Slack event and dispatch to the event bus.
        Args:
            event (dict): The Slack event payload.
        """
        # Example: Only handle message events
        if event.get('type') == 'message':
            self.runtime.dispatch_event({
                'source': 'slack',
                'event_type': 'slack_message',
                'user': event.get('user'),
                'text': event.get('text'),
                'channel': event.get('channel'),
                'ts': event.get('ts'),
                'raw': event
            })
        # Add more event types as needed

# Example usage (in orchestrator or runtime init):
# from .frameworks.slack_trigger import SlackTrigger
# slack_trigger = SlackTrigger(runtime)
