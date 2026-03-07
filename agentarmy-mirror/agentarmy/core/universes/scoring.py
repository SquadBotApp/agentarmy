from __future__ import annotations
from typing import List
from core.contracts import TaskResult

class UniverseScoring:
    """
    Computes weights for each universe based on:
    - ZPE resonance
    - provider routing performance
    - internal consistency
    """

    def score_universe(self, universe: List[TaskResult]) -> float:
        if not universe:
            return 0.0

        # Handle different attribute names for success and metadata
        zpe_sum = 0.0
        success_count = 0
        for r in universe:
            # Try different ways to get ZPE score
            if hasattr(r, 'metadata') and r.metadata:
                zpe_sum += r.metadata.get("zpe_score", 0.0)
            elif hasattr(r, 'metrics') and r.metrics:
                zpe_sum += getattr(r.metrics, 'zpe_score', 0.0)
            
            # Check status for success
            if getattr(r, 'status', None) == 'completed':
                success_count += 1
        
        success_rate = success_count / len(universe) if universe else 0.0
        return zpe_sum * success_rate
