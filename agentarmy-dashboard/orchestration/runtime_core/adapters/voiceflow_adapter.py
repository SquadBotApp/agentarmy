"""
Adapter for Voiceflow Conversational AI
Implements UniversalAgentInterface for Voiceflow conversational AI platform.

Voiceflow is a platform for building conversational AI assistants that can:
- Handle multi-turn conversations
- Recognize user intents
- Manage dialogue flows
- Integrate with voice assistants (Alexa, Google Assistant)
- Process text and voice inputs

This adapter provides a unified interface for integrating Voiceflow
with the AgentArmy orchestration system.
"""

import os
import logging
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime

# Import the base interface
import sys
import os as _os
sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))))
try:
    from runtime_core.universal_agent_interface import UniversalAgentInterface
    from runtime_core.event_bus import EventBus
except ImportError:
    # Fallback for when imports aren't set up
    UniversalAgentInterface = object
    EventBus = None

logger = logging.getLogger(__name__)


class VoiceflowAdapter(UniversalAgentInterface):
    """
    Adapter for Voiceflow Conversational AI.
    
    Provides integration with Voiceflow's conversational AI capabilities,
    allowing the AgentArmy system to leverage Voiceflow for building
    chatbots, voice assistants, and customer support automation.
    """
    
    # Default capabilities of Voiceflow
    DEFAULT_CAPABILITIES = [
        "conversational_ai",
        "intent_recognition",
        "dialogue_management",
        "multi_turn_conversation",
        "slot_filling",
        "entity_extraction",
        "voice_assistant",
        "customer_support_automation",
        "faq_handling",
        "handoff_to_human"
    ]
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Voiceflow adapter.
        
        Args:
            config: Configuration dictionary containing:
                - api_key: Voiceflow API key (or VOICEFLOW_API_KEY env var)
                - version_id: Voiceflow version (default: "production")
                - runtime_url: Custom runtime URL (optional)
                - timeout: Request timeout in seconds (default: 30)
        """
        self.config = config or {}
        self.api_key = self.config.get("api_key") or os.getenv("VOICEFLOW_API_KEY")
        self.version_id = self.config.get("version_id") or os.getenv("VOICEFLOW_VERSION_ID", "production")
        self.runtime_url = self.config.get("runtime_url") or os.getenv("VOICEFLOW_RUNTIME_URL", "https://general-runtime.voiceflow.com")
        self.timeout = self.config.get("timeout", 30)
        
        # State management
        self.id = f"voiceflow-adapter-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.state = "idle"
        self.event_bus = None
        self._sessions: Dict[str, Dict[str, Any]] = {}
        
        # Performance metrics
        self.conversations_handled = 0
        self.messages_processed = 0
        self.errors = 0
        
        logger.info(f"VoiceflowAdapter initialized with version: {self.version_id}")
    
    def attach_event_bus(self, event_bus: EventBus):
        """Attach an event bus for emitting events."""
        self.event_bus = event_bus
        logger.info("VoiceflowAdapter attached to event bus")
    
    def _emit_event(self, event_type: str, data: Dict[str, Any]):
        """Emit an event if event bus is available."""
        if self.event_bus:
            self.event_bus.emit({
                "type": event_type,
                "source": "voiceflow_adapter",
                "timestamp": datetime.now().isoformat(),
                "data": data
            })
    
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a conversational task using Voiceflow.
        
        Args:
            task: Task dictionary containing:
                - message: The user's message
                - session_id: Existing conversation session (optional)
                - user_id: User identifier (optional)
                - context: Additional context (optional)
        
        Returns:
            Result dictionary with:
                - status: "success" or "failed"
                - response: AI's response message
                - session_id: Conversation session ID
                - metadata: Additional metadata
        """
        self.state = "processing"
        self._emit_event("conversation_started", {"task_id": task.get("id", "unknown")})
        
        import uuid
        
        try:
            message = task.get("message", task.get("prompt", ""))
            session_id = task.get("session_id")
            user_id = task.get("user_id", f"user_{datetime.now().timestamp()}")
            
            if not message:
                return {
                    "status": "failed",
                    "error": "No message provided",
                    "response": ""
                }
            
            # Create session if not exists
            if not session_id:
                session_id = await self._create_session(user_id, task)
                
                if not session_id:
                    self.state = "idle"
                    self.errors += 1
                    return {
                        "status": "failed",
                        "error": "Failed to create conversation session",
                        "response": ""
                    }
            
            # Send message to Voiceflow
            result = await self._send_message(session_id, message, task)
            
            self.messages_processed += 1
            
            if result.get("success"):
                self.state = "completed"
                self.conversations_handled += 1
                self._emit_event("conversation_completed", {
                    "session_id": session_id,
                    "message": message
                })
                
                return {
                    "status": "success",
                    "response": result.get("response", ""),
                    "session_id": session_id,
                    "intents": result.get("intents", []),
                    "entities": result.get("entities", []),
                    "metadata": {
                        "version_id": self.version_id,
                        "user_id": user_id
                    }
                }
            else:
                self.state = "failed"
                self.errors += 1
                self._emit_event("conversation_failed", {
                    "session_id": session_id,
                    "error": result.get("error")
                })
                
                return {
                    "status": "failed",
                    "error": result.get("error", "Conversation failed"),
                    "response": "",
                    "session_id": session_id
                }
                
        except Exception as e:
            logger.error(f"Voiceflow adapter error: {str(e)}")
            self.state = "error"
            self.errors += 1
            return {
                "status": "failed",
                "error": str(e),
                "response": ""
            }
        finally:
            if self.state in ("completed", "failed", "error"):
                self.state = "idle"
    
    async def _create_session(
        self, 
        user_id: str, 
        task: Dict[str, Any]
    ) -> Optional[str]:
        """Create a new Voiceflow conversation session."""
        import uuid
        import requests
        
        session_id = str(uuid.uuid4())
        
        try:
            headers = {
                "Authorization": self.api_key,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            payload = {
                "userID": user_id,
                "sessionID": session_id,
                "metadata": {
                    "source": "agentarmy",
                    **task.get("context", {})
                }
            }
            
            response = requests.post(
                f"{self.runtime_url}/dialogue/{self.version_id}/start",
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code in (200, 201):
                data = response.json()
                actual_session_id = session_id
                
                self._sessions[actual_session_id] = {
                    "status": "active",
                    "user_id": user_id,
                    "created_at": datetime.now(),
                    "version_id": self.version_id
                }
                
                self._emit_event("session_created", {"session_id": actual_session_id})
                return actual_session_id
            else:
                logger.error(f"Failed to create session: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating session: {str(e)}")
            return None
    
    async def _send_message(
        self, 
        session_id: str, 
        message: str,
        task: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send a message to the conversation."""
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
                "metadata": task.get("context", {})
            }
            
            response = requests.post(
                f"{self.runtime_url}/dialogue/{self.version_id}/interaction",
                json=payload,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract responses from trace
                outputs = []
                intents = []
                entities = []
                
                for trace in data.get("trace", []):
                    if trace.get("type") == "text":
                        outputs.append(trace.get("payload", {}).get("message", ""))
                    elif trace.get("type") == "speak":
                        outputs.append(trace.get("payload", {}).get("message", ""))
                    elif trace.get("type") == "intent":
                        intents.append(trace.get("payload", {}))
                    elif trace.get("type") == "entity":
                        entities.append(trace.get("payload", {}))
                
                response_text = "\n".join(outputs) if outputs else "No response"
                
                return {
                    "success": True,
                    "response": response_text,
                    "intents": intents,
                    "entities": entities,
                    "raw_response": data
                }
            else:
                return {
                    "success": False,
                    "error": f"Voiceflow API error: {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def step(self) -> Dict[str, Any]:
        """
        Execute one step of the adapter's operation.
        Used for direct control scenarios.
        """
        return {
            "status": "idle",
            "message": "Voiceflow adapter uses session-based conversation. Use execute() instead."
        }
    
    def shutdown(self):
        """Clean up resources on shutdown."""
        logger.info(f"Shutting down VoiceflowAdapter {self.id}")
        
        # End all active sessions
        for session_id in list(self._sessions.keys()):
            self.end_session(session_id)
        
        self.state = "shutdown"
    
    def end_session(self, session_id: str) -> bool:
        """End a specific conversation session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            self._emit_event("session_ended", {"session_id": session_id})
            logger.info(f"Session {session_id} ended")
            return True
        return False
    
    def get_capabilities(self) -> List[str]:
        """Return the capabilities of this adapter."""
        return self.DEFAULT_CAPABILITIES.copy()
    
    def get_id(self) -> str:
        """Return the unique identifier of this adapter."""
        return self.id
    
    def get_state(self) -> Dict[str, Any]:
        """Return the current state of the adapter."""
        return {
            "id": self.id,
            "state": self.state,
            "active_sessions": len(self._sessions),
            "conversations_handled": self.conversations_handled,
            "messages_processed": self.messages_processed,
            "errors": self.errors
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Return performance statistics."""
        total_interactions = self.conversations_handled + self.errors
        
        return {
            "id": self.id,
            "state": self.state,
            "conversations_handled": self.conversations_handled,
            "messages_processed": self.messages_processed,
            "errors": self.errors,
            "success_rate": (
                self.conversations_handled / total_interactions
                if total_interactions > 0 else 0
            ),
            "active_sessions": len(self._sessions),
            "version_id": self.version_id,
            "capabilities": self.get_capabilities()
        }
    
    def handle_event(self, event: Dict[str, Any]):
        """Handle incoming events."""
        event_type = event.get("type", "")
        
        if event_type == "end_session":
            session_id = event.get("session_id")
            if session_id:
                self.end_session(session_id)
        
        elif event_type == "get_status":
            self._emit_event("adapter_status", self.get_stats())
        
        elif event_type == "transfer_to_human":
            session_id = event.get("session_id")
            user_data = event.get("user_data", {})
            # Handle handoff to human agent
            self._emit_event("human_handoff", {
                "session_id": session_id,
                "user_data": user_data,
                "reason": event.get("reason", "user_request")
            })
        
        logger.debug(f"VoiceflowAdapter handled event: {event_type}")


class VoiceflowFactory:
    """Factory for creating VoiceflowAdapter instances."""
    
    @staticmethod
    def create(config: Optional[Dict[str, Any]] = None) -> VoiceflowAdapter:
        """Create a new VoiceflowAdapter with the given config."""
        return VoiceflowAdapter(config)
    
    @staticmethod
    def create_from_env() -> VoiceflowAdapter:
        """Create a VoiceflowAdapter using environment variables."""
        config = {
            "api_key": os.getenv("VOICEFLOW_API_KEY"),
            "version_id": os.getenv("VOICEFLOW_VERSION_ID", "production"),
            "runtime_url": os.getenv("VOICEFLOW_RUNTIME_URL"),
            "timeout": int(os.getenv("VOICEFLOW_TIMEOUT_SECONDS", "30"))
        }
        return VoiceflowAdapter(config)

