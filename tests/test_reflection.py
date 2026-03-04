import pytest
from core.reflection import ReflectionEngine

# Mock results data with a consistent structure
SUCCESSFUL_RESULTS = [
    {'task_name': 'process_data', 'status': 'completed', 'metrics': {'accuracy': 0.99}},
    {'task_name': 'generate_report', 'status': 'completed'}
]

FAILED_RESULTS = [
    {'task_name': 'fetch_api_data', 'status': 'failed', 'error': 'Timeout'},
]

MIXED_RESULTS = [
    {'task_name': 'process_data', 'status': 'completed'},
    {'task_name': 'fetch_api_data', 'status': 'failed', 'error': '404 Not Found'}
]

MALFORMED_RESULTS = [
    {'task_name': 'legacy_job', 'info': 'job ran'}, # No 'status' key
    {} # Empty dict
]

def test_reflection_engine_initialization():
    """Tests that the ReflectionEngine initializes correctly."""
    engine = ReflectionEngine()
    assert engine.lessons_learned == []

def test_update_lessons_on_successful_results():
    """Tests that follow-up tasks are generated for successful results."""
    engine = ReflectionEngine()
    new_tasks = engine.update_lessons(SUCCESSFUL_RESULTS)
    assert len(new_tasks) == 2
    assert "verify_and_document_process_data" in new_tasks
    assert "verify_and_document_generate_report" in new_tasks

def test_update_lessons_on_failed_results():
    """Tests that retry tasks are generated for failed results."""
    engine = ReflectionEngine()
    new_tasks = engine.update_lessons(FAILED_RESULTS)
    assert len(new_tasks) == 1
    assert "retry_and_debug_fetch_api_data" in new_tasks

def test_update_lessons_on_mixed_results():
    """Tests that correct tasks are generated for a mix of success and failure."""
    engine = ReflectionEngine()
    new_tasks = engine.update_lessons(MIXED_RESULTS)
    assert len(new_tasks) == 2
    assert "verify_and_document_process_data" in new_tasks
    assert "retry_and_debug_fetch_api_data" in new_tasks

def test_update_lessons_handles_malformed_results():
    """Tests that the engine handles results with missing keys gracefully."""
    engine = ReflectionEngine()
    new_tasks = engine.update_lessons(MALFORMED_RESULTS)
    assert new_tasks == [], "Should not generate tasks for results with unknown status"

def test_update_lessons_handles_empty_input():
    """Tests that the engine returns an empty list for empty input."""
    engine = ReflectionEngine()
    assert engine.update_lessons([]) == []