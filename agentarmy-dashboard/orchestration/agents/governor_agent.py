from __future__ import annotations

from typing import Any, Dict, List

from .base_agent import BaseAgent
from .llm_client import call_llm
from .prompts import get_agent_prompt, SENSITIVE_MARKERS


GOVERNOR_SYSTEM_PROMPT = get_agent_prompt("governor")


class GovernorAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__(agent_id="governor", name="Governor", role="governor")

    async def execute(self, task_spec: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        output_text = context.get("execution_output", "")
        lowered = output_text.lower()

        # Rule 1: DATA_SAFETY — deterministic pre-scan
        violations: List[str] = [
            f"DATA_SAFETY: Potential sensitive data exposure: '{marker}'"
            for marker in SENSITIVE_MARKERS
            if marker in lowered
        ]

        # Rule 5: LOOP_SAFETY — check iteration context
        iteration = context.get("iteration", 0)
        max_iterations = context.get("max_iterations", 20)
        if iteration > max_iterations:
            violations.append(f"LOOP_SAFETY: Iteration {iteration} exceeds max {max_iterations}")

        # Rule 3: GOVERNANCE_COMPLIANCE — check budget
        qb_spent = context.get("qb_spent", 0)
        qb_budget = context.get("qb_budget", 0)
        if qb_budget and qb_spent > qb_budget:
            violations.append(f"GOVERNANCE_COMPLIANCE: Qb spent ({qb_spent}) exceeds budget ({qb_budget})")

        # LLM deep assessment for content safety, nuanced risks
        llm_assessment = call_llm(
            [
                {"role": "system", "content": GOVERNOR_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Assess this output for constitutional compliance:\n\n"
                        f"{output_text or '<empty output>'}\n\n"
                        f"Pre-scan violations: {violations if violations else 'NONE'}\n"
                        f"Iteration: {iteration}\n"
                        f"Qb spent/budget: {qb_spent}/{qb_budget}"
                    ),
                },
            ]
        )

        blocked = bool(violations) or "BLOCK" in llm_assessment.upper()
        escalated = "ESCALATE" in llm_assessment.upper()

        return {
            "content": llm_assessment,
            "blocked": blocked,
            "escalated": escalated,
            "violations": violations,
            "quality": 0.82,
            "artifacts": [],
        }
