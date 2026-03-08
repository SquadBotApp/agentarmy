# AgentArmyOS Full Project Audit - Cleanup Plan

## Phase 1: Core Architecture Fixes
- [x] 1.1 Fix core/contracts/__init__.py - Create proper exports from core.models
- [ ] 1.2 Ensure core/orchestrator.py works with TaskResult from core.models
- [ ] 1.3 Update imports in core/providers/__init__.py if needed

## Phase 2: Remove Legacy Tests
- [ ] 2.1 Remove test_governance_safety.py (tests legacy governance module)
- [ ] 2.2 Remove test_expansion_extended.py (tests legacy expansion)
- [ ] 2.3 Remove test_hivemind.py (legacy hivemind)
- [ ] 2.4 Remove test_integration_arena.py (legacy integration)
- [ ] 2.5 Remove test_kernel_smoke.py (legacy kernel)
- [ ] 2.6 Remove test_lifecycle_dashboard.py (legacy dashboard)
- [ ] 2.7 Remove test_mobius_loop.py (legacy mobius loop)
- [ ] 2.8 Remove test_recursive_engine.py (legacy recursive)
- [ ] 2.9 Remove test_universes.py (legacy universes)

## Phase 3: Clean Legacy Core Modules
- [ ] 3.1 Remove core/planner.py (legacy)
- [ ] 3.2 Remove core/router.py (legacy - conflicts with providers)
- [ ] 3.3 Remove core/orchestration.py (legacy)
- [ ] 3.4 Remove core/mobius.py (legacy)
- [ ] 3.5 Remove core/mobius_orchestrator.py (legacy)
- [ ] 3.6 Remove core/compliance.py (legacy governance)
- [ ] 3.7 Remove core/expansion/ directory (legacy)
- [ ] 3.8 Remove core/recursive/ directory (legacy)
- [ ] 3.9 Remove core/universes/ directory (legacy)
- [ ] 3.10 Remove core/bounded_growth.py (legacy)
- [ ] 3.11 Remove optimization/zpe.py (legacy)
- [ ] 3.12 Remove core/database.py (not needed for Option B)

## Phase 4: Fix Remaining Tests
- [ ] 4.1 Update tests that have minor issues
- [ ] 4.2 Ensure test_provider_router.py passes
- [ ] 4.3 Ensure test_orchestrator.py passes
- [ ] 4.4 Ensure test_mobius.py passes (if applicable)

## Phase 5: Verify & Commit
- [ ] 5.1 Run full test suite
- [ ] 5.2 Fix any remaining issues
- [ ] 5.3 Stage and commit changes

