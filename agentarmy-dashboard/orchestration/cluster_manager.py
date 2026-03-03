"""
Distributed Agent Nodes (Cluster Manager) for AgentArmyOS
- Enables multi-machine clustering, node discovery, encrypted communication, and distributed task routing.
- Foundation for distributed intelligence fabric and commercial deployment.
"""

from typing import List, Dict, Any, Callable
import threading
import time
import uuid

class ClusterNode:
    def __init__(self, role: str, address: str):
        self.id = str(uuid.uuid4())
        self.role = role
        self.address = address
        self.status = "online"
        self.last_heartbeat = time.time()

class ClusterManager:
    def __init__(self):
        self.nodes: Dict[str, ClusterNode] = {}
        self.listeners = []
        self.running = False
        self._thread = None

    def register_node(self, role: str, address: str):
        node = ClusterNode(role, address)
        self.nodes[node.id] = node
        self._emit_event({"type": "node_registered", "node": node.__dict__})
        return node.id

    def heartbeat(self, node_id: str):
        node = self.nodes.get(node_id)
        if node:
            node.last_heartbeat = time.time()
            node.status = "online"
            self._emit_event({"type": "heartbeat", "node": node.__dict__})

    def monitor_nodes(self, timeout: float = 10.0):
        self.running = True
        def monitor():
            while self.running:
                now = time.time()
                for node in self.nodes.values():
                    if now - node.last_heartbeat > timeout:
                        node.status = "offline"
                        self._emit_event({"type": "node_offline", "node": node.__dict__})
                time.sleep(timeout / 2)
        self._thread = threading.Thread(target=monitor, daemon=True)
        self._thread.start()

    def stop_monitoring(self):
        self.running = False
        if self._thread:
            self._thread.join()

    def add_listener(self, callback: Callable[[Dict[str, Any]], None]):
        self.listeners.append(callback)

    def share_agent(self, agent):
        # In a real system, serialize and send agent to other nodes
        self._emit_event({"type": "agent_shared", "agent": getattr(agent, 'name', str(agent)), "from": "this_node"})

    def share_task(self, task):
        # In a real system, serialize and send task to other nodes
        self._emit_event({"type": "task_shared", "task": task, "from": "this_node"})

    def replicate_state(self, kernel_state: Dict[str, Any]):
        # In a real system, sync kernel state across nodes
        self._emit_event({"type": "state_replicated", "state": kernel_state, "from": "this_node"})

    def secure_emit(self, event: Dict[str, Any]):
        # Placeholder for encrypted, signed event emission
        self._emit_event({"type": "secure_event", **event})

    def _emit_event(self, event: Dict[str, Any]):
        for cb in self.listeners:
            cb(event)

    def route_task(self, task: Dict[str, Any], role: str):
        # Route task to an online node with the given role
        for node in self.nodes.values():
            if node.role == role and node.status == "online":
                self._emit_event({"type": "task_routed", "task": task, "node": node.__dict__})
                return node.id
        self._emit_event({"type": "task_routing_failed", "task": task, "role": role})
        return None

# Example usage (to be replaced by API/dashboard integration)
if __name__ == "__main__":
    from intelligence_kernel import IntelligenceKernel
    kernel = IntelligenceKernel()
    kernel.set_root_owner("root")
    cluster = ClusterManager()
    def print_event(event):
        print("EVENT:", event)
    cluster.add_listener(print_event)
    node_id = cluster.register_node("llm", "127.0.0.1")
    cluster.heartbeat(node_id)
    class DemoAgent: name = "Claude"
    cluster.share_agent(DemoAgent())
    cluster.share_task({"task": "summarize call"})
    cluster.replicate_state(kernel.state)
    cluster.secure_emit({"custom": "secure_test"})
    cluster.stop_monitoring()
