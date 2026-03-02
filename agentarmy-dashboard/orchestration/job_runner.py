from __future__ import annotations

import time
from typing import Any, Dict, List

from executor import AgentExecutor


class JobRunner:
    """Manages job lifecycle: orchestrate → execute → feedback."""

    def __init__(self, orchestrate_fn, executor: AgentExecutor) -> None:
        self._orchestrate = orchestrate_fn
        self._executor = executor

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
        execution = await self._executor.execute(
            task_id=task_id,
            agent_id=agent_id,
            task_spec=task_spec,
            context={"job_goal": (payload.get("job") or {}).get("goal", "")},
        )

        # 3) Evaluate (compare expected vs actual)
        evaluation = self._evaluate(task_spec=task_spec, execution=execution)

        # 4) Learn (stub for Phase 3)
        learn_stub = {"weights_updated": False, "reason": "Phase 3: Persistence & Learning"}

        # 5) Persist (stub for Phase 3)
        persist_stub = {"stored": False, "reason": "Phase 3: Persistence backend pending"}

        workflow_latency_ms = round((time.perf_counter() - started) * 1000.0, 2)

        return {
            "decision": decision,
            "execution": execution,
            "evaluation": evaluation,
            "learning": learn_stub,
            "persistence": persist_stub,
            "metrics": {
                "workflow_latency_ms": workflow_latency_ms,
                "execution_cost_estimate": self._estimate_cost(execution),
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
        tokens = float(metrics.get("tokens_estimate", 0))
        # Very rough placeholder for Phase 2; real per-provider cost model comes in Phase 3.
        return round((tokens / 1000.0) * 0.002, 6)
