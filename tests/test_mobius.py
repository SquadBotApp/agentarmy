import pytest
from unittest.mock import patch
from core.mobius import MobiusOrchestrator
from integration.router import MultiPlatformRouter
from providers.openai import OpenAIProvider
from providers.claude import ClaudeProvider
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


def test_execution_phase_successful():
    """Tests a successful execution phase where all providers complete."""
    router = MultiPlatformRouter()
    router.add_provider("openai", OpenAIProvider())
    router.add_provider("claude", ClaudeProvider())
    mobius = MobiusOrchestrator(agents=["agent_1"], provider_router=router)
    plan = ["chat", "summarize"]
    results = mobius.execution_phase(plan)
    assert len(results) == 2
    assert results[0].task_name == 'chat'
    assert results[0].status == 'completed'
    assert results[1].task_name == 'summarize'
    assert results[1].status == 'completed'


def test_execution_phase_handles_missing_provider():
    """Tests that the execution phase gracefully handles missing provider."""
    router = MultiPlatformRouter()
    # Do not add any providers
    mobius = MobiusOrchestrator(agents=["agent_1"], provider_router=router)
    plan = ["unknown_task_type"]
    results = mobius.execution_phase(plan)
    assert len(results) == 1
    assert results[0].task_name == 'unknown_task_type'
    assert results[0].status == 'failed'
    assert "No provider found for task" in results[0].error_message

def test_execution_phase_with_empty_plan():
    """Tests that an empty plan results in an empty list of results."""
    mobius = MobiusOrchestrator(agents=["agent_1"])
    results = mobius.execution_phase([])
    assert results == []