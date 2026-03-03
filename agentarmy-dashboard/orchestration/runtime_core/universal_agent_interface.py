from abc import ABC, abstractmethod
from typing import Any, Dict

class UniversalAgentInterface(ABC):
    """Universal contract for all agents and subsystems."""

    @abstractmethod
    def get_id(self) -> str:
        """Unique agent/subsystem identifier."""
        pass

    @abstractmethod
    def get_capabilities(self) -> Dict[str, Any]:
        """Describe what this agent/subsystem can do."""
        pass

    @abstractmethod
    def handle_event(self, event: Dict[str, Any]) -> Any:
        """Process an event from the event bus."""
        pass

    @abstractmethod
    def execute(self, task: Dict[str, Any]) -> Any:
        """Run a task or action."""
        pass

    @abstractmethod
    def get_state(self) -> Dict[str, Any]:
        """Return current state for governance/economic hooks."""
        pass
