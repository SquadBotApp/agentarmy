"""
Audit & Trace Engine for AgentArmyOS
- Logs every action, decision, override, and event for full transparency and regulatory compliance.
- Supports live dashboard visualization and export.
"""

from typing import Dict, Any, Callable, List
import time

class AuditTraceEngine:
    def __init__(self, kernel):
        self.kernel = kernel
        self.listeners = []
        self.log = []

    def record(self, event: Dict[str, Any]):
        self.log.append({"event": event, "timestamp": time.time()})
        self._emit_event({"type": "audit_log", "event": event})

    def export(self) -> List[Dict[str, Any]]:
        return list(self.log)

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
    audit = AuditTraceEngine(kernel)
    def print_event(event):
        print("EVENT:", event)
    audit.add_listener(print_event)
    audit.record({"action": "test", "by": "root"})
    print("EXPORT LOG:", audit.export())
