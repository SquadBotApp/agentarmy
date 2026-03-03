from __future__ import annotations

from typing import Any, Dict

from .base import BaseFrameworkAdapter


class FrabricAdapter(BaseFrameworkAdapter):
    """
    Frabric framework adapter.

    Designed as a policy-aware orchestration fabric for multi-agent pipelines.
    Uses the same native execute surface, while enriching output metadata.
    """

    framework_name = "frabric"
    dependency_name = "fabric"
    coordination_mode = "policy_fabric"

    async def run(
        self,
        role: str,
        task_spec: Dict[str, Any],
        context: Dict[str, Any],
        native_execute,
    ) -> Dict[str, Any]:
        result = await super().run(role, task_spec, context, native_execute)
        if not isinstance(result, dict):
            result = {"status": "completed", "output": result}

        fabric_meta = {
            "stages": ["intake", "policy_gate", "execution", "verification"],
            "governance_enabled": bool((context or {}).get("governor_hook")),
            "approval_required": bool(task_spec.get("requires_approval", False)),
        }
        existing = result.get("framework")
        if isinstance(existing, dict):
            merged = dict(existing)
            merged["fabric_meta"] = fabric_meta
            result["framework"] = merged
        else:
            result["framework"] = {"framework": self.framework_name, "fabric_meta": fabric_meta}
        return result
