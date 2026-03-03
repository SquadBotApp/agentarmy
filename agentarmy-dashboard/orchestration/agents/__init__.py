"""Concrete agent implementations for Phase 2 execution."""

from .planner_agent import PlannerAgent
from .executor_agent import ExecutorAgent
from .critic_agent import CriticAgent
from .governor_agent import GovernorAgent
from .synthesizer_agent import SynthesizerAgent
from .prompts import get_agent_prompt, get_agent_model, ZPE_WEIGHTS, SENSITIVE_MARKERS, MODEL_CONFIG

# Optional agents may depend on in-progress modules; keep core imports stable.
try:
    from .enterprise_agent import EnterpriseAgent
except ImportError:  # pragma: no cover - optional surface
    EnterpriseAgent = None

try:
    from .antigravity_agent import AntigravityAgent
except ImportError:  # pragma: no cover - optional surface
    AntigravityAgent = None

__all__ = [
    "PlannerAgent",
    "ExecutorAgent",
    "CriticAgent",
    "GovernorAgent",
    "SynthesizerAgent",
    "get_agent_prompt",
    "get_agent_model",
    "ZPE_WEIGHTS",
    "SENSITIVE_MARKERS",
    "MODEL_CONFIG",
]

if EnterpriseAgent is not None:
    __all__.append("EnterpriseAgent")
if AntigravityAgent is not None:
    __all__.append("AntigravityAgent")
