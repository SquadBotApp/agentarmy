from __future__ import annotations

import re
from typing import Any, Dict, List

from .base_agent import BaseAgent
from .llm_client import call_llm
from .prompts import get_agent_prompt, SENSITIVE_MARKERS


GOVERNOR_SYSTEM_PROMPT = get_agent_prompt("governor")


class GovernorAgent(BaseAgent):
    def _get_llm_assessment(self, output_text, violations, iteration, qb_spent, qb_budget):
        try:
            return call_llm(
                [
                    {"role": "system", "content": GOVERNOR_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"Assess this output for constitutional compliance:\n\n"
                            f"{output_text or '<empty output>'}\n\n"
                            f"Pre-scan violations: {violations or 'NONE'}\n"
                            f"Iteration: {iteration}\n"
                            f"Qb spent/budget: {qb_spent}/{qb_budget}"
                        ),
                    },
                ]
            )
        except Exception as err:
            return f"[governor-llm-fallback] {err}"

    def _parse_llm_verdict(self, llm_assessment):
        verdict = "PASS"
        explicit_verdict = False
        severity = "none"
        for line in llm_assessment.splitlines():
            normalized = line.strip()
            upper = normalized.upper()
            if upper.startswith("VERDICT:"):
                candidate = normalized.split(":", 1)[1].strip().upper().split()
                if candidate and candidate[0] in {"PASS", "MODIFY", "BLOCK", "ESCALATE"}:
                    verdict = candidate[0]
                    explicit_verdict = True
            elif upper.startswith("SEVERITY:"):
                severity = normalized.split(":", 1)[1].strip().lower().split()[0] if ":" in normalized else "none"

        if not explicit_verdict:
            upper_assessment = llm_assessment.upper()
            if "ESCALATE" in upper_assessment:
                verdict = "ESCALATE"
            elif "BLOCK" in upper_assessment:
                verdict = "BLOCK"
        return verdict, explicit_verdict, severity

    def __init__(self) -> None:
        super().__init__(agent_id="governor", name="Governor", role="governor")

    @staticmethod
    def _collect_violations(task_spec: Dict[str, Any], context: Dict[str, Any]) -> List[str]:
        output_text = str(context.get("execution_output", "") or context.get("agent_output", ""))
        lowered = output_text.lower()
        violations: List[str] = []
        violations.extend(GovernorAgent._check_data_safety(lowered))
        violations.extend(GovernorAgent._check_tool_safety(lowered))
        violations.extend(GovernorAgent._check_loop_safety(context))
        violations.extend(GovernorAgent._check_budget(context))
        violations.extend(GovernorAgent._check_education_safety(context))
        violations.extend(GovernorAgent._check_external_comms(task_spec, context))
        return violations

    @staticmethod
    def _check_data_safety(lowered: str) -> List[str]:
        return [f"Sensitive marker detected: {marker}" for marker in SENSITIVE_MARKERS if marker in lowered]

    @staticmethod
    def _check_tool_safety(lowered: str) -> List[str]:
        destructive_patterns = [r"\bdrop\s+table\b", r"\brm\s+-rf\b", r"\btruncate\s+table\b", r"\bdelete\s+from\b"]

        found = next((pattern for pattern in destructive_patterns if re.search(pattern, lowered)), None)
        if found:
            return ["TOOL_SAFETY: Destructive operation detected without explicit approval"]
        return []


    @staticmethod
    def _check_loop_safety(context: Dict[str, Any]) -> List[str]:
        iteration = int(context.get("iteration", 0) or 0)
        max_iterations = int(context.get("max_iterations", 20) or 20)
        if iteration > max_iterations:
            return [f"LOOP_SAFETY: Iteration {iteration} exceeds max {max_iterations}"]
        return []


    @staticmethod
    def _check_budget(context: Dict[str, Any]) -> List[str]:
        qb_spent = float(context.get("qb_spent", 0) or 0)
        qb_budget = float(context.get("qb_budget", 0) or 0)
        if qb_budget and qb_spent > qb_budget:
            return [f"GOVERNANCE_COMPLIANCE: Qb spent ({qb_spent}) exceeds budget ({qb_budget})"]
        return []


    @staticmethod
    def _check_education_safety(context: Dict[str, Any]) -> List[str]:
        edu = context.get("education", {}) if isinstance(context.get("education", {}), dict) else {}
        learner_age = int(edu.get("learner_age", 0) or 0)
        topic = str(edu.get("topic", "")).lower()
        mature_markers = ("sexual", "gambling", "substance", "violence")
        if learner_age and learner_age < 18 and any(m in topic for m in mature_markers):
            approved = bool(edu.get("approval_granted", False))
            if not approved:
                return ["EDUCATION_SAFETY: Mature topic for minor requires parent/teacher approval"]
        return []


    @staticmethod
    def _check_external_comms(task_spec: Dict[str, Any], context: Dict[str, Any]) -> List[str]:
        if bool(task_spec.get("requires_approval", False)) and not bool(context.get("approval_granted", False)):
            return ["GOVERNANCE_COMPLIANCE: Operation requires approval but none was provided"]
        return []

    async def execute(self, task_spec: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        output_text = str(context.get("execution_output", "") or context.get("agent_output", ""))
        violations = self._collect_violations(task_spec, context)
        iteration = context.get("iteration", 0)
        qb_spent = context.get("qb_spent", 0)
        qb_budget = context.get("qb_budget", 0)

        llm_assessment = self._get_llm_assessment(output_text, violations, iteration, qb_spent, qb_budget)
        verdict, _, severity = self._parse_llm_verdict(llm_assessment)

        blocked = bool(violations) or verdict in {"BLOCK", "ESCALATE"}
        escalated = verdict == "ESCALATE" or severity in {"high", "critical"}

        return {
            "content": llm_assessment,
            "blocked": blocked,
            "escalated": escalated,
            "violations": violations,
            "quality": 0.2 if blocked else 0.82,
            "verdict": "BLOCK" if bool(violations) and verdict in {"PASS", "MODIFY"} else verdict,
            "severity": severity,
            "artifacts": [],
        }
