"""
System Health & Self-Healing for AgentArmyOS
"""
from .agent_registry import AgentRegistry

class SelfHealingEngine:
    def __init__(self, registry: AgentRegistry):
        self.registry = registry

    def diagnose(self):
        # For demo: check if all agents respond to step()
        report = {}
        for name, agent in self.registry._agents.items():
            try:
                agent.step()
                report[name] = 'healthy'
            except Exception as e:
                report[name] = f'error: {e}'
        return report

    def auto_fix(self):
        # For demo: try to re-register any failed agent
        fixes = {}
        for name, agent in self.registry._agents.items():
            try:
                agent.step()
                fixes[name] = 'no action needed'
            except Exception:
                # In real system, reload or restart agent
                fixes[name] = 'attempted restart'
        return fixes
