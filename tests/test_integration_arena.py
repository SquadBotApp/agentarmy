import pytest
from agentarmy.core.orchestrator import Orchestrator
from agentarmy.expansion.expansion_369 import Expansion369
from agentarmy.intel.competitive_intel import CompetitiveIntel
from agentarmy.core.compliance import Compliance

def test_integration_arena():
    # Simulate a full run with expansion, competitive intel, and compliance
    orchestrator = Orchestrator()
    expansion = Expansion369()
    intel = CompetitiveIntel()
    compliance = Compliance()

    # Seed tasks
    seed_tasks = [{"id": "seed1", "prompt": "Optimize cloud cost"}]
    expanded_tasks = expansion.expand(seed_tasks)
    # Run all expanded tasks through orchestrator
    results = []
    for t in expanded_tasks:
        out = orchestrator.recursive_engine.run(t)
        # Simulate provider/intel recording
        intel.record_result("agent-007", "openai", {"score": 0.99, "status": "success"})
        results.append({"task": t, "result": out})
    # Check competitive intel
    top = intel.top_performers()
    assert top, "Competitive intel should return top performers"
    # Check compliance
    compliant = compliance.enforce([t["task"] for t in results])
    assert compliant, "All actions should be compliant in this test"
    # Arena: ensure at least one result contains expected output
    assert any("Optimize cloud cost" in r["result"] for r in results)
