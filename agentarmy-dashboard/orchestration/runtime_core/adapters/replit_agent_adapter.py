"""
Adapter for Replit Agents
Implements UniversalAgentInterface for Replit AI agents.

Replit Agents are AI-powered coding assistants that can:
- Write, edit, and debug code
- Run terminal commands
- Work with files and directories
- Execute in isolated containers
- Deploy applications

This adapter provides a unified interface for integrating Replit Agents
with the AgentArmy orchestration system.
"""

import os
import logging
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime

# Import the base interface
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
try:
    from runtime_core.universal_agent_interface import UniversalAgentInterface
    from runtime_core.event_bus import EventBus
except ImportError:
    # Fallback for when imports aren't set up
    UniversalAgentInterface = object
    EventBus = None

logger = logging.getLogger(__name__)


class ReplitAgentAdapter(UniversalAgentInterface):
    """
    Adapter for Replit AI Agents.
    
    Provides integration with Replit's agentic AI capabilities,
    allowing the AgentArmy system to leverage Replit agents
    for coding tasks, debugging, and development workflows.
    """
    
    # Default capabilities of Replit agents
    DEFAULT_CAPABILITIES = [
        "code_generation",
        "code_editing", 
        "terminal_execution",
        "file_operations",
        "web_browsing",
        "debugging",
        "unit_testing",
        "deployment",
        "code_review",
        "refactoring"
    ]
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the Replit Agent adapter.
        
        Args:
            config: Configuration dictionary containing:
                - api_key: Replit API key (or REPLIT_API_KEY env var)
                - workspace_id: Replit workspace ID (or REPLIT_WORKSPACE_ID)
                - agent_id: Specific agent to use (default: "default")
                - timeout: Session timeout in seconds (default: 120)
                - auto_cleanup: Whether to auto-cleanup sessions (default: True)
        """
        self.config = config or {}
        self.api_key = self.config.get("api_key") or os.getenv("REPLIT_API_KEY")
        self.workspace_id = self.config.get("workspace_id") or os.getenv("REPLIT_WORKSPACE_ID")
        self.agent_id = self.config.get("agent_id", "default")
        self.timeout = self.config.get("timeout", 120)
        self.auto_cleanup = self.config.get("auto_cleanup", True)
        
        # State management
        self.id = f"replit-agent-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.state = "idle"
        self.event_bus = None
        self._sessions: Dict[str, Dict[str, Any]] = {}
        
        # Performance metrics
        self.tasks_completed = 0
        self.tasks_failed = 0
        self.total_execution_time = 0.0
        
        logger.info(f"ReplitAgentAdapter initialized with agent_id: {self.agent_id}")
    
    def attach_event_bus(self, event_bus: EventBus):
        """Attach an event bus for emitting events."""
        self.event_bus = event_bus
        logger.info("ReplitAgentAdapter attached to event bus")
    
    def _emit_event(self, event_type: str, data: Dict[str, Any]):
        """Emit an event if event bus is available."""
        if self.event_bus:
            self.event_bus.emit({
                "type": event_type,
                "source": "replit_agent",
                "timestamp": datetime.now().isoformat(),
                "data": data
            })
    
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a task using the Replit Agent.
        
        Args:
            task: Task dictionary containing:
                - prompt: The task description/code
                - language: Programming language (optional)
                - context: Additional context files (optional)
                - timeout: Override default timeout (optional)
        
        Returns:
            Result dictionary with:
                - status: "success" or "failed"
                - output: Agent's output
                - logs: Execution logs
                - metadata: Additional metadata
        """
        self.state = "executing"
        self._emit_event("agent_execution_started", {"task_id": task.get("id", "unknown")})
        
        start_time = datetime.now()
        session_id = None
        
        try:
            prompt = task.get("prompt", task.get("description", ""))
            if not prompt:
                return {
                    "status": "failed",
                    "error": "No prompt provided",
                    "output": ""
                }
            
            # Create a new agent session
            session_id = await self._create_session(prompt, task)
            
            if not session_id:
                self.state = "idle"
                self.tasks_failed += 1
                return {
                    "status": "failed",
                    "error": "Failed to create agent session",
                    "output": ""
                }
            
            # Wait for completion
            result = await self._wait_for_session(session_id, task)
            
            execution_time = (datetime.now() - start_time).total_seconds()
            self.total_execution_time += execution_time
            
            if result.get("success"):
                self.state = "completed"
                self.tasks_completed += 1
                self._emit_event("agent_execution_completed", {
                    "session_id": session_id,
                    "execution_time": execution_time
                })
                
                return {
                    "status": "success",
                    "output": result.get("output", ""),
                    "logs": result.get("logs", []),
                    "metadata": {
                        "session_id": session_id,
                        "execution_time": execution_time,
                        "agent_id": self.agent_id
                    }
                }
            else:
                self.state = "failed"
                self.tasks_failed += 1
                self._emit_event("agent_execution_failed", {
                    "session_id": session_id,
                    "error": result.get("error")
                })
                
                return {
                    "status": "failed",
                    "error": result.get("error", "Agent execution failed"),
                    "output": "",
                    "metadata": {
                        "session_id": session_id,
                        "execution_time": execution_time
                    }
                }
                
        except Exception as e:
            logger.error(f"Replit agent execution error: {str(e)}")
            self.state = "error"
            self.tasks_failed += 1
            return {
                "status": "failed",
                "error": str(e),
                "output": ""
            }
        finally:
            # Cleanup session if enabled
            if session_id and self.auto_cleanup:
                await self._cleanup_session(session_id)
            
            if self.state in ("completed", "failed", "error"):
                self.state = "idle"
    
    async def _create_session(self, prompt: str, task: Dict[str, Any]) -> Optional[str]:
        """Create a new Replit agent session."""
        import uuid
        import requests
        
        session_id = str(uuid.uuid4())
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            base_url = os.getenv("REPLIT_API_URL", "https://api.replit.com/v1")
            
            payload = {
                "session_id": session_id,
                "prompt": prompt,
                "agent_id": self.agent_id,
                "workspace_id": self.workspace_id,
                "context": {
                    "language": task.get("language"),
                    "working_directory": task.get("working_dir", "/home/user"),
                    "environment": task.get("environment", {})
                }
            }
            
            response = requests.post(
                f"{base_url}/agents/sessions",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code in (200, 201):
                data = response.json()
                actual_session_id = data.get("session_id", session_id)
                
                self._sessions[actual_session_id] = {
                    "status": "running",
                    "created_at": datetime.now(),
                    "task": task
                }
                
                self._emit_event("session_created", {"session_id": actual_session_id})
                return actual_session_id
            else:
                logger.error(f"Failed to create session: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating session: {str(e)}")
            return None
    
    async def _wait_for_session(
        self, 
        session_id: str, 
        task: Dict[str, Any],
        poll_interval: float = 2.0
    ) -> Dict[str, Any]:
        """Wait for session completion by polling."""
        import requests
        import asyncio
        
        timeout = task.get("timeout", self.timeout)
        base_url = os.getenv("REPLIT_API_URL", "https://api.replit.com/v1")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }
        
        start_time = datetime.now()
        
        while (datetime.now() - start_time).total_seconds() < timeout:
            try:
                response = requests.get(
                    f"{base_url}/agents/sessions/{session_id}",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    status = data.get("status", "unknown")
                    
                    if status == "completed":
                        return {
                            "success": True,
                            "output": data.get("output", ""),
                            "logs": data.get("logs", [])
                        }
                    
                    elif status in ("failed", "error"):
                        return {
                            "success": False,
                            "error": data.get("error", "Agent execution failed")
                        }
                    
                    # Still running, emit progress
                    self._emit_event("session_progress", {
                        "session_id": session_id,
                        "status": status,
                        "progress": data.get("progress", 0)
                    })
                    
                    await asyncio.sleep(poll_interval)
                    
                else:
                    return {
                        "success": False,
                        "error": f"Status check failed: {response.status_code}"
                    }
                    
            except Exception as e:
                logger.error(f"Error polling session: {str(e)}")
                await asyncio.sleep(poll_interval)
        
        return {
            "success": False,
            "error": f"Session timeout after {timeout} seconds"
        }
    
    async def _cleanup_session(self, session_id: str):
        """Clean up a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            self._emit_event("session_cleaned", {"session_id": session_id})
    
    async def step(self) -> Dict[str, Any]:
        """
        Execute one step of the agent's main loop.
        Used for interactive/direct control scenarios.
        """
        return {
            "status": "idle",
            "message": "Replit agent uses session-based execution. Use execute() instead."
        }
    
    def shutdown(self):
        """Clean up resources on shutdown."""
        logger.info(f"Shutting down ReplitAgentAdapter {self.id}")
        
        # Cancel any running sessions
        for session_id in list(self._sessions.keys()):
            asyncio.create_task(self._cleanup_session(session_id))
        
        self.state = "shutdown"
    
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
            "tasks_completed": self.tasks_completed,
            "tasks_failed": self.tasks_failed
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Return performance statistics."""
        avg_time = (
            self.total_execution_time / self.tasks_completed 
            if self.tasks_completed > 0 else 0
        )
        
        return {
            "id": self.id,
            "state": self.state,
            "tasks_completed": self.tasks_completed,
            "tasks_failed": self.tasks_failed,
            "success_rate": (
                self.tasks_completed / (self.tasks_completed + self.tasks_failed)
                if (self.tasks_completed + self.tasks_failed) > 0 else 0
            ),
            "total_execution_time": self.total_execution_time,
            "average_execution_time": avg_time,
            "active_sessions": len(self._sessions),
            "capabilities": self.get_capabilities()
        }
    
    def handle_event(self, event: Dict[str, Any]):
        """Handle incoming events."""
        event_type = event.get("type", "")
        
        if event_type == "cancel_session":
            session_id = event.get("session_id")
            if session_id in self._sessions:
                asyncio.create_task(self._cleanup_session(session_id))
        
        elif event_type == "get_status":
            self._emit_event("agent_status", self.get_stats())
        
        logger.debug(f"ReplitAgentAdapter handled event: {event_type}")


class ReplitAgentFactory:
    """Factory for creating ReplitAgentAdapter instances."""
    
    @staticmethod
    def create(config: Optional[Dict[str, Any]] = None) -> ReplitAgentAdapter:
        """Create a new ReplitAgentAdapter with the given config."""
        return ReplitAgentAdapter(config)
    
    @staticmethod
    def create_from_env() -> ReplitAgentAdapter:
        """Create a ReplitAgentAdapter using environment variables."""
        config = {
            "api_key": os.getenv("REPLIT_API_KEY"),
            "workspace_id": os.getenv("REPLIT_WORKSPACE_ID"),
            "agent_id": os.getenv("REPLIT_AGENT_ID", "default"),
            "timeout": int(os.getenv("REPLIT_TIMEOUT_SECONDS", "120")),
            "auto_cleanup": os.getenv("REPLIT_AUTO_CLEANUP", "true").lower() == "true"
        }
        return ReplitAgentAdapter(config)

