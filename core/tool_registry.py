
"""
Tool Registry for AgentArmyOS
Blueprint: Tracks tools, cost/profit/latency scoring, and selection.
"""
from typing import List, Dict, Any

class ToolRegistry:
    def __init__(self):
        self.tools: List[Dict[str, Any]] = []
        # Register default tools
        self.register({"name": "web_search", "score": 0.9, "cost": 0.01})
        self.register({"name": "calculator", "score": 0.95, "cost": 0.0})

    def register(self, tool: Dict[str, Any]):
        self.tools.append(tool)

    def get_tools(self, criteria=None) -> List[Dict[str, Any]]:
        # Placeholder: return all tools, filter by criteria if provided
        if not criteria:
            return self.tools
        return [t for t in self.tools if all(t.get(k) == v for k, v in criteria.items())]

    def best_tool(self, metric: str = 'score') -> Dict[str, Any]:
        if not self.tools:
            return {}
        return max(self.tools, key=lambda t: t.get(metric, 0))
