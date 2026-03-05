"""
Provider Routing Layer
Routes requests to optimal LLM providers based on strategy and performance
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RoutingStrategy(str, Enum):
    """Routing strategies for provider selection"""
    ROUND_ROBIN = "round_robin"
    PERFORMANCE_BASED = "performance_based"
    COST_OPTIMIZED = "cost_optimized"
    LATENCY_OPTIMIZED = "latency_optimized"
    FALLBACK = "fallback"
    LOAD_BALANCED = "load_balanced"


class ProviderRequest:
    """Request sent to a provider"""
    
    def __init__(
        self,
        prompt: str,
        model: str = "default",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        metadata: Dict[str, Any] = None
    ):
        self.prompt = prompt
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.metadata = metadata or {}
        self.created_at = datetime.now()
        self.request_id = f"req_{datetime.now().timestamp()}"


class ProviderResponse:
    """Response from a provider"""
    
    def __init__(
        self,
        provider_name: str,
        output: str,
        tokens_used: int = 0,
        latency_ms: float = 0.0,
        cost: float = 0.0,
        success: bool = True,
        error: Optional[str] = None
    ):
        self.provider_name = provider_name
        self.output = output
        self.tokens_used = tokens_used
        self.latency_ms = latency_ms
        self.cost = cost
        self.success = success
        self.error = error
        self.timestamp = datetime.now()


class Provider(ABC):
    """Base class for LLM providers"""
    
    def __init__(self, name: str, api_key: Optional[str] = None):
        self.name = name
        self.api_key = api_key
        self.request_count = 0
        self.total_cost = 0.0
        self.total_latency_ms = 0.0
        self.error_count = 0
        self.is_available = True
    
    @abstractmethod
    async def generate(self, request: ProviderRequest) -> ProviderResponse:
        """Generate response from provider"""
        pass
    
    @property
    def average_latency(self) -> float:
        """Calculate average latency"""
        if self.request_count == 0:
            return 0.0
        return self.total_latency_ms / self.request_count
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.request_count == 0:
            return 1.0
        return (self.request_count - self.error_count) / self.request_count
    
    def get_performance_score(self) -> float:
        """Calculate overall performance score (0-100)"""
        if not self.is_available:
            return 0.0
        
        success_score = self.success_rate * 50
        latency_score = max(0, 50 - (self.average_latency / 10))
        
        return success_score + latency_score


class ProviderRouter:
    """Routes requests to providers based on strategy"""
    
    def __init__(
        self,
        providers: List[Provider],
        strategy: RoutingStrategy = RoutingStrategy.ROUND_ROBIN
    ):
        self.providers = providers
        self.strategy = strategy
        self.current_index = 0
        self.request_log: List[Dict[str, Any]] = []
        logger.info(f"ProviderRouter initialized with {len(providers)} providers using {strategy} strategy")
    
    async def route(self, request: ProviderRequest) -> ProviderResponse:
        """Route a request to the best provider based on strategy"""
        
        if not self.providers:
            return ProviderResponse(
                provider_name="unknown",
                output="",
                success=False,
                error="No providers available"
            )
        
        provider = self._select_provider()
        
        try:
            response = await provider.generate(request)
            provider.request_count += 1
            
            if response.success:
                provider.total_latency_ms += response.latency_ms
                provider.total_cost += response.cost
            else:
                provider.error_count += 1
            
            self._log_request(request, response)
            return response
            
        except Exception as e:
            logger.error(f"Error routing to {provider.name}: {str(e)}")
            provider.error_count += 1
            provider.request_count += 1
            
            return ProviderResponse(
                provider_name=provider.name,
                output="",
                success=False,
                error=str(e)
            )
    
    def _select_provider(self) -> Provider:
        """Select provider based on routing strategy"""
        
        if self.strategy == RoutingStrategy.ROUND_ROBIN:
            provider = self.providers[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.providers)
            return provider
        
        elif self.strategy == RoutingStrategy.PERFORMANCE_BASED:
            return max(
                self.providers,
                key=lambda p: p.get_performance_score()
            )
        
        elif self.strategy == RoutingStrategy.COST_OPTIMIZED:
            return min(self.providers, key=lambda p: p.total_cost)
        
        elif self.strategy == RoutingStrategy.LATENCY_OPTIMIZED:
            return min(self.providers, key=lambda p: p.average_latency)
        
        elif self.strategy == RoutingStrategy.LOAD_BALANCED:
            return min(self.providers, key=lambda p: p.request_count)
        
        elif self.strategy == RoutingStrategy.FALLBACK:
            available = [p for p in self.providers if p.is_available]
            return available[0] if available else self.providers[0]
        
        else:
            return self.providers[0]
    
    def _log_request(self, request: ProviderRequest, response: ProviderResponse):
        """Log request-response pair for analysis"""
        
        log_entry = {
            "request_id": request.request_id,
            "provider": response.provider_name,
            "success": response.success,
            "latency_ms": response.latency_ms,
            "cost": response.cost,
            "tokens_used": response.tokens_used,
            "timestamp": datetime.now().isoformat()
        }
        
        self.request_log.append(log_entry)
    
    def get_provider_stats(self) -> Dict[str, Dict[str, Any]]:
        """Get performance statistics for all providers"""
        
        stats = {}
        for provider in self.providers:
            stats[provider.name] = {
                "request_count": provider.request_count,
                "error_count": provider.error_count,
                "success_rate": provider.success_rate,
                "average_latency_ms": provider.average_latency,
                "total_cost": provider.total_cost,
                "performance_score": provider.get_performance_score(),
                "is_available": provider.is_available
            }
        
        return stats
    
    def set_strategy(self, strategy: RoutingStrategy):
        """Change routing strategy at runtime"""
        
        self.strategy = strategy
        logger.info(f"Routing strategy changed to {strategy}")
    
    def mark_provider_unavailable(self, provider_name: str):
        """Mark a provider as unavailable (e.g., due to API errors)"""
        
        for provider in self.providers:
            if provider.name == provider_name:
                provider.is_available = False
                logger.warning(f"Provider {provider_name} marked as unavailable")
    
    def mark_provider_available(self, provider_name: str):
        """Mark a provider as available again"""
        
        for provider in self.providers:
            if provider.name == provider_name:
                provider.is_available = True
                logger.info(f"Provider {provider_name} marked as available")
