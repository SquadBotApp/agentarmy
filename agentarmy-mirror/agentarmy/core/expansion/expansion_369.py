"""Expansion 3-6-9 module - implements 3-6-9 expansion logic"""
class Expansion369:
    def expand(self, tasks):
        """Expand tasks using 3-6-9 pattern"""
        if not tasks:
            return []
        
        expanded = []
        for task in tasks:
            expanded.append(task)
            # Add subtasks based on 3-6-9 pattern
            if isinstance(task, dict):
                expanded.append({**task, "subtask": True})
        
        return expanded

