import pytest
from unittest.mock import MagicMock, AsyncMock
from core.mobius_orchestrator import MobiusOrchestrator
from core.providers.router import ProviderRouter
from core.providers.base import ProviderResponse

@pytest.fixture
def mock_provider_router():
    router = MagicMock(spec=ProviderRouter)
    # Configure the mock's async method
    router.choose_and_call = AsyncMock()
    return router

@pytest.mark.asyncio
async def test_mobius_initialization(mock_provider_router):
    """Tests that MobiusOrchestrator initializes correctly."""
    agents = ["agent_007", "agent_47"]
    mobius = MobiusOrchestrator(agents=agents, provider_router=mock_provider_router)
    assert mobius.agents == agents
    assert mobius.provider_router is mock_provider_router

@pytest.mark.asyncio
async def test_mobius_initialization_fails_with_no_agents(mock_provider_router):
    """Tests that initialization fails if no agents are provided."""
    with pytest.raises(ValueError, match="requires at least one agent"):
        MobiusOrchestrator(agents=[], provider_router=mock_provider_router)

def test_strategy_phase_passthrough():
    """Tests the strategy phase simply passes tasks through for now."""
    # This is a synchronous method, so it can be tested without async
    mobius = MobiusOrchestrator(agents=["agent_1"], provider_router=MagicMock())
    tasks = ["task_a", "task_b"]
    plan = mobius.strategy_phase(tasks)
    assert plan == tasks

@pytest.mark.asyncio
async def test_execution_phase_successful(mock_provider_router):
    """Tests a successful execution phase where all providers complete."""
    mobius = MobiusOrchestrator(agents=["agent_1"], provider_router=mock_provider_router)
    plan = ["task_alpha", "task_beta"]
    
    # Configure the mock router to return predictable async results
    mock_provider_router.choose_and_call.side_effect = [
        ProviderResponse(output="res1", tokens_used=1, latency_ms=100, cost=0.001),
        ProviderResponse(output="res2", tokens_used=1, latency_ms=120, cost=0.002),
    ]

    results = await mobius.execution_phase(plan)

    assert len(results) == 2
    assert mock_provider_router.choose_and_call.call_count == 2
    assert results[0].task_name == 'task_alpha'
    assert results[0].status == 'completed'
    assert results[0].cost_usd == pytest.approx(0.001)

@pytest.mark.asyncio
async def test_execution_phase_handles_provider_failure(mock_provider_router):
    """Tests that the execution phase gracefully handles an exception from a provider."""
    mobius = MobiusOrchestrator(agents=["agent_1"], provider_router=mock_provider_router)
    plan = ["task_gamma"]

    # Configure the mock to raise an exception
    mock_provider_router.choose_and_call.side_effect = RuntimeError("Provider API is down")

    results = await mobius.execution_phase(plan)

    assert len(results) == 1
    assert results[0].task_name == 'task_gamma'
    assert results[0].status == 'failed'
    assert "Provider API is down" in results[0].error_message