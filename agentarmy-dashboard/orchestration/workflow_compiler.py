"""
Autonomous Workflow Compiler for AgentArmyOS
- Observes user and agent actions, infers patterns, proposes workflows, and compiles them automatically.
- Acts as a workflow-forming brain that learns and optimizes user habits.
"""

from typing import List, Dict, Any, Callable
import threading
import time

class WorkflowCompiler:
    def __init__(self):
        self.observed_actions = []
        self.patterns = []
        self.suggestions = []
        self.listeners = []
        self.running = False
        self._thread = None

    def observe_action(self, action: Dict[str, Any]):
        self.observed_actions.append(action)
        self._emit_event({"type": "action_observed", "action": action})
        self._analyze_patterns()

    def _analyze_patterns(self):
        # Simple pattern mining: look for repeated sequences
        if len(self.observed_actions) < 3:
            return
        last_three = self.observed_actions[-3:]
        # If the last three actions are similar to a previous pattern, suggest a workflow
        for pattern in self.patterns:
            if pattern == last_three:
                self._suggest_workflow(pattern)
                return
        self.patterns.append(last_three)
        self._suggest_workflow(last_three)

    def _suggest_workflow(self, pattern):
        workflow = [{"task": a["task"], "agent": a["agent"]} for a in pattern]
        self.suggestions.append(workflow)
        self._emit_event({"type": "workflow_suggested", "workflow": workflow})

    def add_listener(self, callback: Callable[[Dict[str, Any]], None]):
        self.listeners.append(callback)

    def _emit_event(self, event: Dict[str, Any]):
        for cb in self.listeners:
            cb(event)

    def compile_workflow(self, workflow: List[Dict[str, Any]]):
        # Compile workflow into executable format (stub)
        compiled = {"compiled_workflow": workflow, "timestamp": time.time()}
        self._emit_event({"type": "workflow_compiled", "compiled": compiled})
        return compiled

# Example usage (to be replaced by API/dashboard integration)
if __name__ == "__main__":
    compiler = WorkflowCompiler()
    def print_event(event):
        print("EVENT:", event)
    compiler.add_listener(print_event)
    actions = [
        {"task": "summarize call", "agent": "Claude"},
        {"task": "generate report", "agent": "LocalLLM"},
        {"task": "send report", "agent": "3CX"},
    ]
    for action in actions:
        compiler.observe_action(action)
    # Simulate repeating the same pattern
    for action in actions:
        compiler.observe_action(action)
    # Compile the suggested workflow
    if compiler.suggestions:
        compiler.compile_workflow(compiler.suggestions[0])
