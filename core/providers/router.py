
"""
Provider Routing Abstraction for AgentArmyOS
Multi-provider, cost/latency/score-aware, extensible for future strategies.
"""
import logging
from typing import List, Any, Callable, Optional, Tuple
from .base import ProviderRequest, ProviderResponse

logger = logging.getLogger(__name__)

class RouterConfig:
    pass

class ProviderRouter:
    def __init__(self, providers: List[Any], strategy: str = 'round_robin', scoring_fn: Callable = None, config: RouterConfig = None):
        self.providers = providers
        self.strategy = strategy
        self._rr_idx = 0
        self.scoring_fn = scoring_fn  # Optional: custom scoring function
        self.fixed_provider_name: Optional[str] = None

    def set_strategy(self, strategy: str, provider_name: Optional[str] = None):
        """Sets the routing strategy, with an optional provider for fixed strategy."""
        logger.info(f"Setting provider strategy to '{strategy}' with provider '{provider_name}'")
        self.strategy = strategy
        if strategy == 'fixed_provider':
            if not provider_name or not any(p.name == provider_name for p in self.providers):
                raise ValueError(f"Provider '{provider_name}' not found for fixed_provider strategy.")
            self.fixed_provider_name = provider_name

    async def choose_and_call(self, req: ProviderRequest) -> Tuple[Any, ProviderResponse]:
        if not self.providers:
            raise RuntimeError('No providers available')
        provider = self._select_provider(req)
        return provider, await provider.call(req)

    def _select_provider(self, req: ProviderRequest) -> Any:
        if self.strategy == 'fixed_provider' and self.fixed_provider_name:
            provider = next((p for p in self.providers if p.name == self.fixed_provider_name), None)
            if provider:
                return provider
        elif self.strategy == 'round_robin':
            provider = self.providers[self._rr_idx % len(self.providers)]
            self._rr_idx += 1
            return provider
        elif self.strategy == 'score' and self.scoring_fn:
            scores = [(p, self.scoring_fn(p, req)) for p in self.providers]
            scores.sort(key=lambda x: x[1], reverse=True)
            return scores[0][0]
        # Default fallback
        return self.providers[0]
