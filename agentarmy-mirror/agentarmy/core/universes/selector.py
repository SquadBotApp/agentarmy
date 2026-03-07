from __future__ import annotations
from typing import List
from core.contracts import TaskResult

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

        # Handle both 'provider' and 'provider_name' attributes
        providers = {getattr(r, 'provider', getattr(r, 'provider_name', 'unknown')) for r in results}
        zpe_values = []
        for r in results:
            # Handle different metadata locations
            if hasattr(r, 'metadata') and r.metadata:
                zpe_values.append(r.metadata.get("zpe_score", 0.0))
            elif hasattr(r, 'metrics') and r.metrics:
                zpe_values.append(getattr(r.metrics, 'zpe_score', 0.0))
            else:
                zpe_values.append(0.0)

        complexity = len(results)
        divergence = len(providers)
        zpe_variance = max(zpe_values) - min(zpe_values) if zpe_values else 0.0

        score = complexity + divergence + zpe_variance

        if score < 5:
            return 3
        elif score < 12:
            return 6
        else:
            return 9
