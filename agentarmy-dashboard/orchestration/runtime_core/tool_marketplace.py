"""
Tool Marketplace for AgentArmyOS
Allows discovery, install, enable, and workflow integration of new tools.
"""
from .adapters.external_tool_adapter import ExternalToolAdapter
from .adapters.local_llm_adapter import LocalLLMAdapter
from .agent_registry import AgentRegistry
from .event_bus import EventBus

class ToolMarketplace:
    def __init__(self, registry: AgentRegistry, event_bus: EventBus):
        self.registry = registry
        self.event_bus = event_bus
        self.available_tools = []  # Could be loaded from curated list, GitHub, or user upload

    def discover_tools(self, source='curated'):
        # For demo: return a static list, but could fetch from GitHub or remote API
        self.available_tools = [
            {'name': 'nmap', 'type': 'cli', 'command': 'nmap --version'},
            {'name': 'curl', 'type': 'cli', 'command': 'curl --version'},
            {'name': 'httpbin', 'type': 'api', 'api_url': 'https://httpbin.org/post'},
            {'name': 'alpine', 'type': 'docker', 'docker_image': 'alpine:latest'},
            {'name': 'local-llm', 'type': 'llm', 'backend': 'llama.cpp', 'model_path': './models/llama.bin'},
        ]
        return self.available_tools

    def install_tool(self, tool_info):
        # Register as an external tool adapter or LocalLLMAdapter
        if tool_info.get('type') == 'llm' and tool_info.get('name') == 'local-llm':
            adapter = LocalLLMAdapter(config=tool_info)
        else:
            adapter = ExternalToolAdapter(tool_info['name'], config=tool_info)
        self.registry.register(tool_info['name'], adapter)
        adapter.attach_event_bus(self.event_bus)
        return {'status': 'installed', 'tool': tool_info['name']}

    def list_installed_tools(self):
        return [a for a in self.registry._agents.keys() if isinstance(self.registry.get(a), ExternalToolAdapter)]
