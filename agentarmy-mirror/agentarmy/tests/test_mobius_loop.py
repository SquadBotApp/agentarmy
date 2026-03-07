"""
Tests for the Möbius Loop
"""

from __future__ import annotations

import pytest

from core.mobius import (
    MobiusLoop,
    FeedbackSignals,
    PlanRewriter,
    StrategyRefiner,
)
from core.recursive import RecursiveEngine


@pytest.fixture
def recursive_engine():
    """Create and populate recursive engine with sample data"""
    engine = RecursiveEngine()
    
    # Ingest sample job result to establish scores
    engine.ingest_job_result({
        "job_id": "test_job",
        "tasks": [
            {
                "task_id": "t1",
                "provider": "openai",
                "success": True,
                "latency_ms": 100,
                "cost_usd": 0.01,
                "zpe_score": 0.9,
                "metadata": {},
            },
            {
                "task_id": "t2",
                "provider": "claude",
                "success": False,
                "latency_ms": 300,
                "cost_usd": 0.02,
                "zpe_score": 0.3,
                "metadata": {},
            },
        ],
    })
    
    return engine


@pytest.fixture
def mobius_loop(recursive_engine):
    """Create a Möbius Loop instance"""
    return MobiusLoop(recursive_engine)


@pytest.fixture
def sample_plan():
    """Create a sample plan for testing"""
    return {
        "job_id": "job_test",
        "tasks": [
            {"task_id": "tA", "provider": "claude", "description": "Analysis"},
            {"task_id": "tB", "provider": "openai", "description": "Synthesis"},
            {"task_id": "tC", "provider": "claude", "description": "Validation"},
        ],
    }


def test_feedback_signals_collection(recursive_engine):
    """Test that signals are collected correctly"""
    
    signals = FeedbackSignals(recursive_engine)
    collected = signals.collect()
    
    assert "routing_scores" in collected
    assert "provider_zpe" in collected
    assert "timestamp" in collected
    assert "openai" in collected["routing_scores"]
    assert "claude" in collected["provider_zpe"]


def test_best_providers_ranking(recursive_engine):
    """Test provider ranking by health score"""
    
    signals = FeedbackSignals(recursive_engine)
    best = signals.get_best_providers(top_n=2)
    
    assert len(best) <= 2
    # OpenAI should rank higher (ZPE 0.9 vs Claude 0.3)
    assert best[0] == "openai"


def test_provider_health_calculation(recursive_engine):
    """Test provider health score calculation"""
    
    signals = FeedbackSignals(recursive_engine)
    health = signals.get_provider_health()
    
    assert "openai" in health
    assert "claude" in health
    assert "combined_health" in health["openai"]
    assert health["openai"]["combined_health"] > health["claude"]["combined_health"]


def test_plan_rewriting(mobius_loop, sample_plan):
    """Test that plans are rewritten correctly"""
    
    signals = mobius_loop.signals.collect()
    rewritten = mobius_loop.rewriter.rewrite(sample_plan, signals)
    
    # Should reorder tasks
    assert rewritten["tasks"] != sample_plan["tasks"]
    
    # OpenAI tasks should come first (higher score)
    first_provider = rewritten["tasks"][0].get("provider")
    assert first_provider == "openai"


def test_plan_with_checkpoints(mobius_loop, sample_plan):
    """Test inserting checkpoints into plan"""
    
    signals = mobius_loop.signals.collect()
    with_checkpoints = mobius_loop.rewriter.insert_checkpoints(
        sample_plan,
        signals,
        checkpoint_interval=2
    )
    
    # Should have more tasks (original + checkpoints)
    assert len(with_checkpoints["tasks"]) > len(sample_plan["tasks"])
    
    # Should have validation tasks
    validation_tasks = [t for t in with_checkpoints["tasks"] if t.get("type") == "validation"]
    assert len(validation_tasks) > 0


def test_task_combining(mobius_loop, sample_plan):
    """Test combining related tasks"""
    
    signals = mobius_loop.signals.collect()
    combined = mobius_loop.rewriter.combine_related_tasks(sample_plan, signals)
    
    # Should have fewer or equal tasks (combined similar ones)
    assert len(combined["tasks"]) <= len(sample_plan["tasks"])


def test_strategy_refinement(mobius_loop, sample_plan):
    """Test strategy refinement adds execution parameters"""
    
    signals = mobius_loop.signals.collect()
    refined = mobius_loop.refiner.refine(sample_plan, signals)
    
    # Each task should have strategy scores
    for task in refined["tasks"]:
        assert "strategy_score" in task
        assert "execution_priority" in task
        assert task["execution_priority"] in ["high", "medium", "low"]


def test_parallelism_adjustment(mobius_loop, sample_plan):
    """Test parallelism adjustment based on provider health"""
    
    signals = mobius_loop.signals.collect()
    adjusted = mobius_loop.refiner.adjust_parallelism(sample_plan, signals)
    
    # Should have parallelism level set
    assert "parallelism" in adjusted
    assert adjusted["parallelism"] in ["aggressive", "balanced", "conservative"]


def test_task_dependencies(mobius_loop, sample_plan):
    """Test adding task dependencies"""
    
    signals = mobius_loop.signals.collect()
    with_deps = mobius_loop.refiner.add_task_dependencies(sample_plan, signals)
    
    assert "dependencies" in with_deps


def test_full_mobius_refinement(mobius_loop, sample_plan):
    """Test complete Möbius Loop refinement cycle"""
    
    refined = mobius_loop.refine(sample_plan)
    
    # Should have refinement markers
    assert "mobius_iteration" in refined
    assert "signals_applied" in refined
    assert refined["mobius_iteration"] == 1
    
    # Tasks should have strategy information
    for task in refined["tasks"]:
        assert "strategy_score" in task


def test_mobius_iteration_tracking(mobius_loop, sample_plan):
    """Test that iteration counter increments"""
    
    plan1 = mobius_loop.refine(sample_plan)
    assert plan1["mobius_iteration"] == 1
    
    plan2 = mobius_loop.refine(plan1)
    assert plan2["mobius_iteration"] == 2


def test_optimization_variant(mobius_loop, sample_plan):
    """Test full optimization refinement"""
    
    optimized = mobius_loop.refine_with_optimization(sample_plan)
    
    # Should have all optimizations applied
    assert "parallelism" in optimized
    
    # Tasks should have execution parameters
    for task in optimized["tasks"]:
        if task.get("type") != "validation":
            assert "temperature" in task or "execution_priority" in task


def test_checkpoint_variant(mobius_loop, sample_plan):
    """Test refinement with checkpoints"""
    
    with_checkpoints = mobius_loop.refine_with_checkpoints(sample_plan)
    
    # Should have checkpoints inserted
    checkpoint_tasks = [t for t in with_checkpoints["tasks"] if t.get("type") == "validation"]
    assert len(checkpoint_tasks) > 0


def test_provider_recommendations(mobius_loop):
    """Test getting provider recommendations"""
    
    recommendations = mobius_loop.get_provider_recommendations()
    
    assert "primary" in recommendations
    assert "fallback" in recommendations
    assert "backup" in recommendations
    assert "health_scores" in recommendations
    
    # Primary should be OpenAI (highest score)
    assert recommendations["primary"] == "openai"


def test_plan_quality_estimate(mobius_loop, sample_plan):
    """Test plan quality estimation"""
    
    quality = mobius_loop.get_plan_quality_estimate(sample_plan)
    
    # Should return a score between 0 and 1
    assert 0.0 <= quality <= 1.0


def test_empty_plan_handling(mobius_loop):
    """Test handling of empty plan"""
    
    empty_plan = {"tasks": []}
    refined = mobius_loop.refine(empty_plan)
    
    assert "tasks" in refined
    assert len(refined["tasks"]) == 0


def test_plan_without_providers(mobius_loop):
    """Test handling of plan with tasks but no providers"""
    
    plan = {
        "tasks": [
            {"task_id": "t1", "description": "Test"},
            {"task_id": "t2", "description": "Test 2"},
        ]
    }
    
    refined = mobius_loop.refine(plan)
    
    # Should still refine without error
    assert "tasks" in refined
    assert len(refined["tasks"]) > 0
