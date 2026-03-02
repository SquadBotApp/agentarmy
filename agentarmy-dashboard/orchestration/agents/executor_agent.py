from __future__ import annotations

from typing import Any, Dict

from .base_agent import BaseAgent
from .llm_client import call_llm


class ExecutorAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(agent_id="executor", name="Executor", role="executor")

    async def execute(self, task_spec: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        description = task_spec.get("description") or task_spec.get("name") or "Execute task"
        content = call_llm(
            [
                {"role": "system", "content": "You are an execution specialist. Produce actionable output."},
                {"role": "user", "content": f"Execute this task and return a practical result:\n\n{description}"},
            ]
        )
        return {
            "content": content,
            "quality": 0.75,
            "artifacts": [],
        }
