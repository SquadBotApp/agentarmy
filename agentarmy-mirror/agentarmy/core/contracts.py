# contracts.py
# Defines core contract types for AgentArmy

from typing import Any, Dict

class TaskResult:
    """Represents the result of a task execution."""
    def __init__(self, success: bool, output: Any = None, error: str = None, metadata: Dict = None):
        self.success = success
        self.output = output
        self.error = error
        self.metadata = metadata or {}
