from dataclasses import dataclass
from typing import Optional

@dataclass
class SimulationMetrics:
    """Metrics from a single simulation run."""
    accuracy: float

@dataclass
class TaskResult:
    """
    The result of executing a single task.
    This is the standard data contract for results passed between core components.
    """
    task_name: str
    status: str  # 'completed' or 'failed'
    metrics: Optional[SimulationMetrics] = None
    error_message: Optional[str] = None
    simulation_id: Optional[str] = None