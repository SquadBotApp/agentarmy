"""Planner module - generates plans from input"""
class Planner:
    def plan(self, input_data):
        if isinstance(input_data, str):
            return [{"id": "task_1", "prompt": input_data}]
        return input_data or []

