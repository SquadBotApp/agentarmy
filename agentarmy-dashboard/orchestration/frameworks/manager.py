from __future__ import annotations

from typing import Dict, Type

from .autogen_adapter import AutoGenAdapter
from .base import BaseFrameworkAdapter
from .crewai_adapter import CrewAIAdapter
from .langgraph_adapter import LangGraphAdapter
from .smolagents_adapter import SmolAgentsAdapter


SUPPORTED_FRAMEWORKS = {"native", "crewai", "langgraph", "smolagents", "autogen"}

_REGISTRY: Dict[str, Type[BaseFrameworkAdapter]] = {
    "crewai": CrewAIAdapter,
    "langgraph": LangGraphAdapter,
    "smolagents": SmolAgentsAdapter,
    "autogen": AutoGenAdapter,
}


def normalize_framework_name(name: str | None) -> str:
    candidate = (name or "native").strip().lower()
    return candidate if candidate in SUPPORTED_FRAMEWORKS else "native"


def get_framework_adapter(name: str | None) -> BaseFrameworkAdapter:
    normalized = normalize_framework_name(name)
    cls = _REGISTRY.get(normalized, BaseFrameworkAdapter)
    return cls()
