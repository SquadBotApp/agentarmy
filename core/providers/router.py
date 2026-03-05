
"""
Provider Routing Abstraction for AgentArmyOS
Multi-provider, cost/latency/score-aware, extensible for future strategies.
"""
from typing import List, Any, Callable
from .base import ProviderRequest, ProviderResponse

class ProviderRouter:
    def __init__(self, providers: List[Any], strategy: str = 'round_robin', scoring_fn: Callable = None):
        self.providers = providers
        self.strategy = strategy
        self._rr_idx = 0
        self.scoring_fn = scoring_fn  # Optional: custom scoring function

    async def choose_and_call(self, req: ProviderRequest) -> ProviderResponse:
        if not self.providers:
            raise RuntimeError('No providers available')
        provider = self._select_provider(req)
        return await provider.call(req)

    def _select_provider(self, req: ProviderRequest) -> Any:
        if self.strategy == 'round_robin':
            provider = self.providers[self._rr_idx % len(self.providers)]
            self._rr_idx += 1
            return provider
        elif self.strategy == 'score' and self.scoring_fn:
            scores = [(p, self.scoring_fn(p, req)) for p in self.providers]
            scores.sort(key=lambda x: x[1], reverse=True)
            return scores[0][0]
        # Default fallback
        return self.providers[0]
