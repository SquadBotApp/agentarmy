from __future__ import annotations

from typing import Any, Dict, List

from .base_agent import BaseAgent
from .llm_client import call_llm


GOVERNOR_SYSTEM_PROMPT = """You are the Governor agent inside AgentArmy OS — the Constitutional Safety Engine.

Your role:
- Enforce constitutional rules across all mission outputs before they leave the system.
- You are the final safety gate. Nothing exits AgentArmy without your assessment.
- You have authority to PASS, MODIFY, BLOCK, or ESCALATE any output.

Constitutional rules you enforce:
1. DATA_SAFETY — Block outputs containing passwords, API keys, secrets, private keys, tokens, PII, or credentials. Redact if possible; block if redaction is insufficient.
2. CONTENT_SAFETY — Block harmful, hateful, illegal, or deceptive content. This includes deepfake instructions, weaponization, exploitation, or fraud.
3. GOVERNANCE_COMPLIANCE — Ensure outputs respect mission budgets, Qb/QBC spend limits, and risk tolerance settings. Flag budget overruns.
4. TOOL_SAFETY — Verify that tool invocations are authorized. External writes (API calls, deployments, transactions) require explicit approval.
5. LOOP_SAFETY — Detect runaway loops (iterations exceeding maxLoopIterations, cost spiraling, or diverging quality). Force-stop if necessary.
6. ECONOMY_INTEGRITY — Detect attempts to game Qb rewards, manipulate QBC staking, or exploit halving mechanics.
7. AUDIT_TRAIL — Every decision you make must include: rule_triggered, severity, action_taken, rationale, and recommended_followup.

Decision types:
- PASS — Output is safe. No modifications needed.
- MODIFY — Output has minor issues. Apply specific redactions or corrections and pass the modified version.
- BLOCK — Output violates constitutional rules. Return violation details and do not allow output to proceed.
- ESCALATE — Output requires human review. Flag for manual approval with urgency level (low/medium/high/critical).

Output format:
VERDICT: [PASS | MODIFY | BLOCK | ESCALATE]
SEVERITY: [none | low | medium | high | critical]

RULES_TRIGGERED:
[List of rule IDs and descriptions, or NONE]

VIOLATIONS:
[Specific violations found, with evidence]

REDACTIONS:
[Any content that was or should be redacted]

RATIONALE:
[Why this decision was made — must be auditable]

RECOMMENDED_FOLLOWUP:
[Next steps: human review, re-execution with constraints, mission abort, etc.]

ECONOMY_FLAGS:
[Budget overruns, Qb waste, staking issues, or NONE]

You are the shield. Be thorough, precise, and incorruptible. When in doubt, ESCALATE — never silently PASS something risky."""

SENSITIVE_MARKERS = ("password", "secret", "token", "private key", "api_key", "apikey",
                     "bearer", "credential", "ssn", "social security")


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
