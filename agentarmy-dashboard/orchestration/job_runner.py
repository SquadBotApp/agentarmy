from __future__ import annotations

import time
from typing import Any, Dict, List

from executor import AgentExecutor
from integrations import N8NAdapter, PlatformHub


class JobRunner:
    """Manages job lifecycle: orchestrate → execute → feedback."""

    def __init__(
        self,
        orchestrate_fn,
        executor: AgentExecutor,
        n8n: N8NAdapter | None = None,
        platform_hub: PlatformHub | None = None,
    ) -> None:
        self._orchestrate = orchestrate_fn
        self._executor = executor
        self._n8n = n8n or N8NAdapter()
        self._platform_hub = platform_hub or PlatformHub()

    async def run_workflow(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        started = time.perf_counter()

        # 1) Orchestrate (get decision)
        decision = self._orchestrate(payload)

        task_id = decision.get("nextTaskId")
        agent_id = decision.get("nextAgentId")
        if not task_id or not agent_id:
            return {
                "decision": decision,
                "execution": None,
                "evaluation": {"status": "complete", "quality_score": 1.0, "notes": "No runnable tasks remaining."},
                "metrics": {
                    "workflow_latency_ms": round((time.perf_counter() - started) * 1000.0, 2),
                    "execution_cost_estimate": 0.0,
                },
            }

        task_spec = self._resolve_task_spec(payload.get("state", {}), task_id)

        # 2) Execute (run selected agent)
        framework = self._resolve_framework(payload)
        execution = await self._executor.execute(
            task_id=task_id,
            agent_id=agent_id,
            task_spec=task_spec,
            context={"job_goal": (payload.get("job") or {}).get("goal", "")},
            framework=framework,
        )

        # 3) Evaluate (compare expected vs actual)
        evaluation = self._evaluate(task_spec=task_spec, execution=execution)

        # 4) Learn (stub for Phase 3)
        learn_stub = {"weights_updated": False, "reason": "Phase 3: Persistence & Learning"}

        # 5) Persist (stub for Phase 3)
        persist_stub = {"stored": False, "reason": "Phase 3: Persistence backend pending"}

        workflow_latency_ms = round((time.perf_counter() - started) * 1000.0, 2)
        n8n_result = self._trigger_n8n(payload, decision, execution, evaluation)
        platform_results = self._trigger_platforms(payload, decision, execution, evaluation)

        return {
            "decision": decision,
            "execution": execution,
            "evaluation": evaluation,
            "learning": learn_stub,
            "persistence": persist_stub,
            "integrations": {"n8n": n8n_result, "platforms": platform_results},
            "metrics": {
                "workflow_latency_ms": workflow_latency_ms,
                "execution_cost_estimate": self._estimate_cost(execution),
                "framework_used": framework,
            },
        }

    def _resolve_task_spec(self, state: Dict[str, Any], task_id: str) -> Dict[str, Any]:
        tasks: List[Dict[str, Any]] = state.get("tasks", []) or []
        matched_task = next((task for task in tasks if task.get("id") == task_id), None)
        if matched_task:
            return matched_task
        return {
            "id": task_id,
            "name": task_id,
            "description": f"Execute task {task_id}",
            "duration": 1.0,
            "depends_on": [],
        }

    def _evaluate(self, task_spec: Dict[str, Any], execution: Dict[str, Any]) -> Dict[str, Any]:
        status = execution.get("status")
        output = execution.get("output") or {}
        content = str(output.get("content", ""))

        if status != "completed":
            return {
                "status": "failed",
                "quality_score": 0.0,
                "notes": output.get("error", "Execution failed"),
            }

        # Basic heuristic quality: non-empty output weighted by task complexity hint
        complexity_hint = float(task_spec.get("duration", 1.0))
        quality = 0.55 + min(0.35, (len(content) / 800.0)) - min(0.15, complexity_hint / 100.0)
        quality = max(0.0, min(1.0, quality))

        return {
            "status": "completed",
            "quality_score": round(quality, 3),
            "notes": "Execution completed and evaluated.",
        }

    def _estimate_cost(self, execution: Dict[str, Any]) -> float:
        metrics = execution.get("metrics", {}) if execution else {}
        tokens = float(
            metrics.get("tokens_estimate")
            or metrics.get("tokens")
            or metrics.get("tokens_used")
            or 0
        )
        # Very rough placeholder for Phase 2; real per-provider cost model comes in Phase 3.
        return round((tokens / 1000.0) * 0.002, 6)

    def _resolve_framework(self, payload: Dict[str, Any]) -> str:
        framework = payload.get("framework")
        if isinstance(framework, str) and framework.strip():
            return framework.strip().lower()
        execution_cfg = payload.get("execution", {}) or {}
        if isinstance(execution_cfg, dict):
            cfg_framework = execution_cfg.get("framework")
            if isinstance(cfg_framework, str) and cfg_framework.strip():
                return cfg_framework.strip().lower()
        return "native"

    def _trigger_n8n(
        self,
        payload: Dict[str, Any],
        decision: Dict[str, Any],
        execution: Dict[str, Any],
        evaluation: Dict[str, Any],
    ) -> Dict[str, Any]:
        integrations = payload.get("integrations", {}) or {}
        n8n_cfg = integrations.get("n8n", {}) if isinstance(integrations, dict) else {}

        # Payload can explicitly enable/disable n8n regardless of env defaults.
        enabled_override = n8n_cfg.get("enabled")
        enabled = self._n8n.is_enabled() if enabled_override is None else bool(enabled_override)
        if not enabled:
            return {"enabled": False, "status": "skipped", "reason": "n8n disabled"}

        workflow_name = str(n8n_cfg.get("workflow") or "default")

        # Claudebot fast-path for user intent.
        goal = str((payload.get("job") or {}).get("goal", "")).lower()
        if "claudebot" in goal and workflow_name == "default":
            workflow_name = "claudebot"

        event_payload = {
            "job": payload.get("job", {}),
            "decision": decision,
            "execution": execution,
            "evaluation": evaluation,
        }
        return self._n8n.trigger(
            event_type="agentarmy.workflow.completed",
            payload=event_payload,
            workflow=workflow_name,
        )

    def _trigger_platforms(
        self,
        payload: Dict[str, Any],
        decision: Dict[str, Any],
        execution: Dict[str, Any],
        evaluation: Dict[str, Any],
    ) -> Dict[str, Dict[str, Any]]:
        integrations = payload.get("integrations", {}) or {}
        platforms_cfg = integrations.get("platforms", {}) if isinstance(integrations, dict) else {}
        mobile_cfg = integrations.get("mobile", {}) if isinstance(integrations, dict) else {}
        if not isinstance(platforms_cfg, dict):
            platforms_cfg = {}
        if not isinstance(mobile_cfg, dict):
            mobile_cfg = {}

        platform_enabled = bool(platforms_cfg.get("enabled", False))
        mobile_enabled = bool(mobile_cfg.get("enabled", False))
        enabled = platform_enabled or mobile_enabled
        if not enabled:
            return {}

        platform_targets = platforms_cfg.get("targets") or []
        if not isinstance(platform_targets, list):
            platform_targets = []

        mobile_vendors = mobile_cfg.get("vendors") or []
        if not isinstance(mobile_vendors, list):
            mobile_vendors = []
        # Defensive: fallback if resolve_mobile_targets is missing
        mobile_targets = []
        if hasattr(self._platform_hub, "resolve_mobile_targets"):
            mobile_targets = self._platform_hub.resolve_mobile_targets(mobile_vendors)

        targets = platform_targets + mobile_targets
        if not targets and platform_enabled:
            targets = self._platform_hub.default_targets()
        if not targets:
            return {}

        event_payload = {
            "job": payload.get("job", {}),
            "decision": decision,
            "execution": execution,
            "evaluation": evaluation,
            "mobile": {
                "vendors": mobile_vendors,
                "resolved_targets": mobile_targets,
            },
        }
        return self._platform_hub.dispatch(
            event_type="agentarmy.workflow.completed",
            payload=event_payload,
            targets=targets,
        )
