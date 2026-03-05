"""
Tests for the Recursive Engine
"""

from __future__ import annotations

import pytest

from core.recursive.recursive_engine import RecursiveEngine


def _sample_job_result() -> dict:
    """Sample job result for testing"""
    
    return {
        "job_id": "job-1",
        "tasks": [
            {
                "task_id": "t1",
                "provider": "openai",
                "success": True,
                "latency_ms": 120,
                "cost_usd": 0.01,
                "zpe_score": 0.8,
                "metadata": {"kind": "plan"},
            },
            {
                "task_id": "t2",
                "provider": "claude",
                "success": False,
                "latency_ms": 300,
                "cost_usd": 0.02,
                "zpe_score": 0.4,
                "metadata": {"kind": "write"},
            },
            {
                "task_id": "t3",
                "provider": "openai",
                "success": True,
                "latency_ms": 90,
                "cost_usd": 0.015,
                "zpe_score": 0.9,
                "metadata": {"kind": "refine"},
            },
        ],
    }


def test_recursive_engine_ingests_and_updates_scores():
    """Test that RecursiveEngine ingests job results and updates scores"""
    
    engine = RecursiveEngine()
    engine.ingest_job_result(_sample_job_result())
    
    routing_scores = engine.get_routing_scores()
    provider_zpe = engine.get_provider_zpe()
    
    # Check that providers were tracked
    assert "openai" in routing_scores
    assert "claude" in routing_scores
    assert "openai" in provider_zpe
    assert "claude" in provider_zpe
    
    # openai should have higher ZPE than claude in this sample
    # (t1: 0.8, t3: 0.9 -> avg 0.85 vs t2: 0.4)
    assert provider_zpe["openai"] > provider_zpe["claude"]


def test_recursive_engine_tracks_job_history():
    """Test that job history is stored and retrievable"""
    
    engine = RecursiveEngine()
    job_result = _sample_job_result()
    engine.ingest_job_result(job_result)
    
    job_record = engine.get_job_history("job-1")
    
    assert job_record is not None
    assert job_record.job_id == "job-1"
    assert len(job_record.tasks) == 3


def test_recursive_engine_computes_job_zpe():
    """Test that job-level ZPE scores are computed"""
    
    engine = RecursiveEngine()
    engine.ingest_job_result(_sample_job_result())
    
    job_zpe = engine.get_job_zpe("job-1")
    
    # Average of 0.8, 0.4, 0.9 = 0.7
    assert job_zpe is not None
    assert abs(job_zpe - 0.7) < 0.01


def test_recursive_engine_stores_insights():
    """Test that insights are stored and retrievable"""
    
    engine = RecursiveEngine()
    engine.ingest_job_result(_sample_job_result())
    
    insights = engine.get_all_insights()
    
    assert len(insights) > 0
    assert insights[0][0] == "job-1"
    
    patterns = insights[0][1]
    assert "openai" in patterns
    assert "claude" in patterns


def test_recursive_engine_multiple_jobs():
    """Test that engine handles multiple jobs correctly"""
    
    engine = RecursiveEngine()
    
    # First job
    job1 = _sample_job_result()
    engine.ingest_job_result(job1)
    
    # Second job with different results
    job2 = {
        "job_id": "job-2",
        "tasks": [
            {
                "task_id": "t4",
                "provider": "openai",
                "success": False,
                "latency_ms": 200,
                "cost_usd": 0.02,
                "zpe_score": 0.3,
                "metadata": {"kind": "analyze"},
            },
            {
                "task_id": "t5",
                "provider": "claude",
                "success": True,
                "latency_ms": 150,
                "cost_usd": 0.015,
                "zpe_score": 0.85,
                "metadata": {"kind": "refine"},
            },
        ],
    }
    engine.ingest_job_result(job2)
    
    # Check that both jobs are tracked
    job1_record = engine.get_job_history("job-1")
    job2_record = engine.get_job_history("job-2")
    
    assert job1_record is not None
    assert job2_record is not None
    assert len(job1_record.tasks) == 3
    assert len(job2_record.tasks) == 2
    
    # Check that scores reflect both jobs
    provider_zpe = engine.get_provider_zpe()
    assert provider_zpe["openai"] < provider_zpe["claude"]  # Claude improved in job2
