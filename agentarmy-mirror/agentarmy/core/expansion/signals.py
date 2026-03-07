"""
Expansion signals: reads Recursive Engine outputs and decides expansion level.
"""

from __future__ import annotations

from typing import Dict, Any
from enum import IntEnum


class ExpansionLevel(IntEnum):
    """Expansion levels: 1 (baseline), 3, 6, or 9 branches"""
    
    NONE = 1
    THREE = 3
    SIX = 6
    NINE = 9


class ExpansionSignals:
    """
    Reads Recursive Engine outputs and determines expansion level.
    Uses routing scores, ZPE metrics, and job success rates.
    """
    
    def __init__(self):
        self.min_routing_score = 0.5
        self.min_zpe_score = 0.6
        self.success_threshold = 0.8
    
    def decide_expansion(
        self,
        routing_scores: Dict[str, float],
        provider_zpe: Dict[str, float],
        recent_success_rate: float
    ) -> ExpansionLevel:
        """
        Decide expansion level based on recursive engine signals.
        
        - If success rate < threshold and ZPE low: contract to 1 (baseline)
        - If success rate good and routing scores high: expand to 3-6
        - If all metrics excellent: expand to 9
        """
        
        if not routing_scores or not provider_zpe:
            return ExpansionLevel.NONE
        
        # Calculate aggregate scores
        avg_routing_score = sum(routing_scores.values()) / len(routing_scores) if routing_scores else 0.0
        avg_zpe_score = sum(provider_zpe.values()) / len(provider_zpe) if provider_zpe else 0.0
        
        # Decision logic
        if recent_success_rate < self.success_threshold or avg_zpe_score < self.min_zpe_score:
            # Not ready to expand; stick with baseline
            return ExpansionLevel.NONE
        
        if avg_routing_score >= 0.8 and avg_zpe_score >= 0.85:
            # Excellent performance: expand to 9
            return ExpansionLevel.NINE
        
        if avg_routing_score >= 0.7 and avg_zpe_score >= 0.75:
            # Good performance: expand to 6
            return ExpansionLevel.SIX
        
        if avg_routing_score >= 0.6 and avg_zpe_score >= 0.65:
            # Fair performance: expand to 3
            return ExpansionLevel.THREE
        
        # Default: baseline
        return ExpansionLevel.NONE
    
    def get_provider_diversity(self, routing_scores: Dict[str, float]) -> int:
        """
        Get number of providers to use in expansion.
        More providers = more diversity in branching strategies.
        """
        
        if not routing_scores:
            return 1
        
        active_providers = sum(1 for score in routing_scores.values() if score > 0.0)
        return max(1, active_providers)
