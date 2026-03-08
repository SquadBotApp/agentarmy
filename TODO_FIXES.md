# Test Fixes TODO List

## Phase 1: Critical Issues (Blocking Multiple Tests)

### 1.1 ExpansionManager - should_expand logic
- File: `core/expansion/manager.py`
- Issue: should_expand returns True for poor performance and empty results
- Tests: test_should_not_expand_on_poor_performance, test_handles_empty_or_invalid_results, test_should_expand_false_when_all_failed

### 1.2 ExpansionManager - get_expansion_count logic  
- File: `core/expansion/manager.py`
- Issue: Returns wrong counts for edge cases
- Tests: test_expansion_count_one_when_positive_average_score_no_results, test_expansion_count_two_when_both_conditions_met

### 1.3 Orchestration - MagicMock format issue
- File: `core/orchestration.py`
- Issue: Line 82 - zpe_score:.2f fails with MagicMock
- Tests: test_orchestrator_single_cycle, test_orchestrator_handles_empty_tasks, etc.

### 1.4 UniverseManager - estimate_complexity gets list
- File: `core/expansion/universes.py`  
- Issue: expand_results passes list but estimate_complexity expects string
- Tests: test_low_complexity, test_medium_complexity

### 1.5 ZPE Score - String vs TaskResult handling
- File: `optimization/zpe.py`
- Issue: score() expects TaskResult but gets strings
- Tests: test_kernel_smoke, test_lifecycle_dashboard

## Phase 2: Component-Specific Issues

### 2.1 MobiusOrchestrator - execution_phase doesn't use router
- File: `core/mobius_orchestrator.py`
- Issue: execution_phase doesn't call provider_router
- Tests: test_execution_phase_successful, test_execution_phase_handles_provider_failure

### 2.2 ComplianceEngine - missing enforce method
- File: `core/compliance.py`
- Issue: Missing enforce() method
- Tests: test_integration_arena

### 2.3 Mobius - missing modelslab_llm
- File: `core/mobius.py` or `core/mobius_orchestrator.py`
- Issue: Missing modelslab_llm function reference
- Tests: test_hive_mind_generates_tasks

### 2.4 Safety - violence classification
- Issue: 'kill' keyword not detected as violence
- Tests: test_classify_violence

### 2.5 MobiusLoop - checkpoint_variant
- File: `core/mobius/mobius_loop.py`
- Issue: refine_with_checkpoints not inserting validation tasks
- Tests: test_checkpoint_variant

### 2.6 Recursive Engine - multiple jobs logic
- Issue: ZPE score calculation for multiple jobs
- Tests: test_recursive_engine_multiple_jobs

### 2.7 Provider Integration - async run
- File: `tests/test_provider_integration.py`
- Issue: orch.run() is async but not awaited
- Tests: test_orchestrator_with_provider_routing

### 2.8 E2E Test - no new tasks generated
- Issue: reflection.update_lessons returns empty list
- Tests: test_agentarmy_e2e

