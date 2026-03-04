import pytest
from unittest.mock import patch
from core.mobius import MobiusOrchestrator
from core.contracts import TaskResult

def test_mobius_initialization():
    """Tests that MobiusOrchestrator initializes correctly."""
    agents = ["agent_007", "agent_47"]
    mobius = MobiusOrchestrator(agents=agents)
    assert mobius.agents == agents

def test_mobius_initialization_fails_with_no_agents():
    """Tests that initialization fails if no agents are provided."""
    with pytest.raises(ValueError, match="requires at least one agent"):
        MobiusOrchestrator(agents=[])

def test_strategy_phase_passthrough():
    """Tests the strategy phase simply passes tasks through for now."""
    mobius = MobiusOrchestrator(agents=["agent_1"])
    tasks = ["task_a", "task_b"]
    plan = mobius.strategy_phase(tasks)
    assert plan == tasks

# Use patch to mock the sim_engine dependency, a best practice for unit testing
@patch('core.mobius.sim_engine', autospec=True)
def test_execution_phase_successful(mock_sim_engine):
    """Tests a successful execution phase where all simulations complete."""
    # 1. Setup
    mobius = MobiusOrchestrator(agents=["agent_1"])
    plan = ["task_alpha", "task_beta"]
    
    # Configure the mock sim_engine to return predictable results
    mock_sim_engine.run_simulation.side_effect = [
        {"simulation_id": "sim_1", "metrics": {"accuracy": 0.9}},
        {"simulation_id": "sim_2", "metrics": {"accuracy": 0.8}}
    ]

    # 2. Execution
    results = mobius.execution_phase(plan)

    # 3. Assertions
    assert len(results) == 2
    assert mock_sim_engine.run_simulation.call_count == 2
    
    # Check that the results were correctly augmented with task name and status
    assert results[0].task_name == 'task_alpha'
    assert results[0].status == 'completed'
    assert results[0].metrics.accuracy == 0.9
    
    assert results[1].task_name == 'task_beta'
    assert results[1].status == 'completed'

@patch('core.mobius.sim_engine', autospec=True)
def test_execution_phase_handles_simulation_failure(mock_sim_engine):
    """Tests that the execution phase gracefully handles an exception from the simulation."""
    mobius = MobiusOrchestrator(agents=["agent_1"])
    plan = ["task_gamma"]

    # Configure the mock to raise an exception
    mock_sim_engine.run_simulation.side_effect = RuntimeError("Simulation engine exploded")

    results = mobius.execution_phase(plan)

    assert len(results) == 1
    assert results[0].task_name == 'task_gamma'
    assert results[0].status == 'failed'
    assert "Simulation engine exploded" in results[0].error_message

def test_execution_phase_with_empty_plan():
    """Tests that an empty plan results in an empty list of results."""
    mobius = MobiusOrchestrator(agents=["agent_1"])
    results = mobius.execution_phase([])
    assert results == []