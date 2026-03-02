from __future__ import annotations

from typing import Any, Dict

from .base_agent import BaseAgent
from .llm_client import call_llm


class CriticAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(agent_id="critic", name="Critic", role="critic")

    async def execute(self, task_spec: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        output_text = context.get("execution_output", "")
        prompt = output_text or task_spec.get("description") or task_spec.get("name") or "No content"
        content = call_llm(
            [
                {"role": "system", "content": "You are a strict critic. Return issues and concrete improvements."},
                {"role": "user", "content": f"Critique and improve this output:\n\n{prompt}"},
            ]
        )
        return {
            "content": content,
            "quality": 0.78,
            "artifacts": [],
        }
