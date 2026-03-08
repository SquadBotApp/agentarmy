"""
Unified data models for AgentArmy
This is the single source of truth for all core data structures
"""
from typing import Any, Dict, Optional, List
from enum import Enum


class SimulationMetrics:
    """Metrics for simulation results"""
    def __init__(self, accuracy: float = 0.0):
        self.accuracy = accuracy


class TaskStatus(Enum):
    """Status of a task"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskResult:
    """
    Unified TaskResult model supporting both Option A and Option B architectures.
    Can represent task results from either the old or new system.
    """
    def __init__(
        self,
        status: str = None,
        # Required fields
        task_name: Optional[str] = None,
        success: Optional[bool] = None,
        output: Optional[str] = None,
        error: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        metrics: Optional[SimulationMetrics] = None,
        provider: Optional[str] = None,
        simulation_id: Optional[str] = None,
        cost_usd: Optional[float] = None,
        provider_name: Optional[str] = None,
        error_message: Optional[str] = None,
    ):
        self.status = status
        self.task_name = task_name
        self.success = success
        self.output = output
        self.error = error
        self.metadata = metadata or {}
        self.metrics = metrics
        self.provider = provider
        self.simulation_id = simulation_id
        self.cost_usd = cost_usd
        self.provider_name = provider_name
        self.error_message = error_message
        
        # Normalize status field
        if self.status in ["success", "completed"]:
            self.success = True
        elif self.status == "failed":
            self.success = False
    
    @property
    def is_success(self) -> bool:
        """Check if task was successful"""
        if self.success is not None:
            return self.success
        return self.status in ["success", "completed"]
    
    @property
    def is_failed(self) -> bool:
        """Check if task failed"""
        return not self.is_success


class ProviderResponse:
    """Response from a provider"""
    def __init__(
        self,
        status: str,
        data: Any = None,
        provider_name: Optional[str] = None,
        cost: Optional[float] = None,
        latency_ms: Optional[float] = None,
        error: Optional[str] = None,
    ):
        self.status = status
        self.data = data
        self.provider_name = provider_name
        self.cost = cost
        self.latency_ms = latency_ms
        self.error = error


class Task:
    """A task to be executed"""
    def __init__(
        self,
        name: str,
        description: str = "",
        provider: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
        status: str = "pending",
        result: Optional[TaskResult] = None,
    ):
        self.name = name
        self.description = description
        self.provider = provider
        self.parameters = parameters or {}
        self.status = status
        self.result = result


class Agent:
    """An agent in the system"""
    def __init__(
        self,
        name: str,
        role: str = "assistant",
        capabilities: Optional[List[str]] = None,
        active: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.name = name
        self.role = role
        self.capabilities = capabilities or []
        self.active = active
        self.metadata = metadata or {}
