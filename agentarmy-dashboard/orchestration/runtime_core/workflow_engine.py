"""
Workflow Engine for AgentArmy OS
Defines, schedules, and executes cross-platform workflows using registered adapters.
"""
from typing import List, Dict, Any, Callable
from .agent_registry import AgentRegistry
from .event_bus import EventBus

class WorkflowStep:
    def __init__(self, name: str, agent_name: str, action: str, params: Dict[str, Any] = None):
        self.name = name
        self.agent_name = agent_name
        self.action = action
        self.params = params or {}

class Workflow:
    def __init__(self, name: str, steps: List[WorkflowStep]):
        self.name = name
        self.steps = steps
        self.status = "pending"
        self.results = []

class WorkflowEngine:
    def __init__(self, registry: AgentRegistry, event_bus: EventBus):
        self.registry = registry
        self.event_bus = event_bus
        self.workflows: Dict[str, Workflow] = {}

    def create_workflow(self, name: str, steps: List[WorkflowStep]) -> Workflow:
        wf = Workflow(name, steps)
        self.workflows[name] = wf
        return wf

    def run_workflow(self, name: str) -> List[Any]:
        wf = self.workflows.get(name)
        if not wf:
            raise ValueError(f"Workflow '{name}' not found")
        wf.status = "running"
        wf.results = []
        for step in wf.steps:
            agent = self.registry.get(step.agent_name)
            if not agent:
                wf.results.append({"step": step.name, "error": f"Agent '{step.agent_name}' not found"})
                continue
            # For demo: call a generic 'step' method, passing params
            try:
                result = agent.step(**step.params) if step.params else agent.step()
                wf.results.append({"step": step.name, "result": result})
            except Exception as e:
                wf.results.append({"step": step.name, "error": str(e)})
        wf.status = "completed"
        return wf.results

    def get_workflow_status(self, name: str) -> str:
        wf = self.workflows.get(name)
        return wf.status if wf else "not_found"

    def get_workflow_results(self, name: str) -> List[Any]:
        wf = self.workflows.get(name)
        return wf.results if wf else []
