"""
Plan Quality Evaluator — assesses Planner agent output quality.

Checks:
1. Step count is reasonable for goal complexity
2. Dependencies form a valid DAG (no orphan refs)
3. Agent assignments are valid types
4. Tool hints are present where expected
5. Budget and governance blocks exist
6. Risk levels are distributed (not all "low")
7. Cyclic refinement steps are included for complex goals
"""

from __future__ import annotations

from typing import Any, Dict, List, Set

from .base_evaluator import BaseEvaluator

_VALID_AGENT_TYPES = {"executor", "critic", "governor", "synthesizer", "planner"}
_VALID_RISK_LEVELS = {"low", "medium", "high"}


class PlanQualityEvaluator(BaseEvaluator):
    """Evaluate the quality of plans produced by the Planner agent."""

    name = "plan_quality"
    threshold = 0.55

    def __call__(
        self,
        *,
        response: Dict[str, Any],
        task_spec: Dict[str, Any],
        ground_truth: Dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        output = response.get("output", response)
        if isinstance(output, str):
            parsed = self._safe_json_parse(output)
            output = parsed if parsed is not None else {}

        # Handle planner wrapping: output may be {"status":"success","plan":{...}}
        plan = output.get("plan", output)
        if isinstance(plan, str):
            parsed = self._safe_json_parse(plan)
            plan = parsed if parsed is not None else {}

        steps: List[Dict[str, Any]] = plan.get("steps", [])
        if not isinstance(steps, list):
            return self._build_result(
                score=0.0,
                details={"error": "No steps array in plan output"},
            )

        n_steps = len(steps)
        checks: Dict[str, Any] = {}

        # 1) Step count reasonableness (3-20 for typical goals)
        if n_steps == 0:
            checks["step_count_ok"] = False
            step_score = 0.0
        elif 2 <= n_steps <= 25:
            checks["step_count_ok"] = True
            step_score = 1.0
        else:
            checks["step_count_ok"] = False
            step_score = 0.5
        checks["step_count"] = n_steps

        # 2) Dependency DAG validity
        step_ids: Set[str] = {s.get("id", "") for s in steps if s.get("id")}
        orphan_deps: List[str] = []
        for s in steps:
            for dep in (s.get("depends_on") or []):
                if dep not in step_ids:
                    orphan_deps.append(dep)
        dag_score = 1.0 if not orphan_deps else max(0.0, 1.0 - len(orphan_deps) * 0.2)
        checks["orphan_dependencies"] = orphan_deps
        checks["dag_valid"] = len(orphan_deps) == 0

        # 3) Agent type validity
        invalid_agents: List[str] = []
        for s in steps:
            at = s.get("agent_type", "")
            if at and at not in _VALID_AGENT_TYPES:
                invalid_agents.append(at)
        agent_score = 1.0 if not invalid_agents else max(0.0, 1.0 - len(invalid_agents) * 0.2)
        checks["invalid_agent_types"] = invalid_agents

        # 4) Tool hints coverage
        steps_with_tools = sum(1 for s in steps if s.get("tool_hints"))
        tool_ratio = steps_with_tools / max(n_steps, 1)
        checks["tool_hints_ratio"] = round(tool_ratio, 3)

        # 5) Budget & governance blocks
        has_budget = "budget" in plan and isinstance(plan["budget"], dict)
        has_governance = "governance" in plan and isinstance(plan["governance"], dict)
        checks["has_budget"] = has_budget
        checks["has_governance"] = has_governance
        meta_score = (0.5 if has_budget else 0.0) + (0.5 if has_governance else 0.0)

        # 6) Risk level distribution
        risk_levels = [s.get("risk_level", "") for s in steps if s.get("risk_level")]
        unique_risks = set(risk_levels)
        risk_diversity = len(unique_risks.intersection(_VALID_RISK_LEVELS)) / len(_VALID_RISK_LEVELS)
        checks["risk_diversity"] = round(risk_diversity, 3)
        checks["risk_distribution"] = {r: risk_levels.count(r) for r in _VALID_RISK_LEVELS}

        # 7) Includes critic/synthesizer steps
        agent_types_used = {s.get("agent_type") for s in steps}
        has_critic_step = "critic" in agent_types_used
        has_synthesizer_step = "synthesizer" in agent_types_used
        checks["has_critic_step"] = has_critic_step
        checks["has_synthesizer_step"] = has_synthesizer_step
        workflow_score = (0.5 if has_critic_step else 0.0) + (0.5 if has_synthesizer_step else 0.0)

        # Composite score
        score = (
            step_score * 0.15
            + dag_score * 0.20
            + agent_score * 0.15
            + tool_ratio * 0.10
            + meta_score * 0.15
            + risk_diversity * 0.10
            + workflow_score * 0.15
        )

        return self._build_result(
            score=min(1.0, score),
            details=checks,
        )
