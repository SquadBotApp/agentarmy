import pytest
from agentarmy.core.orchestrator import Orchestrator

def test_kernel_smoke():
    input_data = [
        {'name': 'Write spec', 'duration': 3, 'dependencies': [], 'type': 'writer'},
        {'name': 'Research market', 'duration': 2, 'dependencies': ['Write spec'], 'type': 'researcher'},
        {'name': 'Analyze risks', 'duration': 1, 'dependencies': ['Research market'], 'type': 'analyst'},
    ]
    orchestrator = Orchestrator()
    result = orchestrator.run(input_data)
    assert 'Governed:' in result
    assert 'optimized' in str(result)