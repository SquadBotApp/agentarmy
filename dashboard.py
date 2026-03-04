from flask import Flask, render_template, jsonify
import threading

# Shared state between the orchestrator and the dashboard.
# The lock ensures that we don't have race conditions when one thread
# is writing to the state while another is reading it.
shared_state = {
    'agents': [],
    'tasks': [],
    'log': []
}
lock = threading.Lock()

app = Flask(__name__)

@app.route('/')
def index():
    """Serve the main dashboard page."""
    return render_template('dashboard.html')

@app.route('/state')
def get_state():
    """Provide the current state of the agent army as JSON."""
    with lock:
        return jsonify(shared_state)