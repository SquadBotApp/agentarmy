

import logging
import asyncio

logger = logging.getLogger(__name__)

class RecursiveEngine:
    def __init__(self, provider_router, max_depth: int = 5):
        self.provider_router = provider_router
        self.max_depth = max_depth

    async def run(self, task, context=None, depth=0):
        if context is None:
            context = {}
        if depth > self.max_depth:
            return {"error": f"Max recursion depth {self.max_depth} reached", "task": task}
        logger.info(f"RecursiveEngine: Running task at depth {depth}: {task}")
        # Prepare ProviderRequest if needed
        req = self._to_provider_request(task)
        provider, response = await self.provider_router.choose_and_call(req)
        # Self-improvement hook: update context with result
        self._self_improve(context, response)
        # If the response output contains a special RECURSE marker, recurse
        if hasattr(response, 'raw') and isinstance(response.raw, dict) and response.raw.get("RECURSE"):
            new_task = response.raw["RECURSE"]
            logger.info(f"RecursiveEngine: Recursing on new task: {new_task}")
            return await self.run(new_task, context, depth + 1)
        return response

    async def mobius_loop(self, tasks, context=None, cycles=2):
        if context is None:
            context = {}
        current_tasks = tasks
        all_results = []
        for _ in range(cycles):
            plan = await self.strategy_phase(current_tasks)
            results = [await self.run(t, context) for t in plan]
            all_results.extend(results)
            # Optionally, update tasks for next cycle based on results
            current_tasks = [getattr(r, "task", None) for r in results if hasattr(r, "error")]
            current_tasks = [t for t in current_tasks if t]
            if not current_tasks:
                break
        return all_results

    async def strategy_phase(self, tasks):
        # Placeholder: return tasks as-is. Real version could generate/expand tasks.
        return tasks

    def _to_provider_request(self, task):
        # Convert dict or string task to ProviderRequest
        from core.providers.base import ProviderRequest
        if isinstance(task, dict):
            return ProviderRequest(task_id=task.get("id", "unknown"), prompt=task.get("prompt", str(task)), metadata=task.get("metadata", {}))
        return ProviderRequest(task_id="unknown", prompt=str(task), metadata={})

    def _self_improve(self, context, response):
        # Example: update context with last output, tokens, cost, etc.
        if hasattr(response, 'output'):
            context['last_output'] = response.output
        if hasattr(response, 'tokens_out'):
            context['last_tokens'] = response.tokens_out
        if hasattr(response, 'cost_usd'):
            context['last_cost'] = response.cost_usd
