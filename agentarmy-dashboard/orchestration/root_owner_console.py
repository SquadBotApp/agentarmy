"""
Root-Owner Console for AgentArmyOS
- Supreme authority: override, kill, inspect, approve/deny, edit policies, and audit all state/actions.
- UI/API integration for sovereign governance.
"""

from typing import Dict, Any, Callable, List
import time

class RootOwnerConsole:
    def __init__(self, kernel):
        self.kernel = kernel
        self.listeners = []

    def override(self, action: str, target: str):
        self.kernel.override(action, target, by=self.kernel.root_owner)
        self._emit_event({"type": "override_executed", "action": action, "target": target, "by": self.kernel.root_owner, "timestamp": time.time()})

    def edit_policy(self, policy_idx: int, new_policy: Dict[str, Any]):
        if 0 <= policy_idx < len(self.kernel.state["policies"]):
            self.kernel.state["policies"][policy_idx] = new_policy
            self._emit_event({"type": "policy_edited", "policy": new_policy, "by": self.kernel.root_owner, "timestamp": time.time()})

    def audit(self) -> List[Dict[str, Any]]:
        return self.kernel.audit_log()

    def add_listener(self, callback: Callable[[Dict[str, Any]], None]):
        self.listeners.append(callback)

    def _emit_event(self, event: Dict[str, Any]):
        for cb in self.listeners:
            cb(event)

# Example usage (to be replaced by API/dashboard integration)
if __name__ == "__main__":
    from intelligence_kernel import IntelligenceKernel
    kernel = IntelligenceKernel()
    kernel.set_root_owner("root")
    console = RootOwnerConsole(kernel)
    def print_event(event):
        print("EVENT:", event)
    console.add_listener(print_event)
    console.override("kill", "Claude")
    console.edit_policy(0, {"rule": "No external calls ever"})
    print("AUDIT LOG:", console.audit())
