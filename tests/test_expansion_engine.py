"""
Tests for the 3-6-9 Expansion Engine
"""

from __future__ import annotations

import pytest

from core.expansion import (
    ExpansionEngine,
    ExpansionLevel,
    BranchStrategy,
    Branch,
    ExpansionSignals,
    CollapseEngine,
    VotingEngine,
)
from core.recursive import RecursiveEngine


@pytest.fixture
def recursive_engine():
    """Create a recursive engine with some initial scores"""
    engine = RecursiveEngine()
    
    # Ingest a sample job to populate scores
    job_result = {
        "job_id": "test_job",
        "tasks": [
            {"task_id": "t1", "provider": "openai", "success": True, 
             "latency_ms": 100, "cost_usd": 0.01, "zpe_score": 0.85},
            {"task_id": "t2", "provider": "claude", "success": True,
             "latency_ms": 120, "cost_usd": 0.015, "zpe_score": 0.8},
        ],
    }
    engine.ingest_job_result(job_result)
    
    return engine


@pytest.fixture
def expansion_engine(recursive_engine):
    """Create an expansion engine with recursive engine"""
    return ExpansionEngine(recursive_engine, providers=["openai", "claude"])


def test_expansion_engine_initialization(expansion_engine):
    """Test that expansion engine initializes correctly"""
    
    assert expansion_engine.recursive_engine is not None
    assert expansion_engine.signals is not None
    assert expansion_engine.branch_factory is not None
    assert expansion_engine.collapse_engine is not None


def test_expansion_level_decision_excellent():
    """Test expansion level decision with excellent metrics"""
    
    signals = ExpansionSignals()
    
    # Excellent metrics
    routing_scores = {"openai": 0.9, "claude": 0.85}
    provider_zpe = {"openai": 0.88, "claude": 0.86}
    
    level = signals.decide_expansion(routing_scores, provider_zpe, 0.95)
    
    # Should expand to 9 with excellent performance
    assert level == ExpansionLevel.NINE


def test_expansion_level_decision_good():
    """Test expansion level decision with good metrics"""
    
    signals = ExpansionSignals()
    
    # Good metrics
    routing_scores = {"openai": 0.75, "claude": 0.7}
    provider_zpe = {"openai": 0.8, "claude": 0.78}
    
    level = signals.decide_expansion(routing_scores, provider_zpe, 0.85)
    
    # Should expand to 6 with good performance
    assert level == ExpansionLevel.SIX


def test_expansion_level_decision_fair():
    """Test expansion level decision with fair metrics"""
    
    signals = ExpansionSignals()
    
    # Fair metrics
    routing_scores = {"openai": 0.65, "claude": 0.6}
    provider_zpe = {"openai": 0.7, "claude": 0.68}
    
    level = signals.decide_expansion(routing_scores, provider_zpe, 0.8)
    
    # Should expand to 3 with fair performance
    assert level == ExpansionLevel.THREE


def test_expansion_level_decision_poor():
    """Test expansion level decision with poor metrics"""
    
    signals = ExpansionSignals()
    
    # Poor metrics
    routing_scores = {"openai": 0.4, "claude": 0.35}
    provider_zpe = {"openai": 0.5, "claude": 0.45}
    
    level = signals.decide_expansion(routing_scores, provider_zpe, 0.6)
    
    # Should stick with baseline with poor performance
    assert level == ExpansionLevel.NONE


def test_branch_generation(expansion_engine):
    """Test that branches are generated correctly"""
    
    task = "Analyze the following data and provide insights"
    branches = expansion_engine.expand(task, recent_success_rate=0.85)
    
    assert len(branches) > 0
    assert all(isinstance(b, Branch) for b in branches)
    assert all(b.task_prompt for b in branches)
    assert all(b.strategy in BranchStrategy for b in branches)


def test_branch_diversity(expansion_engine):
    """Test that generated branches have diverse strategies"""
    
    task = "Analyze the following data"
    branches = expansion_engine.expand(task, recent_success_rate=0.9)
    
    strategies = [b.strategy for b in branches]
    
    # Should have multiple different strategies
    assert len(set(strategies)) > 1


def test_branch_provider_assignment(expansion_engine):
    """Test that providers are assigned to branches"""
    
    task = "Test task"
    branches = expansion_engine.expand(task, recent_success_rate=0.85)
    
    # All branches should have a provider
    assert all(b.provider in ["openai", "claude"] for b in branches)


def test_branch_temperature_configuration(expansion_engine):
    """Test that temperatures match strategy"""
    
    task = "Test task"
    branches = expansion_engine.expand(task, recent_success_rate=0.85)
    
    aggressive = [b for b in branches if b.strategy == BranchStrategy.AGGRESSIVE]
    conservative = [b for b in branches if b.strategy == BranchStrategy.CONSERVATIVE]
    
    if aggressive and conservative:
        # Aggressive should have higher temperature than conservative
        assert aggressive[0].temperature > conservative[0].temperature


def test_collapse_merge_successful_branches():
    """Test collapsing successful branch results"""
    
    # Create mock branches
    branch1 = Branch(
        branch_id="b1",
        strategy=BranchStrategy.AGGRESSIVE,
        role="innovator",
        provider="openai",
        temperature=0.9,
        risk_level="high",
        task_prompt="test",
    )
    branch1.result = "Result from aggressive approach"
    branch1.success = True
    branch1.zpe_score = 0.85
    branch1.cost_usd = 0.01
    branch1.latency_ms = 100
    
    branch2 = Branch(
        branch_id="b2",
        strategy=BranchStrategy.CONSERVATIVE,
        role="expert",
        provider="claude",
        temperature=0.4,
        risk_level="low",
        task_prompt="test",
    )
    branch2.result = "Result from conservative approach"
    branch2.success = True
    branch2.zpe_score = 0.8
    branch2.cost_usd = 0.015
    branch2.latency_ms = 120
    
    collapse = CollapseEngine()
    result = collapse.merge([branch1, branch2])
    
    assert result["success"] is True
    assert result["success_rate"] == 1.0
    assert result["output"] in [branch1.result, branch2.result]
    assert "metrics" in result
    assert result["metrics"]["branches_executed"] == 2


def test_collapse_merge_mixed_results():
    """Test collapsing with mixed success/failure results"""
    
    # Successful branch
    branch1 = Branch(
        branch_id="b1",
        strategy=BranchStrategy.BALANCED,
        role="generalist",
        provider="openai",
        temperature=0.7,
        risk_level="medium",
        task_prompt="test",
    )
    branch1.result = "Success"
    branch1.success = True
    branch1.zpe_score = 0.8
    branch1.cost_usd = 0.01
    branch1.latency_ms = 100
    
    # Failed branch
    branch2 = Branch(
        branch_id="b2",
        strategy=BranchStrategy.AGGRESSIVE,
        role="innovator",
        provider="claude",
        temperature=0.9,
        risk_level="high",
        task_prompt="test",
    )
    branch2.result = "Failed attempt"
    branch2.success = False
    branch2.zpe_score = 0.3
    branch2.cost_usd = 0.015
    branch2.latency_ms = 200
    
    collapse = CollapseEngine()
    result = collapse.merge([branch1, branch2])
    
    assert result["success"] is True
    assert result["success_rate"] == 0.5
    assert result["output"] == "Success"  # Should prefer successful branch


def test_voting_provider_selection():
    """Test voting engine for provider selection"""
    
    # Create branches
    branches = [
        Branch("b1", BranchStrategy.BALANCED, "gen", "openai", 0.7, "medium", "test"),
        Branch("b2", BranchStrategy.BALANCED, "gen", "claude", 0.7, "medium", "test"),
        Branch("b3", BranchStrategy.BALANCED, "gen", "openai", 0.7, "medium", "test"),
    ]
    
    # Set ZPE scores
    branches[0].success = True
    branches[0].zpe_score = 0.9
    branches[1].success = True
    branches[1].zpe_score = 0.7
    branches[2].success = True
    branches[2].zpe_score = 0.8
    
    voting = VotingEngine()
    best_provider = voting.vote(branches, "provider", "zpe_score")
    
    # OpenAI should win (0.9 + 0.8 = 1.7 vs claude's 0.7)
    assert best_provider == "openai"
