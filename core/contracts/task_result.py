"""
TaskResult - Option B contract
Minimal result object for modular orchestrator
"""
from typing import Optional


class TaskResult:
    """
    TaskResult for Option B Modular Orchestrator.
    
    Fields:
        success: bool - Whether the task completed successfully
        output: str - The output/response from the provider
        provider: Optional[str] - The name of the provider that handled the request
    """
    
    def __init__(
        self,
        success: bool,
        output: str,
        provider: Optional[str] = None
    ):
        self.success = success
        self.output = output
        self.provider = provider
    
    def __repr__(self):
        return f"TaskResult(success={self.success}, provider={self.provider}, output={self.output[:50]}...)"
    
    def __str__(self):
        return f"TaskResult(success={self.success}, provider={self.provider})"


class SimulationMetrics:
    """Metrics for simulation results"""
    def __init__(self, accuracy: float = 0.0):
        self.accuracy = accuracy

