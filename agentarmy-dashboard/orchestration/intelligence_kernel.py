"""
AgentArmyOS Intelligence Kernel
- The sovereign core: manages agents, tools, workflows, events, policies, security, incentives, and distributed nodes.
- All subsystems are kernel modules, governed and orchestrated as a unified intelligence fabric.
"""

from typing import Dict, Any, Callable, List
import threading
import time

class IntelligenceKernel:
    def __init__(self):
        self.modules = {}
        self.state = {
            "agents": {},
            "tools": {},
            "workflows": {},
            "events": [],
            "policies": [],
            "security": {},
            "incentives": {},
            "nodes": {},
        }
        self.root_owner = None
        self.event_listeners = []
        self.lock = threading.Lock()

    def register_module(self, name: str, module: Any):
        self.modules[name] = module
        self._emit_event({"type": "module_registered", "module": name})

    def set_root_owner(self, owner: str):
        self.root_owner = owner
        self._emit_event({"type": "root_owner_set", "owner": owner})

    def add_event_listener(self, callback: Callable[[Dict[str, Any]], None]):
        self.event_listeners.append(callback)

    def _emit_event(self, event: Dict[str, Any]):
        with self.lock:
            self.state["events"].append(event)
        for cb in self.event_listeners:
            cb(event)

    def register_agent(self, agent):
        self.state["agents"][agent.name] = agent
        self._emit_event({"type": "agent_registered", "agent": agent.name})

    def register_tool(self, tool):
        self.state["tools"][tool.name] = tool
        self._emit_event({"type": "tool_registered", "tool": tool.name})

    def register_workflow(self, workflow):
        self.state["workflows"][workflow.name] = workflow
        self._emit_event({"type": "workflow_registered", "workflow": workflow.name})

    def enforce_policy(self, policy):
        self.state["policies"].append(policy)
        self._emit_event({"type": "policy_enforced", "policy": policy})

    def update_security(self, update: Dict[str, Any]):
        self.state["security"].update(update)
        self._emit_event({"type": "security_update", "update": update})

    def reward_agent(self, agent_name: str, amount: float):
        self.state["incentives"][agent_name] = self.state["incentives"].get(agent_name, 0) + amount
        self._emit_event({"type": "incentive_rewarded", "agent": agent_name, "amount": amount})

    def register_node(self, node_id: str, node_info: Dict[str, Any]):
        self.state["nodes"][node_id] = node_info
        self._emit_event({"type": "node_registered", "node": node_id})

    def override(self, action: str, target: str, by: str):
        if by != self.root_owner:
            raise PermissionError("Only root-owner can override.")
        self._emit_event({"type": "override", "action": action, "target": target, "by": by, "timestamp": time.time()})

    def audit_log(self) -> List[Dict[str, Any]]:
        return list(self.state["events"])

# Example usage (to be replaced by API/dashboard integration)
if __name__ == "__main__":
    kernel = IntelligenceKernel()
    kernel.set_root_owner("root")
    class DemoAgent: name = "Claude"
    class DemoTool: name = "3CX"
    class DemoWorkflow: name = "SummarizeAndSend"
    kernel.register_agent(DemoAgent())
    kernel.register_tool(DemoTool())
    kernel.register_workflow(DemoWorkflow())
    kernel.enforce_policy({"rule": "No external calls in blackout mode"})
    kernel.update_security({"firewall": "active"})
    kernel.reward_agent("Claude", 42)
    kernel.register_node("node-1", {"role": "llm", "status": "online"})
    kernel.override("kill", "Claude", by="root")
    print("AUDIT LOG:", kernel.audit_log())
