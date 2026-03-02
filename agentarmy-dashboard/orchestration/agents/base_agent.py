from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseAgent(ABC):
    """Abstract agent contract used by the execution layer."""

    def __init__(self, agent_id: str, name: str, role: str) -> None:
        self.agent_id = agent_id
        self.name = name
        self.role = role

    @abstractmethod
    async def execute(self, task_spec: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task and return a normalized output payload."""
