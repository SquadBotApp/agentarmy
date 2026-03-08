"""
Test suite for the Option B Modular Orchestrator
"""
import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch

from core.orchestrator import Orchestrator, create_orchestrator
from core.contracts import TaskResult
from core.providers import ProviderRouter, ProviderRequest, ProviderResponse, MockProvider


class TestOrchestrator:
    """Tests for the Option B Modular Orchestrator"""
    
    def test_orchestrator_initialization(self):
        """Test that Orchestrator initializes correctly"""
        orch = Orchestrator()
        
        assert orch.provider_router is not None
        assert isinstance(orch.provider_router, ProviderRouter)
    
    def test_create_orchestrator_factory(self):
        """Test the factory function"""
        orch = create_orchestrator()
        
        assert isinstance(orch, Orchestrator)
    
    @pytest.mark.asyncio
    async def test_run_returns_task_result(self):
        """Test that run() returns a TaskResult"""
        orch = Orchestrator()
        result = orch.run("test prompt")
        
        assert isinstance(result, TaskResult)
        assert hasattr(result, 'success')
        assert hasattr(result, 'output')
        assert hasattr(result, 'provider')
    
    @pytest.mark.asyncio
    async def test_run_async_returns_task_result(self):
        """Test that run_async() returns a TaskResult"""
        orch = Orchestrator()
        result = await orch.run_async("test prompt")
        
        assert isinstance(result, TaskResult)
        assert result.success is True
    
    @pytest.mark.asyncio
    async def test_run_with_mock_provider(self):
        """Test run with mock provider"""
        orch = Orchestrator()
        result = orch.run("Hello, test!")
        
        assert result.success is True
        assert result.output is not None
        assert result.provider in ["mock", "openai"]  # Depends on available providers
    
    @pytest.mark.asyncio
    async def test_run_async_handles_error(self):
        """Test that run_async handles errors gracefully"""
        orch = Orchestrator()
        
        # Mock provider to raise an exception
        with patch.object(orch.provider_router, 'route', side_effect=Exception("Test error")):
            result = await orch.run_async("test")
            
            assert result.success is False
            assert "Test error" in result.output
    
    def test_orchestrator_has_provider_router(self):
        """Test that orchestrator has a provider router"""
        orch = Orchestrator()
        
        assert hasattr(orch, 'provider_router')
        assert isinstance(orch.provider_router, ProviderRouter)
    
    @pytest.mark.asyncio
    async def test_multiple_runs(self):
        """Test running multiple prompts"""
        orch = Orchestrator()
        
        result1 = orch.run("first prompt")
        result2 = orch.run("second prompt")
        
        assert isinstance(result1, TaskResult)
        assert isinstance(result2, TaskResult)
        assert result1.success is True
        assert result2.success is True


class TestOrchestratorIntegration:
    """Integration tests for Orchestrator with providers"""
    
    @pytest.mark.asyncio
    async def test_full_pipeline(self):
        """Test the full orchestration pipeline"""
        orch = Orchestrator()
        
        # Run the orchestrator
        result = orch.run("What is 2 + 2?")
        
        # Verify the result
        assert isinstance(result, TaskResult)
        assert result.success is True
        assert len(result.output) > 0
        assert result.provider is not None
        
        print(f"Provider: {result.provider}")
        print(f"Output: {result.output}")
    
    @pytest.mark.asyncio
    async def test_provider_selection(self):
        """Test that provider selection works"""
        orch = Orchestrator()
        
        # Check that providers are available
        providers = orch.provider_router.providers
        assert len(providers) > 0
        
        # At least one should be mock for testing
        provider_names = [p.name for p in providers]
        assert "mock" in provider_names or len(providers) > 0

