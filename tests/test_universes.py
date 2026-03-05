import pytest
from core.contracts.types import TaskResult
from core.universes.selector import UniverseSelector
from core.universes.universes import Universes
from core.universes.collapse import UniverseCollapse

# --- Synthetic test cases ---

def make_task_result(task_id, provider, zpe, success=True):
    return TaskResult(
        task_id=task_id,
        provider=provider,
        success=success,
        output=f"output_{task_id}",
        metadata={"zpe_score": zpe}
    )

def test_low_complexity():
    # 1 provider, low ZPE variance, all success
    results = [make_task_result(f"t{i}", "openai", 0.5) for i in range(3)]
    selector = UniverseSelector()
    count = selector.select(results)
    assert count == 3
    universes = Universes(count).expand_results(results)
    assert len(universes) == 3
    collapse = UniverseCollapse().collapse(universes)
    assert collapse["final"] is not None
    assert all(len(u) > 0 for u in universes)

def test_medium_complexity():
    # 2 providers, moderate ZPE spread
    results = [
        make_task_result("t1", "openai", 0.4),
        make_task_result("t2", "claude", 0.7),
        make_task_result("t3", "openai", 0.6),
        make_task_result("t4", "claude", 0.8),
        make_task_result("t5", "openai", 0.5),
        make_task_result("t6", "claude", 0.6),
    ]
    selector = UniverseSelector()
    count = selector.select(results)
    assert count == 6
    universes = Universes(count).expand_results(results)
    assert len(universes) == 6
    collapse = UniverseCollapse().collapse(universes)
    assert collapse["final"] is not None
    assert all(len(u) > 0 for u in universes)

def test_high_complexity():
    # 3 providers, high ZPE variance, mixed success
    results = [
        make_task_result("t1", "openai", 0.2, True),
        make_task_result("t2", "claude", 0.9, False),
        make_task_result("t3", "anthropic", 0.1, True),
        make_task_result("t4", "openai", 0.8, False),
        make_task_result("t5", "claude", 0.3, True),
        make_task_result("t6", "anthropic", 0.95, True),
        make_task_result("t7", "openai", 0.7, True),
        make_task_result("t8", "claude", 0.2, False),
        make_task_result("t9", "anthropic", 0.85, True),
    ]
    selector = UniverseSelector()
    count = selector.select(results)
    assert count == 9
    universes = Universes(count).expand_results(results)
    assert len(universes) == 9
    collapse = UniverseCollapse().collapse(universes)
    assert collapse["final"] is not None
    assert all(len(u) > 0 for u in universes)

if __name__ == "__main__":
    pytest.main([__file__])
