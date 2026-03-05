


class RecursiveEngine:
    def __init__(self, provider_router, max_depth: int = 5):
        self.provider_router = provider_router
        self.max_depth = max_depth

    def run(self, task, context=None, depth=0):
        if context is None:
            context = {}
        if depth > self.max_depth:
            return {"error": f"Max recursion depth {self.max_depth} reached", "task": task}
        # Call provider for this task
        response = self.provider_router.choose_and_call(task, context)
        # If the response output contains a special RECURSE marker, recurse
        if isinstance(response, dict) and response.get("RECURSE"):
            new_task = response["RECURSE"]
            return self.run(new_task, context, depth + 1)
        return response


    def mobius_loop(self, tasks, context=None, cycles=2):
        if context is None:
            context = {}
        current_tasks = tasks
        all_results = []
        for _ in range(cycles):
            plan = self.strategy_phase(current_tasks)
            results = [self.run(t, context) for t in plan]
            all_results.extend(results)
            # Optionally, update tasks for next cycle based on results
            current_tasks = [r["task"] for r in results if isinstance(r, dict) and r.get("error")]
            if not current_tasks:
                break
        return all_results

    def strategy_phase(self, tasks):
        # Placeholder: return tasks as-is. Real version could generate/expand tasks.
        return tasks
