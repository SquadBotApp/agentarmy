import pytest
from unittest.mock import patch, MagicMock
import os

from core.orchestration import Orchestrator
from core.expansion import ExpansionManager
from core.mobius import MobiusOrchestrator
from core.reflection import ReflectionEngine
from core.intel import CompetitiveIntelligence
from core.compliance import ComplianceEngine
from optimization.zpe import ZPEngine

DEFAULT_TASKS = ["explore_system_capabilities", "optimize_internal_processes", "analyze_entropy"]

@pytest.mark.asyncio
async def test_hive_mind_generates_tasks():
    """Tests that the Hive Mind (LLM) generates new tasks and adds them to the system."""
    # 1. Mock LLM call to return a set of new tasks
    mock_llm_response = {"choices": [{"message": {"content": "task_llm_1, task_llm_2, task_llm_3"}}]}
    with patch("core.mobius.modelslab_llm.call_modelslab_llm", return_value=mock_llm_response) as mock_call_modelslab_llm:
        # 2. Instantiate Core Components
        expansion_manager = MagicMock(spec=ExpansionManager)
        reflection_engine = MagicMock(spec=ReflectionEngine)
        intel_module = MagicMock(spec=CompetitiveIntelligence)
        compliance_engine = MagicMock(spec=ComplianceEngine)
        zpe_engine = MagicMock(spec=ZPEngine)
        
        # Provider router needs to be mocked enough to initialize, but doesn't need to do anything for this test.
        mock_provider_router = MagicMock()
        mobius_orchestrator = MobiusOrchestrator(agents=["test_agent"], provider_router=mock_provider_router)

        # 3. Instantiate the Orchestrator with empty initial tasks
        orchestrator = Orchestrator(
            agents=["test_agent"], tasks=[], expansion_manager=expansion_manager, mobius=mobius_orchestrator, reflection=reflection_engine, meta_synthesizer=MagicMock(), zpe=zpe_engine, universes=None, intel=intel_module, compliance=compliance_engine, billing_engine=MagicMock(), bounded_growth_governor=None, shared_state=None, lock=None, initial_log=[]
        )

        # 4. Run the Orchestration Loop (which should trigger Hive Mind)
        await orchestrator.run(max_cycles=1)

        # 5. Assertions
        mock_call_modelslab_llm.assert_called_once()
        # The orchestrator should add all 3 tasks from LLM
        assert len(orchestrator.tasks) == 3
        assert "task_llm_1" in orchestrator.tasks
        assert "task_llm_2" in orchestrator.tasks
        assert "task_llm_3" in orchestrator.tasks

@pytest.mark.asyncio
async def test_hive_mind_falls_back_on_no_api_key():
    with patch.dict(os.environ, {"MODELSLAB_API_KEY": ""}, clear=True):
        # Simulate missing MODELSLAB_API_KEY by patching os.environ
        expansion_manager = MagicMock()
        mobius_orchestrator = MagicMock()
        reflection_engine = MagicMock()
        with pytest.raises(ValueError, match="MODELSLAB_API_KEY environment variable not set."):
            # Hive Mind is expected to fail, raising an error