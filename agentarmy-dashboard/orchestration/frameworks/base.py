from __future__ import annotations

import importlib
import inspect
from typing import Any, Awaitable, Callable, Dict


NativeExecuteFn = Callable[[Dict[str, Any]], Any]


async def _maybe_await(value: Any) -> Any:
    if inspect.isawaitable(value):
        return await value
    return value


class BaseFrameworkAdapter:
    framework_name = "native"
    dependency_name = ""
    coordination_mode = "native"

    def is_available(self) -> bool:
        if not self.dependency_name:
            return True
        try:
            importlib.import_module(self.dependency_name)
            return True
        except Exception:
            return False

    async def run(
        self,
        role: str,
        task_spec: Dict[str, Any],
        context: Dict[str, Any],
        native_execute: NativeExecuteFn,
    ) -> Dict[str, Any]:
        result = await _maybe_await(native_execute(task_spec))
        if not isinstance(result, dict):
            result = {"status": "completed", "output": result}

        framework_meta = {
            "framework": self.framework_name,
            "coordination_mode": self.coordination_mode,
            "dependency": self.dependency_name or "builtin",
            "dependency_available": self.is_available(),
            "role": role,
        }
        existing = result.get("framework")
        if isinstance(existing, dict):
            merged = dict(existing)
            merged.update(framework_meta)
            result["framework"] = merged
        else:
            result["framework"] = framework_meta
        return result
