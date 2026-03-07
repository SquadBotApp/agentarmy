from .models import TaskResult, SimulationMetrics

try:
    from .types import TaskResult as TaskResultTypes
except ImportError:
    TaskResultTypes = None
