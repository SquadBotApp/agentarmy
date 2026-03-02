from __future__ import annotations

import time
from abc import ABC, abstractmethod
from typing import Any, Dict

from agents.base_agent import BaseAgent


class AgentExecutor(ABC):
    """Execute decisions returned by orchestrator."""

    @abstractmethod
    async def execute(self, task_id: str, agent_id: str, task_spec: Dict[str, Any], context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        raise NotImplementedError


class RegistryAgentExecutor(AgentExecutor):
    def __init__(self, agent_registry: Dict[str, BaseAgent]):
        self._agent_registry = agent_registry

    def _load_agent(self, agent_id: str) -> BaseAgent:
        if agent_id not in self._agent_registry:
            raise ValueError(f"Unknown agent_id '{agent_id}'")
        return self._agent_registry[agent_id]

    async def execute(self, task_id: str, agent_id: str, task_spec: Dict[str, Any], context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        started = time.perf_counter()
        context = context or {}
        try:
            agent = self._load_agent(agent_id)
            output = await agent.execute(task_spec=task_spec, context=context)
            content = str(output.get("content", ""))
            latency_ms = (time.perf_counter() - started) * 1000.0
            return {
                "task_id": task_id,
                "agent_id": agent_id,
                "status": "completed",
                "output": output,
                "metrics": {
                    "latency_ms": round(latency_ms, 2),
                    "tokens_estimate": max(1, len(content) // 4),
                },
            }
        except Exception as exc:
            latency_ms = (time.perf_counter() - started) * 1000.0
            return {
                "task_id": task_id,
                "agent_id": agent_id,
                "status": "failed",
                "output": {"content": "", "error": str(exc)},
                "metrics": {
                    "latency_ms": round(latency_ms, 2),
                    "tokens_estimate": 0,
                },
            }
