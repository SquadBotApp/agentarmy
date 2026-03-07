import pytest
from agentarmy.core.orchestrator import Orchestrator

def test_lifecycle_dashboard():
    orchestrator = Orchestrator()
    # Simulate a full lifecycle: plan, execute, synthesize, optimize, govern
    input_data = [
        {'name': 'Write docs', 'duration': 2, 'dependencies': [], 'type': 'writer'},
        {'name': 'Review code', 'duration': 1, 'dependencies': ['Write docs'], 'type': 'reviewer'},
        {'name': 'Deploy app', 'duration': 1, 'dependencies': ['Review code'], 'type': 'devops'},
    ]
    result = orchestrator.run(input_data)
    # Dashboard: check for expected output
    assert 'Governed:' in result
    assert 'optimized' in str(result)
    # Simulate dashboard log update (demo)
    log = [f"Task: {t['name']} completed" for t in input_data]
    assert any('Task:' in l for l in log)
