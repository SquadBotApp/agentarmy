"""
Adaptive Policy & Safety Engine for AgentArmyOS
- Provides dynamic risk scoring, anomaly detection, automatic policy generation, and root-owner override with traceability.
- Integrates with compliance and defensive subsystems.
"""

from typing import List, Dict, Any, Callable
import time
import random

class AdaptivePolicyEngine:
    def __init__(self):
        self.policies = []
        self.risk_scores = {}
        self.anomalies = []
        self.listeners = []

    def evaluate_action(self, action: Dict[str, Any]):
        # Dynamic risk scoring (stub: random for demo)
        risk = random.uniform(0, 1)
        self.risk_scores[action.get("id", str(time.time()))] = risk
        self._emit_event({"type": "risk_scored", "action": action, "risk": risk})
        # Anomaly detection (stub: flag high risk)
        if risk > 0.8:
            anomaly = {"action": action, "risk": risk, "timestamp": time.time()}
            self.anomalies.append(anomaly)
            self._emit_event({"type": "anomaly_detected", "anomaly": anomaly})
        # Auto policy generation (stub)
        if risk > 0.5:
            policy = {"rule": f"Limit {action.get('agent', 'unknown')} on {action.get('task', 'unknown')}", "risk": risk}
            self.policies.append(policy)
            self._emit_event({"type": "policy_generated", "policy": policy})

    def add_listener(self, callback: Callable[[Dict[str, Any]], None]):
        self.listeners.append(callback)

    def _emit_event(self, event: Dict[str, Any]):
        for cb in self.listeners:
            cb(event)

    def override_policy(self, policy_idx: int, owner: str):
        if 0 <= policy_idx < len(self.policies):
            policy = self.policies[policy_idx]
            self._emit_event({"type": "policy_overridden", "policy": policy, "owner": owner, "timestamp": time.time()})
            del self.policies[policy_idx]

# Example usage (to be replaced by API/dashboard integration)
if __name__ == "__main__":
    engine = AdaptivePolicyEngine()
    def print_event(event):
        print("EVENT:", event)
    engine.add_listener(print_event)
    actions = [
        {"id": "1", "task": "summarize call", "agent": "Claude"},
        {"id": "2", "task": "send report", "agent": "3CX"},
    ]
    for action in actions:
        engine.evaluate_action(action)
    # Simulate root-owner override
    if engine.policies:
        engine.override_policy(0, owner="root")
