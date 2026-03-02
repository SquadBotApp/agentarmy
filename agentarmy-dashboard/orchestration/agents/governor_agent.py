from __future__ import annotations

from typing import Any, Dict, List

from .base_agent import BaseAgent
from .llm_client import call_llm


class GovernorAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(agent_id="governor", name="Governor", role="governor")

    async def execute(self, task_spec: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        output_text = context.get("execution_output", "")
        lowered = output_text.lower()
        violations: List[str] = [
            f"Potential sensitive data exposure: '{marker}'"
            for marker in ("password", "secret", "token", "private key")
            if marker in lowered
        ]

        llm_assessment = call_llm(
            [
                {
                    "role": "system",
                    "content": "You are a governance auditor. Return PASS or BLOCK, then concise policy rationale.",
                },
                {
                    "role": "user",
                    "content": "Assess this output for policy and safety risks:\n\n" + (output_text or "<empty output>"),
                },
            ]
        )

        blocked = bool(violations)
        return {
            "content": llm_assessment,
            "blocked": blocked,
            "violations": violations,
            "quality": 0.82,
            "artifacts": [],
        }
