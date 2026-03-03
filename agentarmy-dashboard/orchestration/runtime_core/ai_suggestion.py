"""
AI-Powered Tool & Workflow Suggestion for AgentArmyOS
"""
from .tool_marketplace import ToolMarketplace
from .workflow_engine import WorkflowEngine, WorkflowStep

class AISuggestionEngine:
    def __init__(self, tool_marketplace: ToolMarketplace, workflow_engine: WorkflowEngine):
        self.tool_marketplace = tool_marketplace
        self.workflow_engine = workflow_engine

    def suggest_tools(self, description: str):
        # For demo: simple keyword match, can be replaced with LLM
        suggestions = []
        desc = description.lower()
        for tool in self.tool_marketplace.available_tools:
            if tool['name'] in desc or tool['type'] in desc:
                suggestions.append(tool)
        return suggestions

    def suggest_workflow(self, description: str):
        # For demo: create a workflow with suggested tools
        tools = self.suggest_tools(description)
        steps = [WorkflowStep(f"Step: {t['name']}", t['name'], 'step') for t in tools]
        return steps
