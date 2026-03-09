"""
OPTION B: Core AgentArmy Module
Input → ProviderRouter → Provider → TaskResult

Clean, minimal architecture.
"""

from .models import TaskResult, Task
from .orchestration import Orchestrator
from .providers.router import ProviderRouter, ProviderRequest, ProviderResponse, RoutingStrategy
from .providers.base import OpenAIProvider, ClaudeProvider, MockProvider

__all__ = [
    # Models
    "TaskResult",
    "Task",
    # Orchestrator
    "Orchestrator",
    # Routing
    "ProviderRouter",
    "ProviderRequest",
    "ProviderResponse",
    "RoutingStrategy",
    # Providers
    "OpenAIProvider",
    "ClaudeProvider",
    "MockProvider",
]
