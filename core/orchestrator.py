"""
Option B: Modular Orchestrator
Clean, simple, provider-driven pipeline.
"""

import asyncio
import logging
from typing import Optional

from core.contracts import TaskResult
from core.providers import (
    ProviderRouter, 
    ProviderRequest, 
    RoutingStrategy,
    OpenAIProvider,
    MockProvider
)
from core.providers.router import RouterConfig

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run async coroutine, handling event loop already running case."""
    try:
        loop = asyncio.get_running_loop()
        # If we're already in an async context, create a task
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(asyncio.run, coro)
            return future.result()
    except RuntimeError:
        # No running loop, safe to use asyncio.run
        return asyncio.run(coro)


class Orchestrator:
    """
    Modular orchestrator using Option B architecture.
    Simple pipeline: Input → Router → Provider → TaskResult
    """
    
    def __init__(self):
        # Initialize providers - use MockProvider for testing if no API keys
        providers = []
        
        # Try to add OpenAI if API key is available
        try:
            openai = OpenAIProvider()
            if openai.api_key:
                providers.append(openai)
                logger.info("OpenAI provider initialized")
        except Exception as e:
            logger.warning(f"Could not initialize OpenAI: {e}")
        
        # Always add MockProvider as fallback
        providers.append(MockProvider(name="mock", response_text="Mock response for testing"))
        
        # Initialize ProviderRouter with available providers
        config = RouterConfig(
            strategy=RoutingStrategy.PERFORMANCE_BASED,
            max_retries=3,
            timeout_ms=30000,
            fallback_enabled=True
        )
        
        self.provider_router = ProviderRouter(
            providers=providers,
            config=config
        )
        
        logger.info(f"Orchestrator initialized with {len(providers)} providers")

    def run(self, input_data: str) -> TaskResult:
        """
        Execute the orchestration pipeline synchronously.
        
        Args:
            input_data: The prompt/input to process
            
        Returns:
            TaskResult with success, output, and provider info
        """
        return _run_async(self.run_async(input_data))
    
    async def run_async(self, input_data: str) -> TaskResult:
        """
        Execute the orchestration pipeline asynchronously.
        
        Args:
            input_data: The prompt/input to process
            
        Returns:
            TaskResult with success, output, and provider info
        """
        logger.info(f"Orchestrator processing: {input_data[:50]}...")
        
        try:
            # Create provider request
            request = ProviderRequest(
                prompt=input_data,
                model="gpt-4",
                temperature=0.7,
                max_tokens=2048
            )
            
            # Route to provider and get response
            response = await self.provider_router.route(request)
            
            # Convert to TaskResult
            result = TaskResult(
                success=response.success,
                output=response.output,
                provider=response.provider_name
            )
            
            logger.info(f"Orchestrator completed: success={result.success}, provider={result.provider}")
            return result
            
        except Exception as e:
            logger.error(f"Orchestrator error: {str(e)}")
            return TaskResult(
                success=False,
                output=f"Error: {str(e)}",
                provider="orchestrator"
            )


# Factory function for easy instantiation
def create_orchestrator() -> Orchestrator:
    """Create and return an Orchestrator instance."""
    return Orchestrator()

