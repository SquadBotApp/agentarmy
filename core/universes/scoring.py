from __future__ import annotations
from typing import List
from core.contracts.types import TaskResult

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

        zpe_sum = sum(r.metadata.get("zpe_score", 0.0) for r in universe)
        success_rate = sum(1 for r in universe if r.success) / len(universe)

        return zpe_sum * success_rate
