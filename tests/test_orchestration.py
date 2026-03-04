# Test for Orchestrator
import pytest
from unittest.mock import MagicMock
from core.orchestration import Orchestrator
from core.expansion import ExpansionManager
from core.mobius import MobiusOrchestrator
from core.reflection import ReflectionEngine
from core.contracts import TaskResult


def test_orchestrator_single_cycle():
    """
    Tests that the orchestrator correctly executes one full cycle,
    calling its dependencies in the correct order with the correct arguments.
    """
    # 1. Setup
    agents = ["agent1", "agent2"]
    initial_tasks = ["task1", "task2"]
    
    # Mock dependencies to isolate the Orchestrator's logic
    mock_expansion = MagicMock(spec=ExpansionManager)
    mock_mobius = MagicMock(spec=MobiusOrchestrator)
    mock_reflection = MagicMock(spec=ReflectionEngine)

    # Define mock return values to control the flow of the cycle
    mock_plan = ["planned_task1", "planned_task2"]
    mock_results = [
        TaskResult(task_name='planned_task1', status='completed'),
        TaskResult(task_name='planned_task2', status='failed')
    ]
    mock_new_tasks = ["new_task1"]
    
    mock_mobius.strategy_phase.return_value = mock_plan
    mock_mobius.execution_phase.return_value = mock_results
    mock_reflection.update_lessons.return_value = mock_new_tasks

    # 2. Execution
    orch = Orchestrator(agents, initial_tasks, mock_expansion, mock_mobius, mock_reflection)
    orch.run(max_cycles=1)

    # 3. Assertions
    # Verify that the dependencies were called correctly and in order
    mock_mobius.strategy_phase.assert_called_once_with(initial_tasks)
    mock_mobius.execution_phase.assert_called_once_with(mock_plan)
    mock_reflection.after_task.assert_called_once_with(mock_plan, mock_results)
    mock_expansion.should_expand.assert_called_once_with(mock_results)
    mock_reflection.update_lessons.assert_called_once_with(mock_results)
    
    # Verify the orchestrator's internal state was updated
    assert orch.tasks == mock_new_tasks


def test_orchestrator_handles_empty_tasks():
    """
    Tests that the orchestrator can run a cycle with no initial tasks
    without crashing and calls dependencies with empty lists.
    """
    # Setup
    mock_expansion = MagicMock(spec=ExpansionManager)
    mock_mobius = MagicMock(spec=MobiusOrchestrator)
    mock_reflection = MagicMock(spec=ReflectionEngine)

    # Execution
    orch = Orchestrator(agents=["agent1"], tasks=[], expansion_manager=mock_expansion, mobius=mock_mobius, reflection=mock_reflection)
    orch.run(max_cycles=1)

    # Assertions
    mock_mobius.strategy_phase.assert_called_once_with([])
    mock_mobius.execution_phase.assert_called_once()
    mock_reflection.after_task.assert_called_once()
    mock_expansion.should_expand.assert_called_once()
    mock_reflection.update_lessons.assert_called_once()


def test_orchestrator_expands_agent_pool_on_recommendation():
    """
    Tests that the orchestrator adds a new agent when the expansion manager returns True.
    """
    # 1. Setup
    agents = ["agent_1", "agent_2"]
    mock_expansion = MagicMock(spec=ExpansionManager)
    mock_mobius = MagicMock(spec=MobiusOrchestrator)
    mock_reflection = MagicMock(spec=ReflectionEngine)

    # Configure mock to recommend expansion
    mock_expansion.should_expand.return_value = True

    # 2. Execution
    orch = Orchestrator(agents, tasks=[], expansion_manager=mock_expansion, mobius=mock_mobius, reflection=mock_reflection)
    initial_agent_count = len(orch.agents)
    orch.run(max_cycles=1)

    # 3. Assertions
    assert len(orch.agents) == initial_agent_count + 1, "Agent pool should have grown by one"
    assert orch.agents[-1] == f"agent_{initial_agent_count + 1}", "The new agent's name is incorrect"
    mock_expansion.should_expand.assert_called_once()


def test_orchestrator_does_not_expand_without_recommendation():
    """
    Tests that the orchestrator does not add a new agent when the expansion manager returns False.
    """
    # 1. Setup
    agents = ["agent_1", "agent_2"]
    mock_expansion = MagicMock(spec=ExpansionManager)
    mock_mobius = MagicMock(spec=MobiusOrchestrator)
    mock_reflection = MagicMock(spec=ReflectionEngine)

    # Configure mock to NOT recommend expansion
    mock_expansion.should_expand.return_value = False

    # 2. Execution
    orch = Orchestrator(agents, tasks=[], expansion_manager=mock_expansion, mobius=mock_mobius, reflection=mock_reflection)
    initial_agent_count = len(orch.agents)
    orch.run(max_cycles=1)

    # 3. Assertions
    assert len(orch.agents) == initial_agent_count, "Agent pool should not have changed"
    mock_expansion.should_expand.assert_called_once()
