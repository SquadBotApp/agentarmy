from __future__ import annotations
from typing import List
from core.contracts.types import TaskResult

class UniverseSelector:
    """
    Dynamically selects universe count based on:
    - task complexity
    - provider divergence
    - ZPE variance
    """

    def select(self, results: List[TaskResult]) -> int:
        if not results:
            return 3

        providers = {r.provider for r in results}
        zpe_values = [r.metadata.get("zpe_score", 0.0) for r in results]

        complexity = len(results)
        divergence = len(providers)
        zpe_variance = max(zpe_values) - min(zpe_values)

        score = complexity + divergence + zpe_variance

        if score < 5:
            return 3
        elif score < 12:
            return 6
        else:
            return 9
