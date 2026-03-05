"""
Feedback signals collection for Möbius Loop refinement.
Aggregates outputs from Recursive Engine and Expansion Engine.
"""

from __future__ import annotations

import logging
from typing import Dict, Any, Optional

from core.recursive import RecursiveEngine

logger = logging.getLogger(__name__)


class FeedbackSignals:
    """
    Collects all signals needed for Möbius Loop refinement.
    Sources:
    - Recursive Engine (routing scores, ZPE metrics)
    - Expansion Engine (strategy effectiveness)
    - Job history (success rates, patterns)
    """
    
    def __init__(self, recursive_engine: RecursiveEngine | None = None) -> None:
        self.recursive_engine = recursive_engine or RecursiveEngine()
    
    def collect(self) -> Dict[str, Any]:
        """
        Collect all available signals from recursive engine.
        
        Returns:
            Dict with routing_scores, provider_zpe, and aggregate metrics
        """
        
        routing_scores = self.recursive_engine.get_routing_scores()
        provider_zpe = self.recursive_engine.get_provider_zpe()
        
        logger.info(f"Collected signals: routing={routing_scores}, zpe={provider_zpe}")
        
        return {
            "routing_scores": routing_scores,
            "provider_zpe": provider_zpe,
            "timestamp": self._get_timestamp(),
        }
    
    def get_best_providers(self, top_n: int = 3) -> list[str]:
        """
        Get top N providers by combined score.
        """
        
        routing_scores = self.recursive_engine.get_routing_scores()
        provider_zpe = self.recursive_engine.get_provider_zpe()
        
        scores = {}
        for provider in set(list(routing_scores.keys()) + list(provider_zpe.keys())):
            combined_score = (
                routing_scores.get(provider, 0.0) +
                provider_zpe.get(provider, 0.0)
            ) / 2.0
            scores[provider] = combined_score
        
        sorted_providers = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [p[0] for p in sorted_providers[:top_n]]
    
    def get_provider_health(self) -> Dict[str, Dict[str, float]]:
        """
        Get comprehensive health score per provider.
        Combines routing score and ZPE.
        """
        
        routing_scores = self.recursive_engine.get_routing_scores()
        provider_zpe = self.recursive_engine.get_provider_zpe()
        
        health = {}
        for provider in set(list(routing_scores.keys()) + list(provider_zpe.keys())):
            health[provider] = {
                "routing_score": routing_scores.get(provider, 0.0),
                "zpe_score": provider_zpe.get(provider, 0.0),
                "combined_health": (
                    routing_scores.get(provider, 0.0) +
                    provider_zpe.get(provider, 0.0)
                ) / 2.0,
            }
        
        return health
    
    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp as ISO string"""
        from datetime import datetime
        return datetime.utcnow().isoformat()
