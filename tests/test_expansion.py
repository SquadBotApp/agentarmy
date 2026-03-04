import pytest
from core.expansion import ExpansionManager

# Mock results data based on a potential sim_engine.py output
GOOD_RESULTS = [
    {'metrics': {'accuracy': 0.95}},
    {'metrics': {'accuracy': 0.98}}
]
POOR_RESULTS = [
    {'metrics': {'accuracy': 0.75}},
    {'metrics': {'accuracy': 0.80}}
]
MIXED_RESULTS = [
    {'metrics': {'accuracy': 0.99}},
    {'metrics': {'accuracy': 0.81}} # Average is 0.9
]
EMPTY_RESULTS = []
INVALID_RESULTS = [
    {'data': 'no_metrics_here'},
    {}
]

def test_expansion_manager_initialization():
    """Tests that the ExpansionManager initializes correctly."""
    manager = ExpansionManager(performance_threshold=0.85, cooldown_cycles=10)
    assert manager.performance_threshold == 0.85
    assert manager.cooldown_cycles == 10
    # Should start ready to expand (i.e., not on cooldown)
    assert manager.cycles_since_expansion >= manager.cooldown_cycles

def test_invalid_threshold_raises_error():
    """Tests that an invalid performance threshold raises a ValueError."""
    with pytest.raises(ValueError, match="performance_threshold must be between 0 and 1."):
        ExpansionManager(performance_threshold=1.1)
    with pytest.raises(ValueError):
        ExpansionManager(performance_threshold=0)

def test_should_expand_on_good_performance():
    """Tests that expansion is recommended with high performance results."""
    manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)
    assert manager.should_expand(GOOD_RESULTS) is True

def test_should_not_expand_on_poor_performance():
    """Tests that expansion is not recommended with low performance results."""
    manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)
    assert manager.should_expand(POOR_RESULTS) is False

def test_should_expand_on_exact_threshold():
    """Tests expansion when performance is exactly at the threshold."""
    manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)
    assert manager.should_expand(MIXED_RESULTS) is True

def test_expansion_cooldown_prevents_immediate_re_expansion():
    """Tests that the cooldown period prevents rapid expansion."""
    manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)
    
    # First expansion should succeed
    assert manager.should_expand(GOOD_RESULTS) is True
    # Subsequent calls within cooldown period should fail
    assert manager.should_expand(GOOD_RESULTS) is False
    assert manager.should_expand(GOOD_RESULTS) is False
    assert manager.should_expand(GOOD_RESULTS) is False
    # After cooldown, expansion should be possible again
    assert manager.should_expand(GOOD_RESULTS) is True

def test_handles_empty_or_invalid_results():
    """Tests that the manager handles empty or malformed results gracefully."""
    manager = ExpansionManager(performance_threshold=0.9)
    assert manager.should_expand(EMPTY_RESULTS) is False
    assert manager.should_expand(INVALID_RESULTS) is False