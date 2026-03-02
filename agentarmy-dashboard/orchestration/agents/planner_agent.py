from __future__ import annotations

from typing import Any, Dict

from .base_agent import BaseAgent
from .llm_client import call_llm


class PlannerAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(agent_id="planner", name="Planner", role="planner")

    async def execute(self, task_spec: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        goal = task_spec.get("description") or task_spec.get("name") or "Plan this task"
        content = call_llm(
            [
                {"role": "system", "content": "You are a strategic planner. Return concise numbered steps."},
                {"role": "user", "content": f"Break this goal into practical execution steps:\n\n{goal}"},
            ]
        )
        steps = [line.strip() for line in content.splitlines() if line.strip()]
        return {
            "content": content,
            "plan_steps": steps,
            "quality": 0.8,
            "artifacts": [],
        }
