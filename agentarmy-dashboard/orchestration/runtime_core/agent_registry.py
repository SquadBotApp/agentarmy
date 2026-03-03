"""
Agent Registry for AgentArmy Runtime Core
----------------------------------------
Tracks all registered agents and subsystems for discovery and management.
"""
from typing import Dict, Type
from .universal_agent_interface import UniversalAgentInterface
from .adapters import ThreeCXAdapter, ClaudeCodeAdapter

class AgentRegistry:
    """Central registry for all agents and subsystems."""
    def __init__(self):
        self._agents: Dict[str, UniversalAgentInterface] = {}
        # Auto-register core adapters
        self.register("3cx", ThreeCXAdapter(config={}))
        self.register("claude", ClaudeCodeAdapter(config={}))

    def register(self, name: str, agent: UniversalAgentInterface):
        self._agents[name] = agent

    def unregister(self, name: str):
        if name in self._agents:
            del self._agents[name]

    def get(self, name: str) -> UniversalAgentInterface:
        return self._agents.get(name)

    def all(self):
        return list(self._agents.values())
