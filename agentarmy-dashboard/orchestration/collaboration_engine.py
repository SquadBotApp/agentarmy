"""
Multi-Agent Live Collaboration Engine for AgentArmyOS
- Enables real-time negotiation, coordination, and dynamic task assignment among agents.
- Supports live event streaming for dashboard visualization.
"""

from typing import List, Dict, Any, Callable
import threading
import queue
import time

class CollaborationEngine:
    def __init__(self):
        self.agents = {}
        self.event_listeners = []
        self.event_queue = queue.Queue()
        self.running = False
        self._thread = None

    def register_agent(self, agent):
        self.agents[agent.name] = agent
        self._emit_event({"type": "agent_registered", "agent": agent.name})

    def start(self):
        if not self.running:
            self.running = True
            self._thread = threading.Thread(target=self._event_loop, daemon=True)
            self._thread.start()

    def stop(self):
        self.running = False
        if self._thread:
            self._thread.join()

    def _event_loop(self):
        while self.running:
            try:
                event = self.event_queue.get(timeout=0.5)
                self._notify(event)
            except queue.Empty:
                continue

    def _emit_event(self, event: Dict[str, Any]):
        self.event_queue.put(event)

    def add_event_listener(self, callback: Callable[[Dict[str, Any]], None]):
        self.event_listeners.append(callback)

    def _notify(self, event: Dict[str, Any]):
        for cb in self.event_listeners:
            cb(event)

    def negotiate_task(self, task: str, participants: List[str]):
        # Agents negotiate who will take the task
        negotiation = {"task": task, "offers": {}}
        for name in participants:
            agent = self.agents.get(name)
            if agent:
                offer = agent.propose(task)
                negotiation["offers"][name] = offer
                self._emit_event({"type": "negotiation_offer", "agent": name, "task": task, "offer": offer})
        # Pick best offer (simple max score)
        winner = max(negotiation["offers"].items(), key=lambda x: x[1]["score"])[0]
        self._emit_event({"type": "negotiation_winner", "task": task, "winner": winner})
        return winner

    def coordinate(self, workflow: List[Dict[str, Any]]):
        # Each step: negotiate, assign, execute, emit events
        for step in workflow:
            task = step["task"]
            participants = step["agents"]
            winner = self.negotiate_task(task, participants)
            agent = self.agents[winner]
            result = agent.act(task)
            self._emit_event({"type": "task_completed", "task": task, "agent": winner, "result": result})

# Example agent stub
class LiveDemoAgent:
    def __init__(self, name):
        self.name = name
    def propose(self, task):
        # Simulate negotiation offer
        return {"score": int(time.time()) % 10, "details": f"{self.name} can do {task}"}
    def act(self, task):
        return {"output": f"{self.name} completed {task}"}

# Example usage (to be replaced by API/dashboard integration)
if __name__ == "__main__":
    engine = CollaborationEngine()
    agents = [LiveDemoAgent("Claude"), LiveDemoAgent("3CX"), LiveDemoAgent("LocalLLM")]
    for agent in agents:
        engine.register_agent(agent)
    def print_event(event):
        print("EVENT:", event)
    engine.add_event_listener(print_event)
    engine.start()
    workflow = [
        {"task": "summarize call", "agents": ["Claude", "LocalLLM"]},
        {"task": "send report", "agents": ["3CX", "Claude"]},
    ]
    engine.coordinate(workflow)
    engine.stop()
