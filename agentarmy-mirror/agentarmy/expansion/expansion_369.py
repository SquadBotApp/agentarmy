"""
3-6-9 Expansion Module for AgentArmyOS
Implements recursive, combinatorial, and exponential task/agent expansion patterns.
"""

from typing import List, Dict, Any

class Expansion369:
    def __init__(self):
        # No initialization needed; placeholder for future config
        pass

    def expand(self, seed_tasks: List[Dict[str, Any]], depth: int = 1) -> List[Dict[str, Any]]:
        """
        Expands a list of seed tasks using the 3-6-9 pattern:
        - Each task at depth d spawns 3 new tasks at d+1 (up to 3 levels deep)
        - At depth 2, each of those 3 spawns 2 more (total 6)
        - At depth 3, each of those 6 spawns 1.5 more (rounded up, total 9)
        """
        if depth > 3:
            return seed_tasks
        if depth == 1:
            expanded = self._expand_3(seed_tasks)
        elif depth == 2:
            expanded = self._expand_6(seed_tasks)
        elif depth == 3:
            expanded = self._expand_9(seed_tasks)
        else:
            expanded = seed_tasks
        return self.expand(expanded, depth + 1)

    def _expand_3(self, tasks):
        expanded = []
        for t in tasks:
            for i in range(3):
                new_task = t.copy()
                new_task['id'] = f"{t.get('id','seed')}_3_{i+1}"
                new_task['prompt'] = f"[3-6-9/3] {t.get('prompt','')} (branch {i+1})"
                expanded.append(new_task)
        return expanded

    def _expand_6(self, tasks):
        expanded = []
        for t in tasks:
            for i in range(2):
                new_task = t.copy()
                new_task['id'] = f"{t.get('id','seed')}_6_{i+1}"
                new_task['prompt'] = f"[3-6-9/6] {t.get('prompt','')} (branch {i+1})"
                expanded.append(new_task)
        return expanded

    def _expand_9(self, tasks):
        expanded = []
        for t in tasks:
            for i in range(3):
                new_task = t.copy()
                new_task['id'] = f"{t.get('id','seed')}_9_{i+1}"
                new_task['prompt'] = f"[3-6-9/9] {t.get('prompt','')} (branch {i+1})"
                expanded.append(new_task)
        return expanded
