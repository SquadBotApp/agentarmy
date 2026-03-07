import pytest
from core.orchestration import Orchestrator
from core.expansion import ExpansionManager
from core.mobius import MobiusOrchestrator
from core.reflection import ReflectionEngine
from integration.router import MultiPlatformRouter
from providers.openai import OpenAIProvider
from providers.claude import ClaudeProvider

@pytest.mark.asyncio
async def test_orchestrator_with_provider_routing():
    agents = ["agent1", "agent2"]
    tasks = ["chat", "summarize"]
    expansion = ExpansionManager(performance_threshold=0.8, cooldown_cycles=1)
    router = MultiPlatformRouter()
    router.add_provider("openai", OpenAIProvider())
    router.add_provider("claude", ClaudeProvider())
    mobius = MobiusOrchestrator(agents=agents, provider_router=router)
    reflection = ReflectionEngine()
    orch = Orchestrator(agents, tasks, expansion, mobius, reflection)
    await orch.run(max_cycles=1)
    # After one cycle, tasks should be replaced by reflection tasks
    assert all(t.startswith("verify_and_document_") or t.startswith("retry_and_debug_") for t in orch.tasks)
    # Log should mention Mobius loop and agent execution
    assert any("Mobius loop completed" in entry for entry in orch.log)
    assert any("Reflection phase updated task list" in entry for entry in orch.log)
