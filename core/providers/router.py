
"""
Provider Routing Abstraction for AgentArmyOS
Multi-provider, cost/latency/score-aware, extensible for future strategies.
"""
from typing import List, Dict, Any, Callable

class ProviderRouter:
    def __init__(self, providers: List[Any], strategy: str = 'round_robin', scoring_fn: Callable = None):
        self.providers = providers
        self.strategy = strategy
        self._rr_idx = 0
        self.scoring_fn = scoring_fn  # Optional: custom scoring function

    def choose_and_call(self, task: Dict[str, Any], context: Dict[str, Any]) -> Any:
        if not self.providers:
            raise RuntimeError('No providers available')
        provider = self._select_provider(task, context)
        return provider.call(task, context)

    def _select_provider(self, task: Dict[str, Any], context: Dict[str, Any]) -> Any:
        if self.strategy == 'round_robin':
            provider = self.providers[self._rr_idx % len(self.providers)]
            self._rr_idx += 1
            return provider
        elif self.strategy == 'score' and self.scoring_fn:
            scores = [(p, self.scoring_fn(p, task, context)) for p in self.providers]
            scores.sort(key=lambda x: x[1], reverse=True)
            return scores[0][0]
        # Default fallback
        return self.providers[0]
