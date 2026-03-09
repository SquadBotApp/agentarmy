"""
Contracts re-export module for backward compatibility.
All models are now in core.models - this just re-exports them.
"""

from core.models import TaskResult, Task

__all__ = ["TaskResult", "Task"]
