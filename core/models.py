"""
Option B: Minimal modular architecture data models
Single responsibility: Input → ProviderRouter → Provider → TaskResult
"""
from typing import Any, Optional


class TaskResult:
    """
    OPTION B MINIMAL: TaskResult with only essential fields.
    Input → ProviderRouter → Provider → TaskResult
    
    ONLY contains:
    - success: bool (did the task succeed?)
    - output: str (the result from the provider)
    - provider: str (which provider executed this?)
    """
    def __init__(
        self,
        success: bool,
        output: str,
        provider: Optional[str] = None,
    ):
        self.success = success
        self.output = output
        self.provider = provider
    
    def __repr__(self):
        return f"TaskResult(success={self.success}, provider={self.provider}, output_len={len(self.output)})"


class Task:
    """A task to be executed"""
    def __init__(
        self,
        name: str,
        description: str = "",
    ):
        self.name = name
        self.description = description
    
    def __repr__(self):
        return f"Task(name={self.name})"
