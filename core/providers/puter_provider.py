"""
Puter.js Provider for AgentArmy

This provider integrates with Puter.js to provide access to OpenAI models
without requiring an OpenAI developer account. Uses the User-Pays model
where users cover their own AI usage costs.

Puter.js Documentation: https://docs.puter.com/
"""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False

from .router import Provider, ProviderRequest, ProviderResponse

logger = logging.getLogger(__name__)


# Supported models by Puter.js
class PuterModels:
    # Text generation models
    GPT_5_NANO = "gpt-5-nano"
    GPT_5_MINI = "gpt-5-mini"
    GPT_5 = "gpt-5"
    GPT_5_4 = "gpt-5.4"
    GPT_5_4_PRO = "gpt-5.4-pro"
    GPT_5_3_CHAT = "gpt-5.3-chat"
    GPT_5_2 = "gpt-5.2"
    GPT_5_2_CHAT = "gpt-5.2-chat"
    GPT_5_2_PRO = "gpt-5.2-pro"
    GPT_5_1 = "gpt-5.1"
    GPT_5_1_CHAT_LATEST = "gpt-5.1-chat-latest"
    GPT_5_3_CODEX = "gpt-5.3-codex"
    GPT_5_2_CODEX = "gpt-5.2-codex"
    GPT_5_1_CODEX = "gpt-5.1-codex"
    GPT_5_1_CODEX_MINI = "gpt-5.1-codex-mini"
    GPT_5_1_CODEX_MAX = "gpt-5.1-codex-max"
    GPT_5_CODEX = "gpt-5-codex"
    GPT_5_CHAT_LATEST = "gpt-5-chat-latest"
    GPT_4_1 = "gpt-4.1"
    GPT_4_1_MINI = "gpt-4.1-mini"
    GPT_4_1_NANO = "gpt-4.1-nano"
    GPT_4_5_PREVIEW = "gpt-4.5-preview"
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    O1 = "o1"
    O1_MINI = "o1-mini"
    O1_PRO = "o1-pro"
    O3 = "o3"
    O3_MINI = "o3-mini"
    O4_MINI = "o4-mini"
    
    # OpenAI models with prefix
    OPENAI_GPT_5_2_CHAT = "openai/gpt-5.2-chat"
    OPENAI_GPT_OSS_120B = "openai/gpt-oss-120b"
    
    # Image generation models
    GPT_IMAGE_1_5 = "gpt-image-1.5"
    GPT_IMAGE_1_MINI = "gpt-image-1-mini"
    GPT_IMAGE_1 = "gpt-image-1"
    DALL_E_3 = "dall-e-3"
    DALL_E_2 = "dall-e-2"
    
    # Text-to-speech models
    GPT_4O_MINI_TTS = "gpt-4o-mini-tts"
    TTS_1 = "tts-1"
    TTS_1_HD = "tts-1-hd"


class PuterProvider(Provider):
    """
    Puter.js API provider implementation
    
    Provides access to OpenAI models through Puter.js without requiring
    an OpenAI developer account. Uses the User-Pays model.
    
    Usage:
        # Using Puter.js CDN in browser:
        <script src="https://js.puter.com/v2/"></script>
        puter.ai.chat("Hello", { model: "gpt-5-nano" })
        
        # Or via NPM:
        // npm install @heyputer/puter.js
        import { puter } from '@heyputer/puter.js';
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        app_id: Optional[str] = None,
        default_model: str = PuterModels.GPT_5_NANO
    ):
        """
        Initialize Puter.js provider
        
        Args:
            api_key: Optional API key (not required for basic Puter.js usage)
            app_id: Optional app ID for authenticated requests
            default_model: Default model to use for requests
        """
        super().__init__("puter", api_key)
        self.app_id = app_id or os.getenv("PUTER_APP_ID")
        self.default_model = default_model
        self.base_url = "https://api.puter.com/v1"
        
        # Model categories for routing
        self.text_models = [
            PuterModels.GPT_5_NANO, PuterModels.GPT_5_MINI, PuterModels.GPT_5,
            PuterModels.GPT_5_4, PuterModels.GPT_5_4_PRO, PuterModels.GPT_5_3_CHAT,
            PuterModels.GPT_5_2, PuterModels.GPT_5_2_CHAT, PuterModels.GPT_5_2_PRO,
            PuterModels.GPT_5_1, PuterModels.GPT_5_1_CHAT_LATEST,
            PuterModels.GPT_5_3_CODEX, PuterModels.GPT_5_2_CODEX, PuterModels.GPT_5_1_CODEX,
            PuterModels.GPT_5_1_CODEX_MINI, PuterModels.GPT_5_1_CODEX_MAX, PuterModels.GPT_5_CODEX,
            PuterModels.GPT_5_CHAT_LATEST, PuterModels.GPT_4_1, PuterModels.GPT_4_1_MINI,
            PuterModels.GPT_4_1_NANO, PuterModels.GPT_4_5_PREVIEW, PuterModels.GPT_4O,
            PuterModels.GPT_4O_MINI, PuterModels.O1, PuterModels.O1_MINI, PuterModels.O1_PRO,
            PuterModels.O3, PuterModels.O3_MINI, PuterModels.O4_MINI,
            PuterModels.OPENAI_GPT_5_2_CHAT, PuterModels.OPENAI_GPT_OSS_120B
        ]
        
        self.image_models = [
            PuterModels.GPT_IMAGE_1_5, PuterModels.GPT_IMAGE_1_MINI, PuterModels.GPT_IMAGE_1,
            PuterModels.DALL_E_3, PuterModels.DALL_E_2
        ]
        
        self.tts_models = [
            PuterModels.GPT_4O_MINI_TTS, PuterModels.TTS_1, PuterModels.TTS_1_HD
        ]
    
    async def generate(self, request: ProviderRequest) -> ProviderResponse:
        """
        Generate response using Puter.js API
        
        Supports text generation, image generation, and text-to-speech
        based on the model specified in the request.
        """
        
        if not AIOHTTP_AVAILABLE:
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error="aiohttp package not installed. Run: pip install aiohttp"
            )
        
        model = request.model or self.default_model
        start_time = datetime.now()
        
        try:
            # Determine the type of request based on model
            if model in self.image_models:
                return await self._generate_image(request, model, start_time)
            elif model in self.tts_models:
                return await self._generate_speech(request, model, start_time)
            else:
                return await self._generate_text(request, model, start_time)
                
        except Exception as e:
            logger.error(f"Puter provider error: {str(e)}")
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error=str(e)
            )
    
    async def _generate_text(
        self,
        request: ProviderRequest,
        model: str,
        start_time: datetime
    ) -> ProviderResponse:
        """Generate text using Puter.js AI chat API"""
        
        headers = {
            "Content-Type": "application/json"
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        if self.app_id:
            headers["X-Puter-App-ID"] = self.app_id
        
        # Build payload similar to puter.ai.chat()
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": request.prompt}],
        }
        
        # Add optional parameters
        if request.temperature:
            payload["temperature"] = request.temperature
        if request.max_tokens:
            payload["max_tokens"] = request.max_tokens
        
        # Check for streaming
        stream = request.metadata.get("stream", False) if request.metadata else False
        if stream:
            payload["stream"] = True
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/ai/chat",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status == 200:
                    if stream:
                        # Handle streaming response
                        output = ""
                        async for line in resp.content:
                            if line:
                                output += line.decode('utf-8')
                        tokens_used = len(output.split())
                    else:
                        data = await resp.json()
                        output = data.get("text") or data.get("choices", [{}])[0].get("message", {}).get("content", "")
                        tokens_used = data.get("usage", {}).get("total_tokens", len(output.split()))
                    
                    latency_ms = (datetime.now() - start_time).total_seconds() * 1000
                    # Estimate cost (Puter.js uses User-Pays model)
                    cost = (tokens_used / 1000) * 0.01  # Approximate
                    
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
                        error=f"Puter API error: {resp.status} - {error_data}"
                    )
    
    async def _generate_image(
        self,
        request: ProviderRequest,
        model: str,
        start_time: datetime
    ) -> ProviderResponse:
        """Generate image using Puter.js AI image API"""
        
        headers = {
            "Content-Type": "application/json"
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        if self.app_id:
            headers["X-Puter-App-ID"] = self.app_id
        
        payload = {
            "model": model,
            "prompt": request.prompt
        }
        
        # Add optional parameters from metadata
        if request.metadata:
            if "size" in request.metadata:
                payload["size"] = request.metadata["size"]
            if "quality" in request.metadata:
                payload["quality"] = request.metadata["quality"]
            if "style" in request.metadata:
                payload["style"] = request.metadata["style"]
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/ai/txt2img",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    # Image URL or base64 data
                    image_url = data.get("url") or data.get("data", [{}])[0].get("url", "")
                    image_base64 = data.get("base64") or data.get("data", [{}])[0].get("base64", "")
                    
                    latency_ms = (datetime.now() - start_time).total_seconds() * 1000
                    cost = 0.01  # Image generation cost estimate
                    
                    output = image_url or f"[IMAGE_BASE64:{len(image_base64)} chars]"
                    
                    return ProviderResponse(
                        provider_name=self.name,
                        output=output,
                        tokens_used=len(request.prompt.split()),
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
                        error=f"Puter image API error: {resp.status} - {error_data}"
                    )
    
    async def _generate_speech(
        self,
        request: ProviderRequest,
        model: str,
        start_time: datetime
    ) -> ProviderResponse:
        """Generate speech using Puter.js AI text-to-speech API"""
        
        headers = {
            "Content-Type": "application/json"
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        if self.app_id:
            headers["X-Puter-App-ID"] = self.app_id
        
        payload = {
            "model": model,
            "input": request.prompt,
            "voice": request.metadata.get("voice", "alloy") if request.metadata else "alloy"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/ai/txt2speech",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    audio_url = data.get("url") or data.get("data", {}).get("url", "")
                    
                    latency_ms = (datetime.now() - start_time).total_seconds() * 1000
                    cost = 0.005  # TTS cost estimate
                    
                    return ProviderResponse(
                        provider_name=self.name,
                        output=audio_url or "[AUDIO_GENERATED]",
                        tokens_used=len(request.prompt.split()),
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
                        error=f"Puter TTS API error: {resp.status} - {error_data}"
                    )
    
    def get_supported_models(self) -> Dict[str, list]:
        """Return supported models grouped by type"""
        return {
            "text": self.text_models,
            "image": self.image_models,
            "tts": self.tts_models
        }


# Convenience function for quick initialization
def create_puter_provider(
    api_key: Optional[str] = None,
    default_model: str = PuterModels.GPT_5_NANO
) -> PuterProvider:
    """Create and return a configured PuterProvider instance"""
    return PuterProvider(
        api_key=api_key,
        default_model=default_model
    )

