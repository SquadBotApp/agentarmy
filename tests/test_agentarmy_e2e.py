import pytest
import asyncio
from core.orchestration import Orchestrator
from core.expansion import ExpansionManager
from core.mobius import MobiusOrchestrator
from core.reflection import ReflectionEngine
from core.intel import CompetitiveIntelligence
from core.compliance import ComplianceEngine
from core.contracts import TaskResult
from optimization.zpe import ZPEngine
from expansion.meta_synthesizer import MetaSynthesizer
from core.providers.router import ProviderRouter
from core.providers.openai_provider import OpenAIProvider
from core.providers.claude_provider import ClaudeProvider

@pytest.mark.asyncio
async def test_agentarmy_e2e():
    """Tests the AgentArmy end-to-end process."""
    # 1. Define Initial State
    initial_agents = ["test_agent_1"]
    initial_tasks = ["write_a_spec"]

    # 2. Instantiate Core Components
    provider_router = ProviderRouter(
        providers=[OpenAIProvider(), ClaudeProvider()],
        strategy='round_robin'
    )
    expansion_manager = ExpansionManager(performance_threshold=0.8, cooldown_cycles=1)
    mobius_orchestrator = MobiusOrchestrator(agents=initial_agents, provider_router=provider_router)
    reflection_engine = ReflectionEngine()
    intel_module = CompetitiveIntelligence()
    compliance_engine = ComplianceEngine()
    zpe_engine = ZPEngine()
    meta_synth = MetaSynthesizer()
    
    # 3. Instantiate the Main Orchestrator
    orchestrator = Orchestrator(
        agents=initial_agents,
        tasks=initial_tasks,
        expansion_manager=expansion_manager,
        mobius=mobius_orchestrator,
        reflection=reflection_engine,
        meta_synthesizer=meta_synth,
        zpe=zpe_engine,
        universes=None, # Not testing universes in this E2E test
        intel=intel_module,
        compliance=compliance_engine,
        billing_engine=MagicMock(), # Not testing billing here
        bounded_growth_governor=None,
        shared_state=None,
        lock=None,
        initial_log=[]
    )
    
    # 4. Run the Orchestration Loop
    await orchestrator.run(max_cycles=2)

    # 5. Assertions
    assert len(orchestrator.tasks) > len(initial_tasks), "New tasks should be generated"
    assert len(orchestrator.agents) >= len(initial_agents), "Agent pool might expand"

    # Check for key phrases in the log to verify stages
    log_text = "\n".join(orchestrator.log)
    assert "Mobius loop completed" in log_text
    assert "Reflection phase updated task list" in log_text
    assert "Competitive Intel:" in log_text

    print(f"End-to-end test log: \n{log_text}")


    print(f"Final task count = {len(orchestrator.tasks)}")
    print(f"Final agents = {len(orchestrator.agents)}")


from unittest.mock import MagicMock