"""
Expansion Engine: Main orchestrator for 3-6-9 branching.
Reads signals, chooses expansion level, generates and dispatches branches.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Any

from core.recursive import RecursiveEngine
from .signals import ExpansionSignals, ExpansionLevel
from .strategies import ExpansionStrategies, BranchStrategy
from .branch import Branch, BranchFactory
from .collapse import CollapseEngine, VotingEngine

logger = logging.getLogger(__name__)


class ExpansionEngine:
    """
    Main orchestrator for 3-6-9 controlled expansion.
    
    Flow:
    1. Read signals from Recursive Engine
    2. Decide expansion level (1, 3, 6, or 9)
    3. Generate branches with different strategies
    4. Return branches for parallel execution
    5. Collapse results back to single output
    """
    
    def __init__(
        self,
        recursive_engine: RecursiveEngine | None = None,
        providers: List[str] | None = None
    ):
        self.recursive_engine = recursive_engine or RecursiveEngine()
        self.signals = ExpansionSignals()
        self.strategies = ExpansionStrategies()
        self.branch_factory = BranchFactory(providers or ["openai", "claude"])
        self.collapse_engine = CollapseEngine()
        self.voting_engine = VotingEngine()
    
    def expand(self, task: str, recent_success_rate: float = 0.8) -> List[Branch]:
        """
        Expand a single task into multiple branches based on signals.
        
        Args:
            task: The base task/prompt to expand
            recent_success_rate: Recent job success rate (0-1)
        
        Returns:
            List of Branch objects ready for parallel execution
        """
        
        # 1. Read signals from Recursive Engine
        routing_scores = self.recursive_engine.get_routing_scores()
        provider_zpe = self.recursive_engine.get_provider_zpe()
        
        logger.info(f"Expansion signals: routing={routing_scores}, zpe={provider_zpe}")
        
        # 2. Decide expansion level
        expansion_level = self.signals.decide_expansion(
            routing_scores,
            provider_zpe,
            recent_success_rate
        )
        
        logger.info(f"Expansion level decided: {expansion_level}")
        
        # 3. Get strategies for this level
        if expansion_level == ExpansionLevel.NINE:
            strategies = self.strategies.nine_way()
        elif expansion_level == ExpansionLevel.SIX:
            strategies = self.strategies.six_way()
        elif expansion_level == ExpansionLevel.THREE:
            strategies = self.strategies.three_way()
        else:
            strategies = [BranchStrategy.BALANCED]
        
        # 4. Generate branches
        role_map = self._create_role_map(strategies)
        branches = self.branch_factory.create_branches(
            strategies,
            task,
            role_map
        )
        
        logger.info(f"Generated {len(branches)} branches for expansion level {expansion_level}")
        
        return branches
    
    def collapse(self, branches: List[Branch]) -> Dict[str, Any]:
        """
        Merge branch results into a single job output.
        
        Args:
            branches: List of executed branches with results
        
        Returns:
            Merged result dict with consolidated output and metrics
        """
        
        result = self.collapse_engine.merge(branches)
        
        logger.info(f"Collapsed {len(branches)} branches: "
                   f"success_rate={result['success_rate']:.2%}, "
                   f"avg_zpe={result['metrics'].get('average_zpe_score', 0):.2f}")
        
        return result
    
    def _create_role_map(
        self,
        strategies: List[BranchStrategy]
    ) -> Dict[BranchStrategy, str]:
        """Create a mapping of strategies to roles."""
        
        role_map = {
            BranchStrategy.AGGRESSIVE: "innovator",
            BranchStrategy.BALANCED: "generalist",
            BranchStrategy.CONSERVATIVE: "cautious_expert",
            BranchStrategy.ANALYTICAL: "analyst",
            BranchStrategy.CREATIVE: "creative_thinker",
            BranchStrategy.VALIDATOR: "quality_assurer",
            BranchStrategy.OPTIMIZER: "efficiency_expert",
            BranchStrategy.RISK_TAKER: "bold_explorer",
            BranchStrategy.SAFETY_FIRST: "safety_monitor",
        }
        
        return {s: role_map.get(s, s.value) for s in strategies}
    
    def get_best_provider(self, branches: List[Branch]) -> str | None:
        """
        Use voting to determine best provider from successful branches.
        """
        
        successful = [b for b in branches if b.success]
        return self.voting_engine.vote(successful, "provider", "zpe_score")
    
    def get_recommended_strategy(self, branches: List[Branch]) -> BranchStrategy | None:
        """
        Use voting to determine most effective strategy.
        """
        
        successful = [b for b in branches if b.success]
        if not successful:
            return None
        
        # Vote using strategy attribute - convert to comparable form
        strategy_votes = {}
        for branch in successful:
            weight = branch.zpe_score
            strategy_val = branch.strategy.value
            
            if strategy_val not in strategy_votes:
                strategy_votes[strategy_val] = 0.0
            
            strategy_votes[strategy_val] += weight
        
        if not strategy_votes:
            return None
        
        best_strategy_val = max(strategy_votes.items(), key=lambda x: x[1])[0]
        return BranchStrategy(best_strategy_val)
