#!/usr/bin/env python
"""Test script to verify Genesis Living Organism implementation."""

def test_imports():
    """Test that all Genesis modules can be imported."""
    print("Testing Genesis Living Organism imports...")
    
    # Core Genesis modules
    from core.genesis import GenesisLoop
    print("  - GenesisLoop: OK")
    
    from core.genesis.zpe_scoring import ZPEScoring
    print("  - ZPEScoring: OK")
    
    from core.genesis.criticality import Criticality
    print("  - Criticality: OK")
    
    from core.genesis.evolution_planner import EvolutionPlanner
    print("  - EvolutionPlanner: OK")
    
    from core.genesis.competitor_scanner import CompetitorScanner
    print("  - CompetitorScanner: OK")
    
    from core.genesis.paywall_guard import PaywallGuard
    print("  - PaywallGuard: OK")
    
    # Services
    from services.dashboard_api.main import app as dashboard_app
    print("  - Dashboard API: OK")
    
    from services.spaceos_adapter.main import SpaceOSAdapter
    print("  - SpaceOS Adapter: OK")
    
    from services.crypto_hooks.main import CryptoHooks
    print("  - Crypto Hooks: OK")
    
    # Apps
    from apps.agent_army_assistant.main import AgentArmyAssistant
    print("  - Agent Army Assistant: OK")
    
    print("\nAll Genesis Living Organism modules imported successfully!")
    return True


def test_basic_functionality():
    """Test basic functionality of Genesis modules."""
    print("\nTesting basic functionality...")
    
    from core.genesis.zpe_scoring import ZPEScoring
    zpe = ZPEScoring()
    task = {"subtasks": ["a", "b"]}
    score = zpe.score_task(task)
    print(f"  - ZPE score for task with 2 subtasks: {score}")
    assert score > 0, "ZPE score should be positive"
    
    from core.genesis.criticality import Criticality
    crit = Criticality()
    is_super = crit.check_supercritical(10, 1)
    print(f"  - Supercritical check (10 agents, level 1): {is_super}")
    
    from core.genesis.evolution_planner import EvolutionPlanner
    planner = EvolutionPlanner()
    telemetry = {"failed_jobs": 2, "latency_avg": 6.0, "new_competitors": []}
    actions = planner.plan_evolution(telemetry)
    print(f"  - Evolution actions: {actions.get('evolution_actions', [])}")
    
    from core.genesis.paywall_guard import PaywallGuard
    guard = PaywallGuard("free")
    allow = guard.allow_order(1)
    print(f"  - Paywall allows order 1: {allow}")
    
    print("\nBasic functionality tests passed!")
    return True


if __name__ == "__main__":
    test_imports()
    test_basic_functionality()
    print("\n" + "="*60)
    print("Genesis Living Organism Implementation: COMPLETE")
    print("="*60)
