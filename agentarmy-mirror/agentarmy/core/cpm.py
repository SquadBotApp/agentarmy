from typing import List, Any

class CPMEngine:
    def analyze(self, tasks: List[Any]) -> List[dict]:
        """Analyze tasks for critical path, float, and dependencies.
        Returns a list of dicts: [{task, duration, dependencies, critical, float}]
        """
        if not tasks:
            return []

        # Handle both list of strings and list of dicts for robustness
        is_structured = isinstance(tasks[0], dict)

        analyzed = []
        for t in tasks:
            if is_structured:
                task_name = t.get('name', 'unknown_task')
                dependencies = t.get('dependencies', [])
            else: # It's a list of strings
                task_name = str(t)
                dependencies = [] # Assume no dependencies for simple tasks

            analyzed.append({
                'task': task_name,
                'duration': t.get('duration', 1) if is_structured else 1,
                'dependencies': dependencies,
                'critical': not dependencies, # Simple critical path logic
                'float': 0 if not dependencies else 1
            })
        return analyzed
