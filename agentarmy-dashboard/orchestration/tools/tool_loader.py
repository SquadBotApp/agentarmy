"""
YAML-backed tool registry loader.

Reads tool_registry.yaml (workspace root) and exposes lightweight
lookup helpers used by Executor and Planner agents at runtime.
No heavy third-party deps — just PyYAML + stdlib.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

ToolEntry = Dict[str, Any]

_REGISTRY_FILENAME = "tool_registry.yaml"

_SEARCH_DIRS = [
    Path(__file__).resolve().parents[3],
    Path(__file__).resolve().parents[2],
    Path(__file__).resolve().parents[1],
    Path.cwd(),
]

_cache: Optional[List[ToolEntry]] = None


def _find_registry() -> Path:
    for d in _SEARCH_DIRS:
        candidate = d / _REGISTRY_FILENAME
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(
        f"{_REGISTRY_FILENAME} not found. Searched: {[str(d) for d in _SEARCH_DIRS]}"
    )


def load_registry(*, force: bool = False) -> List[ToolEntry]:
    global _cache
    if _cache is not None and not force:
        return _cache
    path = _find_registry()
    with open(path, "r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, list):
        raise ValueError(f"Expected a YAML list in {path}, got {type(data).__name__}")
    _cache = data
    return _cache


def get_tool(tool_id: str) -> Optional[ToolEntry]:
    for entry in load_registry():
        if entry.get("id") == tool_id:
            return entry
    return None


def get_tools_by_type(tool_type: str) -> List[ToolEntry]:
    return [t for t in load_registry() if t.get("type") == tool_type]


def get_tools_by_capability(capability: str) -> List[ToolEntry]:
    return [
        t for t in load_registry()
        if capability in (t.get("capabilities") or [])
    ]


def match_tool_hints(hints: List[str]) -> List[ToolEntry]:
    registry = load_registry()
    matched: List[ToolEntry] = []
    for hint in hints:
        for entry in registry:
            if entry.get("id") == hint or hint in (entry.get("capabilities") or []):
                if entry not in matched:
                    matched.append(entry)
    return matched


def registry_summary() -> str:
    lines = []
    for t in load_registry():
        caps = ", ".join(t.get("capabilities", []))
        cost_key = next(
            (k for k in t if k.startswith("cost_per_")), None
        )
        cost = t.get(cost_key, "n/a") if cost_key else "n/a"
        lines.append(
            f"- {t['id']} ({t.get('type','?')}): caps=[{caps}] "
            f"cost={cost} latency≈{t.get('latency_ms_estimate','?')}ms "
            f"reliability={t.get('reliability','?')}"
        )
    return "\n".join(lines)


def tool_available(tool_id: str) -> bool:
    entry = get_tool(tool_id)
    if entry is None:
        return False
    env_var = entry.get("api_env_var", "")
    return bool(os.getenv(env_var, "")) if env_var else True
