"""
Test suite for ProviderRouter
"""
import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock

from core.providers import (
    ProviderRouter, 
    ProviderRequest, 
    ProviderResponse,
    RoutingStrategy,
    MockProvider
)
from core.providers.router import RouterConfig


class TestProviderRouter:
    """Tests for the ProviderRouter class"""
    
    @pytest.fixture
    def mock_providers(self):
        """Create mock providers for testing"""
        provider1 = MagicMock()
        provider1.name = "provider1"
        provider1.generate = AsyncMock(return_value=ProviderResponse(
            provider_name="provider1",
            output="Response 1",
            success=True,
            latency_ms=100,
            cost=0.01
        ))
        provider1.request_count = 0
        provider1.error_count = 0
        
        provider2 = MagicMock()
        provider2.name = "provider2"
        provider2.generate = AsyncMock(return_value=ProviderResponse(
            provider_name="provider2",
            output="Response 2",
            success=True,
            latency_ms=200,
            cost=0.02
        ))
        provider2.request_count = 0
        provider2.error_count = 0
        
        return [provider1, provider2]
    
    @pytest.mark.asyncio
    async def test_router_initialization(self, mock_providers):
        """Test that ProviderRouter initializes correctly"""
        config = RouterConfig(strategy=RoutingStrategy.ROUND_ROBIN)
        router = ProviderRouter(providers=mock_providers, config=config)
        
        assert router.strategy == RoutingStrategy.ROUND_ROBIN
        assert len(router.providers) == 2
        assert router.current_index == 0
    
    @pytest.mark.asyncio
    async def test_route_uses_round_robin(self, mock_providers):
        """Test round-robin routing strategy"""
        config = RouterConfig(strategy=RoutingStrategy.ROUND_ROBIN)
        router = ProviderRouter(providers=mock_providers, config=config)
        
        request = ProviderRequest(prompt="test prompt")
        
        # First request should go to provider1
        response1 = await router.route(request)
        assert response1.provider_name == "provider1"
        
        # Second request should go to provider2
        response2 = await router.route(request)
        assert response2.provider_name == "provider2"
        
        # Third request wraps back to provider1
        response3 = await router.route(request)
        assert response3.provider_name == "provider1"
    
    @pytest.mark.asyncio
    async def test_route_with_no_providers(self):
        """Test routing with no available providers"""
        router = ProviderRouter(providers=[], config=RouterConfig())
        
        request = ProviderRequest(prompt="test")
        response = await router.route(request)
        
        assert response.success is False
        assert "No providers available" in response.error
    
    @pytest.mark.asyncio
    async def test_route_handles_provider_error(self, mock_providers):
        """Test that router handles provider errors gracefully"""
        # Make provider1 fail
        mock_providers[0].generate = AsyncMock(side_effect=Exception("Provider error"))
        
        config = RouterConfig(strategy=RoutingStrategy.ROUND_ROBIN)
        router = ProviderRouter(providers=mock_providers, config=config)
        
        request = ProviderRequest(prompt="test")
        
        # Should catch exception and return error response
        response = await router.route(request)
        assert response.success is False
        assert "Provider error" in response.error
    
    @pytest.mark.asyncio
    async def test_get_provider_stats(self, mock_providers):
        """Test getting provider statistics"""
        config = RouterConfig()
        router = ProviderRouter(providers=mock_providers, config=config)
        
        # Make some requests
        request = ProviderRequest(prompt="test")
        await router.route(request)
        await router.route(request)
        
        stats = router.get_provider_stats()
        
        assert "provider1" in stats
        assert stats["provider1"]["request_count"] == 1
        assert "provider2" in stats
        assert stats["provider2"]["request_count"] == 1
    
    @pytest.mark.asyncio
    async def test_set_strategy(self, mock_providers):
        """Test changing routing strategy at runtime"""
        config = RouterConfig(strategy=RoutingStrategy.ROUND_ROBIN)
        router = ProviderRouter(providers=mock_providers, config=config)
        
        router.set_strategy(RoutingStrategy.LATENCY_OPTIMIZED)
        
        assert router.strategy == RoutingStrategy.LATENCY_OPTIMIZED
    
    @pytest.mark.asyncio
    async def test_mark_provider_unavailable(self, mock_providers):
        """Test marking provider as unavailable"""
        config = RouterConfig()
        router = ProviderRouter(providers=mock_providers, config=config)
        
        router.mark_provider_unavailable("provider1")
        
        stats = router.get_provider_stats()
        assert stats["provider1"]["is_available"] is False
    
    @pytest.mark.asyncio
    async def test_choose_and_call(self, mock_providers):
        """Test convenience method choose_and_call"""
        config = RouterConfig()
        router = ProviderRouter(providers=mock_providers, config=config)
        
        request = ProviderRequest(prompt="test")
        provider, response = await router.choose_and_call(request)
        
        assert provider.name in ["provider1", "provider2"]
        assert response.success is True


class TestMockProvider:
    """Tests for the MockProvider"""
    
    @pytest.mark.asyncio
    async def test_mock_provider_returns_response(self):
        """Test that MockProvider returns a valid response"""
        provider = MockProvider(name="test_mock", response_text="Hello from mock")
        
        request = ProviderRequest(prompt="test prompt")
        response = await provider.generate(request)
        
        assert response.success is True
        assert response.output == "Hello from mock"
        assert response.provider_name == "test_mock"
        assert response.latency_ms > 0

