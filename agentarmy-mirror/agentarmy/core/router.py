"""Router module - routes tasks to agents"""
class Router:
    def route(self, plan):
        return [{"task": t, "agent": "default"} for t in plan]

