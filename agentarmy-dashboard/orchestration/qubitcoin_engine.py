"""
QubitCoin Engine for AgentArmyOS
- Economic incentive system: rewards agents for reliability, longevity, contribution, and efficiency.
- Balances tracked and visualized in the dashboard.
"""

from typing import Dict, Any, Callable
import time

class QubitCoinEngine:
    def __init__(self, kernel):
        self.kernel = kernel
        self.balances = {}
        self.listeners = []

    def reward(self, agent_name: str, amount: float, reason: str = ""):    
        self.balances[agent_name] = self.balances.get(agent_name, 0) + amount
        self.kernel.reward_agent(agent_name, amount)
        self._emit_event({"type": "qubitcoin_rewarded", "agent": agent_name, "amount": amount, "reason": reason, "timestamp": time.time()})

    def get_balance(self, agent_name: str) -> float:
        return self.balances.get(agent_name, 0)

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
    econ = QubitCoinEngine(kernel)
    def print_event(event):
        print("EVENT:", event)
    econ.add_listener(print_event)
    econ.reward("Claude", 10, reason="completed workflow")
    print("BALANCE:", econ.get_balance("Claude"))
