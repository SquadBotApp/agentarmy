"""
Base provider implementations
"""

import os
import logging
from typing import Optional
from datetime import datetime

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False

from .router import Provider, ProviderRequest, ProviderResponse

logger = logging.getLogger(__name__)


class OpenAIProvider(Provider):
    """OpenAI API provider implementation"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__("openai", api_key or os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4"
        self.base_url = "https://api.openai.com/v1"
    
    async def generate(self, request: ProviderRequest) -> ProviderResponse:
        """Generate response using OpenAI API"""
        
        if not AIOHTTP_AVAILABLE:
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error="aiohttp package not installed. Run: pip install aiohttp"
            )
        
        if not self.api_key:
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error="OpenAI API key not configured"
            )
        
        start_time = datetime.now()
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": request.model or self.model,
                "messages": [{"role": "user", "content": request.prompt}],
                "temperature": request.temperature,
                "max_tokens": request.max_tokens
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        output = data["choices"][0]["message"]["content"]
                        usage = data.get("usage", {})
                        tokens_used = usage.get("total_tokens", 0)
                        
                        latency_ms = (datetime.now() - start_time).total_seconds() * 1000
                        cost = (tokens_used / 1000) * 0.03  # Approximate cost
                        
                        return ProviderResponse(
                            provider_name=self.name,
                            output=output,
                            tokens_used=tokens_used,
                            latency_ms=latency_ms,
                            cost=cost,
                            success=True
                        )
                    else:
                        error_data = await resp.text()
                        return ProviderResponse(
                            provider_name=self.name,
                            output="",
                            success=False,
                            error=f"OpenAI API error: {resp.status} - {error_data}"
                        )
        
        except Exception as e:
            logger.error(f"OpenAI provider error: {str(e)}")
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error=str(e)
            )


class ClaudeProvider(Provider):
    """Anthropic Claude provider implementation"""
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__("claude", api_key or os.getenv("ANTHROPIC_API_KEY"))
        self.model = "claude-3-sonnet-20240229"
        self.base_url = "https://api.anthropic.com/v1"
    
    async def generate(self, request: ProviderRequest) -> ProviderResponse:
        """Generate response using Claude API"""
        
        if not self.api_key:
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error="Anthropic API key not configured"
            )
        
        start_time = datetime.now()
        
        try:
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            
            payload = {
                "model": request.model or self.model,
                "max_tokens": request.max_tokens,
                "messages": [{"role": "user", "content": request.prompt}]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/messages",
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        output = data["content"][0]["text"]
                        tokens_used = data.get("usage", {}).get("input_tokens", 0)
                        
                        latency_ms = (datetime.now() - start_time).total_seconds() * 1000
                        cost = (tokens_used / 1000) * 0.015  # Approximate cost
                        
                        return ProviderResponse(
                            provider_name=self.name,
                            output=output,
                            tokens_used=tokens_used,
                            latency_ms=latency_ms,
                            cost=cost,
                            success=True
                        )
                    else:
                        error_data = await resp.text()
                        return ProviderResponse(
                            provider_name=self.name,
                            output="",
                            success=False,
                            error=f"Claude API error: {resp.status} - {error_data}"
                        )
        
        except Exception as e:
            logger.error(f"Claude provider error: {str(e)}")
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error=str(e)
            )


class MockProvider(Provider):
    """Mock provider for testing"""
    
    def __init__(self, name: str = "mock", response_text: str = "Mock response"):
        super().__init__(name)
        self.response_text = response_text
    
    async def generate(self, request: ProviderRequest) -> ProviderResponse:
        """Return mock response instantly"""
        
        return ProviderResponse(
            provider_name=self.name,
            output=self.response_text,
            tokens_used=10,
            latency_ms=5.0,
            cost=0.001,
            success=True
        )
