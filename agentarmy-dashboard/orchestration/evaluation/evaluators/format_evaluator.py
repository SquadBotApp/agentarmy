"""
Format Evaluator — validates agent output JSON structure compliance.

Checks that agent outputs conform to their expected schema:
- Planner: mission_id, goal, steps[], budget, governance
- Executor: task_id, status, output{}, metrics{}, diagnostics{}
- Critic: evaluation_id, target_id, zpe_score{}, issues[], verdict
- Governor: VERDICT, SEVERITY, RULES_TRIGGERED, etc.
- Synthesizer: synthesis_id, mission_id, status, deliverable{}, summary{}, metrics{}
"""

from __future__ import annotations

from typing import Any, Dict, List, Set

from .base_evaluator import BaseEvaluator


# Expected top-level keys per agent type
_SCHEMAS: Dict[str, Dict[str, Any]] = {
    "planner": {
        "required": {"mission_id", "goal", "steps"},
        "optional": {"budget", "governance"},
        "steps_required": {"id", "name", "description", "agent_type"},
    },
    "executor": {
        "required": {"task_id", "status", "output"},
        "optional": {"metrics", "diagnostics"},
        "status_values": {"completed", "failed", "blocked"},
    },
    "critic": {
        "required": {"zpe_score", "verdict"},
        "optional": {"evaluation_id", "target_id", "issues", "improvements", "rationale"},
        "verdict_values": {"accept", "revise", "reject"},
        "zpe_required": {"total", "components"},
    },
    "governor": {
        # Governor returns structured text or dict — check key fields
        "required": {"content"},
        "optional": {"blocked", "escalated", "violations", "quality"},
    },
    "synthesizer": {
        "required": {"synthesis_id", "status", "deliverable"},
        "optional": {"mission_id", "summary", "metrics", "provenance"},
    },
}


class FormatEvaluator(BaseEvaluator):
    """Evaluate whether an agent's output conforms to expected JSON schema."""

    name = "format_compliance"
    threshold = 0.7  # 70% of required fields present = pass

    def __call__(
        self,
        *,
        response: Dict[str, Any],
        task_spec: Dict[str, Any],
        ground_truth: Dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        agent_type = kwargs.get("agent_type") or task_spec.get("agent_type", "executor")
        schema = _SCHEMAS.get(agent_type, _SCHEMAS["executor"])
        required: Set[str] = schema.get("required", set())

        # Extract the output payload — agents may wrap in {"status": ..., "output": ...}
        # or the response itself may BE the structured output (e.g., executor mock data).
        # Check multiple candidate layers and pick the one with the best field coverage.
        candidates = [response]
        inner_output = response.get("output")
        if isinstance(inner_output, dict):
            candidates.append(inner_output)
        elif isinstance(inner_output, str):
            parsed = self._safe_json_parse(inner_output)
            if parsed:
                candidates.append(parsed)

        # Also check nested plan wrapper (planner: output.plan)
        if isinstance(inner_output, dict) and "plan" in inner_output:
            candidates.append(inner_output["plan"])

        # Pick the candidate with the most required-field hits
        best_output: dict = {}
        best_hits = -1
        for cand in candidates:
            if not isinstance(cand, dict):
                continue
            hits = len(required.intersection(cand.keys()))
            if hits > best_hits:
                best_hits = hits
                best_output = cand
        output = best_output

        found_required: Set[str] = set()
        missing: List[str] = []
        extra_checks: Dict[str, Any] = {}

        for key in required:
            if key in output:
                found_required.add(key)
            else:
                missing.append(key)

        base_score = len(found_required) / max(len(required), 1)

        # Agent-specific deep checks
        bonus = 0.0

        if agent_type == "planner":
            steps = output.get("steps", [])
            if isinstance(steps, list) and steps:
                step_fields = schema.get("steps_required", set())
                compliant_steps = sum(
                    1 for s in steps
                    if isinstance(s, dict) and step_fields.issubset(s.keys())
                )
                step_ratio = compliant_steps / len(steps)
                extra_checks["steps_schema_ratio"] = round(step_ratio, 3)
                bonus += step_ratio * 0.15
            else:
                extra_checks["steps_schema_ratio"] = 0.0

        elif agent_type == "critic":
            zpe = output.get("zpe_score", {})
            if isinstance(zpe, dict):
                zpe_req = schema.get("zpe_required", set())
                zpe_found = zpe_req.intersection(zpe.keys())
                extra_checks["zpe_fields_present"] = sorted(zpe_found)
                if zpe_req == zpe_found:
                    bonus += 0.1
            verdict = output.get("verdict", "")
            valid_verdicts = schema.get("verdict_values", set())
            if verdict in valid_verdicts:
                extra_checks["verdict_valid"] = True
                bonus += 0.05
            else:
                extra_checks["verdict_valid"] = False

        elif agent_type == "executor":
            status = output.get("status", "")
            valid_statuses = schema.get("status_values", set())
            extra_checks["status_valid"] = status in valid_statuses
            if status in valid_statuses:
                bonus += 0.05

        score = min(1.0, base_score + bonus)

        return self._build_result(
            score=score,
            details={
                "agent_type": agent_type,
                "required_fields": sorted(required),
                "found_fields": sorted(found_required),
                "missing_fields": missing,
                **extra_checks,
            },
        )
