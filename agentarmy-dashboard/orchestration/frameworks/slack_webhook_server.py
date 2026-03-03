"""
slack_webhook_server.py
----------------------
A minimal Flask server to receive Slack events and dispatch them to the SlackTrigger in your runtime.
"""
from flask import Flask, request, jsonify
import os

# Import your orchestrator and SlackTrigger
from ..runtime_core.runtime_orchestrator import RuntimeOrchestrator

# Initialize orchestrator (singleton for demo; in production, use your app's orchestrator instance)
orchestrator = RuntimeOrchestrator()
slack_trigger = orchestrator.slack_trigger

app = Flask(__name__)

@app.route('/slack/events', methods=['POST'])
def slack_events():
    data = request.json
    # Slack URL verification challenge
    if data.get('type') == 'url_verification':
        return jsonify({'challenge': data['challenge']})
    # Pass event to SlackTrigger
    if 'event' in data:
        slack_trigger.handle_event(data['event'])
    return jsonify({'ok': True})

if __name__ == '__main__':
    port = int(os.environ.get('SLACK_WEBHOOK_PORT', 5005))
    # For development, bind to localhost only. Change to '0.0.0.0' for production if needed.
    app.run(host='127.0.0.1', port=port)
