"""
Replit Agents Provider Implementation
Integrates Replit Agents as a provider for the AgentArmy system.

Replit Agents are AI-powered coding agents that can:
- Write and edit code
- Run commands in a terminal
- Browse the web
- Use files and directories
- Work in a containerized environment

API Reference: https://docs.replit.com/replitai/agents-api
"""

import os
import logging
import uuid
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


class ReplitProvider(Provider):
    """
    Replit Agents API provider implementation.
    
    Uses the Replit Agents API to execute coding tasks through AI agents.
    Each request creates a new agent session and retrieves the results.
    """
    
    def __init__(self, api_key: Optional[str] = None, workspace_id: Optional[str] = None):
        super().__init__("replit", api_key or os.getenv("REPLIT_API_KEY"))
        self.workspace_id = workspace_id or os.getenv("REPLIT_WORKSPACE_ID")
        self.base_url = os.getenv("REPLIT_API_URL", "https://api.replit.com/v1")
        self.agent_id = os.getenv("REPLIT_AGENT_ID", "default")
        self.timeout = int(os.getenv("REPLIT_TIMEOUT_SECONDS", "120"))
        
        # Session management
        self._sessions: Dict[str, Dict[str, Any]] = {}
        
        logger.info(f"ReplitProvider initialized with workspace: {self.workspace_id}")
    
    async def generate(self, request: ProviderRequest) -> ProviderResponse:
        """
        Generate response by creating a Replit agent session and executing the task.
        
        The agent will:
        1. Analyze the request/prompt
        2. Execute appropriate code/actions
        3. Return the results
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
                error="Replit API key not configured. Set REPLIT_API_KEY environment variable."
            )
        
        start_time = datetime.now()
        
        try:
            # Create a new agent session
            session_id = await self._create_session(request.prompt, request.metadata)
            
            if not session_id:
                return ProviderResponse(
                    provider_name=self.name,
                    output="",
                    success=False,
                    error="Failed to create Replit agent session"
                )
            
            # Poll for completion
            result = await self._wait_for_completion(session_id, request.metadata)
            
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
                    error=result.get("error", "Agent execution failed")
                )
                
        except Exception as e:
            logger.error(f"Replit provider error: {str(e)}")
            return ProviderResponse(
                provider_name=self.name,
                output="",
                success=False,
                error=str(e)
            )
    
    async def _create_session(self, prompt: str, metadata: Dict[str, Any]) -> Optional[str]:
        """Create a new Replit agent session."""
        
        session_id = str(uuid.uuid4())
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            payload = {
                "session_id": session_id,
                "prompt": prompt,
                "agent_id": self.agent_id,
                "workspace_id": self.workspace_id,
                "metadata": {
                    **metadata,
                    "created_by": "agentarmy",
                    "created_at": datetime.now().isoformat()
                }
            }
            
            # Use requests for initial session creation (synchronous for reliability)
            response = requests.post(
                f"{self.base_url}/agents/sessions",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code in (200, 201):
                data = response.json()
                actual_session_id = data.get("session_id", session_id)
                self._sessions[actual_session_id] = {
                    "status": "running",
                    "created_at": datetime.now()
                }
                return actual_session_id
            else:
                logger.error(f"Failed to create session: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating Replit session: {str(e)}")
            return None
    
    async def _wait_for_completion(
        self, 
        session_id: str, 
        metadata: Dict[str, Any],
        poll_interval: float = 2.0,
        max_wait: int = 120
    ) -> Dict[str, Any]:
        """Poll for agent session completion."""
        
        import asyncio
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }
        
        start_time = datetime.now()
        elapsed = 0
        
        while elapsed < max_wait:
            try:
                response = requests.get(
                    f"{self.base_url}/agents/sessions/{session_id}",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    status = data.get("status", "unknown")
                    
                    if status == "completed":
                        # Extract output from the response
                        output = data.get("output", "")
                        if isinstance(output, dict):
                            output = output.get("result", str(output))
                        
                        return {
                            "success": True,
                            "output": output,
                            "tokens_used": data.get("usage", {}).get("total_tokens", 0),
                            "cost": data.get("cost", 0.0)
                        }
                    
                    elif status in ("failed", "error"):
                        return {
                            "success": False,
                            "error": data.get("error", "Agent execution failed")
                        }
                    
                    # Still running, continue polling
                    await asyncio.sleep(poll_interval)
                    elapsed = (datetime.now() - start_time).total_seconds()
                    
                else:
                    return {
                        "success": False,
                        "error": f"Status check failed: {response.status_code}"
                    }
                    
            except Exception as e:
                logger.error(f"Error polling session {session_id}: {str(e)}")
                await asyncio.sleep(poll_interval)
                elapsed = (datetime.now() - start_time).total_seconds()
        
        # Timeout
        return {
            "success": False,
            "error": f"Session timeout after {max_wait} seconds"
        }
    
    def get_capabilities(self) -> List[str]:
        """Return the capabilities of the Replit agent."""
        return [
            "code_generation",
            "code_editing",
            "terminal_execution",
            "web_browsing",
            "file_operations",
            "debugging",
            "testing",
            "deployment",
            "code_review"
        ]
    
    async def create_interactive_session(self, prompt: str) -> Optional[str]:
        """Create an interactive session for real-time collaboration."""
        return await self._create_session(prompt, {"interactive": True})
    
    async def send_message(self, session_id: str, message: str) -> Dict[str, Any]:
        """Send a follow-up message to an existing session."""
        
        if not self.api_key:
            return {"success": False, "error": "API key not configured"}
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.base_url}/agents/sessions/{session_id}/messages",
                json={"message": message},
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": f"Failed to send message: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_session_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of an existing session."""
        
        if not self.api_key:
            return None
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Accept": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/agents/sessions/{session_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            return None
            
        except Exception:
            return None


class ReplitAgentConfig:
    """Configuration for Replit Agent integration."""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        workspace_id: Optional[str] = None,
        agent_id: str = "default",
        timeout_seconds: int = 120,
        auto_scale: bool = True,
        max_concurrent_sessions: int = 10
    ):
        self.api_key = api_key or os.getenv("REPLIT_API_KEY")
        self.workspace_id = workspace_id or os.getenv("REPLIT_WORKSPACE_ID")
        self.agent_id = agent_id
        self.timeout_seconds = timeout_seconds
        self.auto_scale = auto_scale
        self.max_concurrent_sessions = max_concurrent_sessions
    
    def is_configured(self) -> bool:
        """Check if the provider is properly configured."""
        return bool(self.api_key)
    
    def get_provider(self) -> ReplitProvider:
        """Create and return a ReplitProvider instance with this config."""
        return ReplitProvider(
            api_key=self.api_key,
            workspace_id=self.workspace_id
        )

