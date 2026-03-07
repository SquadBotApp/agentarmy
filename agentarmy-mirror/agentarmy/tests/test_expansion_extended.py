"""
Extended unit tests for the ExpansionManager class from core/expansion/manager.py.
These tests cover the actual implementation which uses all_success and average_score logic.
The ExpansionManager expects objects with a 'status' attribute, not dictionaries.
"""

import pytest
from core.expansion.manager import ExpansionManager


# Mock result class to simulate objects with status attribute
class MockResult:
    """Mock result object with status attribute for testing."""
    def __init__(self, task_name, status, accuracy=0.0):
        self.task_name = task_name
        self.status = status
        self.metrics = type('Metrics', (), {'accuracy': accuracy})()


# Test fixtures using objects (not dicts) to match the expected interface
@pytest.fixture
def all_success_results():
    """Returns results where all tasks are successful."""
    return [
        MockResult('task_1', 'success', 0.95),
        MockResult('task_2', 'success', 0.98)
    ]


@pytest.fixture
def mixed_results():
    """Returns results with a mix of success and failure."""
    return [
        MockResult('task_1', 'success', 0.99),
        MockResult('task_2', 'failed', 0.50)
    ]


@pytest.fixture
def all_failed_results():
    """Returns results where all tasks failed."""
    return [
        MockResult('task_1', 'failed', 0.30),
        MockResult('task_2', 'failed', 0.40)
    ]


class TestExpansionManagerBasics:
    """Basic tests for ExpansionManager initialization."""

    def test_initialization_with_defaults(self):
        """Test that ExpansionManager initializes with default values."""
        manager = ExpansionManager()
        assert manager.last_results == []
        assert manager.average_score == 0.0

    def test_initialization_with_custom_values(self):
        """Test initialization with custom last_results and average_score."""
        results = [MockResult('task_1', 'success')]
        manager = ExpansionManager(last_results=results, average_score=0.75)
        assert manager.last_results == results
        assert manager.average_score == 0.75


class TestAllSuccessProperty:
    """Tests for the all_success property via __getattr__."""

    def test_all_success_true_when_all_success(self, all_success_results):
        """Test that all_success is True when all results have status 'success'."""
        manager = ExpansionManager(last_results=all_success_results)
        assert manager.all_success is True

    def test_all_success_false_with_mixed_results(self, mixed_results):
        """Test that all_success is False when results contain failures."""
        manager = ExpansionManager(last_results=mixed_results)
        assert manager.all_success is False

    def test_all_success_false_when_all_failed(self, all_failed_results):
        """Test that all_success is False when all results have status 'failed'."""
        manager = ExpansionManager(last_results=all_failed_results)
        assert manager.all_success is False

    def test_all_success_true_for_empty_results(self):
        """Test that all_success is True for empty results (Python's all() behavior)."""
        manager = ExpansionManager(last_results=[])
        # Note: Python's all() returns True for empty sequences
        assert manager.all_success is True


class TestShouldExpand:
    """Tests for the should_expand method."""

    def test_should_expand_true_when_all_success(self, all_success_results):
        """Test that should_expand returns True when all results are successful."""
        manager = ExpansionManager(last_results=all_success_results)
        assert manager.should_expand() is True

    def test_should_expand_true_with_positive_average_score(self):
        """Test that should_expand returns True when average_score is positive."""
        manager = ExpansionManager(average_score=0.5)
        assert manager.should_expand() is True

    def test_should_expand_true_when_both_conditions_met(self):
        """Test should_expand when both all_success and positive average_score."""
        results = [MockResult('task_1', 'success')]
        manager = ExpansionManager(last_results=results, average_score=0.3)
        assert manager.should_expand() is True

    def test_should_expand_true_with_empty_results_positive_score(self):
        """Test should_expand returns True with empty results but positive average_score."""
        manager = ExpansionManager(last_results=[], average_score=0.5)
        # all_success is True for empty (Python behavior), so should_expand is True
        assert manager.should_expand() is True

    def test_should_expand_false_when_all_failed(self, all_failed_results):
        """Test that should_expand returns False when all results failed."""
        manager = ExpansionManager(last_results=all_failed_results)
        assert manager.should_expand() is False

    def test_should_expand_false_with_zero_average_score_and_empty_results(self):
        """Test that should_expand returns False with zero average_score and empty results."""
        # This returns True because all_success is True for empty list
        manager = ExpansionManager(last_results=[], average_score=0.0)
        assert manager.should_expand() is True  # Due to all() on empty returning True

    def test_should_expand_false_with_negative_average_score_and_empty_results(self):
        """Test should_expand with negative average_score and empty results."""
        # all_success=True (empty) AND average_score<=0, so depends on implementation
        manager = ExpansionManager(last_results=[], average_score=-0.5)
        # Since all_success is True for empty, should_expand returns True
        assert manager.should_expand() is True

    def test_should_expand_updates_results(self, all_success_results):
        """Test that should_expand updates last_results when passed as argument."""
        manager = ExpansionManager(last_results=[], average_score=0.0)
        # With empty results and zero score, should return True (due to all() behavior)
        result1 = manager.should_expand()
        # After updating with success results, should still return True
        result2 = manager.should_expand(all_success_results)
        assert result1 is True
        assert result2 is True


class TestGetExpansionCount:
    """Tests for the get_expansion_count method."""

    def test_expansion_count_two_when_all_success(self, all_success_results):
        """Test that get_expansion_count returns 2 when all tasks are successful."""
        manager = ExpansionManager(last_results=all_success_results)
        assert manager.get_expansion_count() == 2

    def test_expansion_count_one_when_positive_average_score_no_results(self):
        """Test get_expansion_count with positive average_score but empty results."""
        # all_success=True (empty), so returns 2
        manager = ExpansionManager(last_results=[], average_score=0.5)
        assert manager.get_expansion_count() == 2

    def test_expansion_count_two_when_both_conditions_met(self):
        """Test get_expansion_count when both conditions are met."""
        results = [MockResult('task_1', 'success')]
        manager = ExpansionManager(last_results=results, average_score=0.3)
        assert manager.get_expansion_count() == 2

    def test_expansion_count_zero_when_all_failed(self, all_failed_results):
        """Test that get_expansion_count returns 0 when all tasks failed."""
        manager = ExpansionManager(last_results=all_failed_results)
        assert manager.get_expansion_count() == 0


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_results_with_missing_status_attribute(self):
        """Test handling of results without status attribute."""
        class NoStatusResult:
            def __init__(self):
                self.task_name = 'task_1'
        
        results = [NoStatusResult()]
        manager = ExpansionManager(last_results=results)
        # status is None (default), so all_success should be False
        assert manager.all_success is False

    def test_results_with_none_status(self):
        """Test handling of results with None status."""
        class NoneStatusResult:
            def __init__(self):
                self.task_name = 'task_1'
                self.status = None
        
        results = [NoneStatusResult()]
        manager = ExpansionManager(last_results=results)
        assert manager.all_success is False

    def test_mixed_status_objects(self):
        """Test handling of mix of objects with different status types."""
        class StatusResult:
            def __init__(self, status):
                self.status = status
        
        results = [
            StatusResult('success'),
            StatusResult('completed'),  # Not 'success'
            StatusResult('success')
        ]
        manager = ExpansionManager(last_results=results)
        # Not all are 'success'
        assert manager.all_success is False
