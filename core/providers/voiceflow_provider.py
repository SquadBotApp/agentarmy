"""
Voiceflow Provider Implementation
Integrates Voiceflow as a provider for the AgentArmy system.

Voiceflow is a platform for building conversational AI assistants and voice apps.
This integration allows the AgentArmy system to leverage Voiceflow's
conversational AI capabilities.

API Reference: https://developer.voiceflow.com/docs/api
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

try:
    import aiohttp
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

from .router import Provider, ProviderRequest, ProviderResponse

logger = logging.getLogger(__name__)


class VoiceflowProvider(Provider):
    """
    Voiceflow API provider implementation.
    
    Uses the Voiceflow API to create conversational AI experiences.
    Supports dialogue management, intent recognition, and voice/text interfaces.
    """
    
    def __init__(self, api_key: Optional[str] = None, version_id: Optional[str] = None):
        super().__init__("voiceflow", api_key or os.getenv("VOICEFLOW_API_KEY"))
        self.version_id = version_id or os.getenv("VOICEFLOW_VERSION_ID", "production")
        self.base_url = os.getenv("VOICEFLOW_API_URL", "https://api.voiceflow.com/v2")
        self.runtime_url = os.getenv("VOICEFLOW_RUNTIME_URL", "https://general-runtime.voiceflow.com")
        self.timeout = int(os.getenv("VOICEFLOW_TIMEOUT_SECONDS", "30"))
        
        # Session management for conversations
        self._sessions: Dict[str, Dict[str, Any]] = {}
        
        logger.info(f"VoiceflowProvider initialized with version: {self.version_id}")
    
    async def generate(self, request: ProviderRequest) -> ProviderResponse:
        """
        Generate response using Voiceflow's conversational AI.
        
        Creates or continues a conversation session and returns the AI's response.
        """
        
        if not REQUESTS_AVAILABLE:
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error="requests/aiohttp package not installed. Run: pip install aiohttp requests"
            )
        
        if not self.api_key:
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error="Voiceflow API key not configured. Set VOICEFLOW_API_KEY environment variable."
            )
        
        start_time = datetime.now()
        
        try:
            # Extract session and request data from metadata or create new session
            session_id = request.metadata.get("session_id") if request.metadata else None
            if not session_id:
                session_id = await self._create_session(request.metadata)
            
            # Send message to the conversation
            result = await self._send_message(session_id, request.prompt, request.metadata)
            
            latency_ms = (datetime.now() - start_time).total_seconds() * 1000
            
            if result.get("success"):
                return ProviderResponse(
                    provider_name=self.name,
                    output=result.get("output", ""),
                    tokens_used=result.get("tokens_used", 0),
                    latency_ms=latency_ms,
                    cost=result.get("cost", 0.0),
                    success=True
                )
            else:
                return ProviderResponse(
                    provider_name=self.name,
                    output="",
                    success=False,
                    error=result.get("error", "Voiceflow conversation failed")
                )
                
        except Exception as e:
            logger.error(f"Voiceflow provider error: {str(e)}")
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error=str(e)
            )
    
    async def _create_session(self, metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """Create a new Voiceflow conversation session."""
        import uuid
        
        session_id = str(uuid.uuid4())
        
        try:
            headers = {
                "Authorization": self.api_key,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            payload = {
                "sessionID": session_id,
                "metadata": metadata or {}
            }
            
            response = requests.post(
                f"{self.runtime_url}/dialogue/{self.version_id}/start",
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code in (200, 201):
                data = response.json()
                self._sessions[session_id] = {
                    "status": "active",
                    "created_at": datetime.now(),
                    "version_id": self.version_id
                }
                return session_id
            else:
                logger.error(f"Failed to create session: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating Voiceflow session: {str(e)}")
            return None
    
    async def _send_message(
        self, 
        session_id: str, 
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send a message to an existing Voiceflow conversation."""
        import requests
        
        try:
            headers = {
                "Authorization": self.api_key,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            payload = {
                "request": {
                    "type": "text",
                    "payload": message
                },
                "metadata": metadata or {}
            }
            
            response = requests.post(
                f"{self.runtime_url}/dialogue/{self.version_id}/interaction",
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract responses from Voiceflow
                outputs = []
                for trace in data.get("trace", []):
                    if trace.get("type") == "text":
                        outputs.append(trace.get("payload", {}).get("message", ""))
                    elif trace.get("type") == "speak":
                        outputs.append(trace.get("payload", {}).get("message", ""))
                
                output_text = "\n".join(outputs) if outputs else "No response"
                
                return {
                    "success": True,
                    "output": output_text,
                    "raw_response": data
                }
            else:
                return {
                    "success": False,
                    "error": f"Voiceflow API error: {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"Error sending message to Voiceflow: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_capabilities(self) -> List[str]:
        """Return the capabilities of Voiceflow."""
        return [
            "conversational_ai",
            "intent_recognition",
            "dialogue_management",
            "voice_assistant",
            "chatbot",
            "customer_support",
            "text_to_speech",
            "speech_to_text",
            "slot_filling",
            "entity_extraction"
        ]
    
    async def create_conversation(
        self, 
        user_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """Create a new conversation session for a specific user."""
        session_id = f"user_{user_id}_{datetime.now().timestamp()}"
        
        try:
            headers = {
                "Authorization": self.api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "userID": user_id,
                "sessionID": session_id,
                "metadata": metadata or {}
            }
            
            response = requests.post(
                f"{self.runtime_url}/dialogue/{self.version_id}/start",
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code in (200, 201):
                self._sessions[session_id] = {
                    "status": "active",
                    "user_id": user_id,
                    "created_at": datetime.now()
                }
                return session_id
            return None
            
        except Exception as e:
            logger.error(f"Error creating conversation: {str(e)}")
            return None
    
    async def send_voice_message(
        self, 
        session_id: str, 
        audio_data: bytes,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send a voice message (audio) to the conversation."""
        
        if not self.api_key:
            return {"success": False, "error": "API key not configured"}
        
        try:
            headers = {
                "Authorization": self.api_key,
                "Content-Type": "audio/wav",
                "Accept": "application/json"
            }
            
            # Note: Voiceflow requires audio to be sent as multipart form data
            # This is a simplified version
            files = {"audio": ("audio.wav", audio_data, "audio/wav")}
            data = {"metadata": json.dumps(metadata or {})}
            
            response = requests.post(
                f"{self.runtime_url}/dialogue/{self.version_id}/voice",
                files=files,
                data=data,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": f"Failed: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def end_conversation(self, session_id: str) -> bool:
        """End a conversation session."""
        
        if session_id in self._sessions:
            del self._sessions[session_id]
            logger.info(f"Conversation {session_id} ended")
            return True
        return False


class VoiceflowConfig:
    """Configuration for Voiceflow integration."""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        version_id: str = "production",
        timeout_seconds: int = 30
    ):
        self.api_key = api_key or os.getenv("VOICEFLOW_API_KEY")
        self.version_id = version_id or os.getenv("VOICEFLOW_VERSION_ID", "production")
        self.timeout_seconds = timeout_seconds
    
    def is_configured(self) -> bool:
        """Check if Voiceflow is properly configured."""
        return bool(self.api_key)
    
    def get_provider(self) -> VoiceflowProvider:
        """Create and return a VoiceflowProvider instance."""
        return VoiceflowProvider(
            api_key=self.api_key,
            version_id=self.version_id
        )


# Import json for voice message handling
import json

