from __future__ import annotations
from typing import List, Dict, Any
from core.universes.scoring import UniverseScoring
from core.contracts.types import TaskResult

class UniverseCollapse:
    """
    Collapses multiple universes into a single final result.
    """

    def __init__(self):
        self.scorer = UniverseScoring()

    def collapse(self, universes: List[List[TaskResult]]) -> Dict[str, Any]:
        scores = [self.scorer.score_universe(u) for u in universes]

        if sum(scores) == 0:
            return {"universes": universes, "final": None}

        weighted = []
        for universe, score in zip(universes, scores):
            for result in universe:
                weighted.append((result, score))

        weighted.sort(key=lambda x: x[1], reverse=True)

        best = weighted[0][0] if weighted else None

        return {
            "universes": universes,
            "scores": scores,
            "final": best,
        }
