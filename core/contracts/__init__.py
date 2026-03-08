"""
Contracts layer - Option B exports
Single source of truth for TaskResult and SimulationMetrics
"""
from .task_result import TaskResult, SimulationMetrics

__all__ = [
    "TaskResult",
    "SimulationMetrics",
]

