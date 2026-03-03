"""
Universal External Tool Adapter for AgentArmyOS
Allows dynamic plug-and-play of any CLI, API, container, or cloud tool.
"""
from ..universal_agent_interface import UniversalAgentInterface
from ..event_bus import EventBus
import subprocess
import requests

class ExternalToolAdapter(UniversalAgentInterface):
    def __init__(self, name, config=None):
        self.name = name
        self.config = config or {}
        self.event_bus = None

    def attach_event_bus(self, event_bus: EventBus):
        self.event_bus = event_bus

    def step(self, command=None, api_url=None, params=None, docker_image=None, **kwargs):
        # Dynamically run CLI, API, or containerized tool
        if command:
            try:
                result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=60)
                return {'stdout': result.stdout, 'stderr': result.stderr, 'returncode': result.returncode}
            except Exception as e:
                return {'error': str(e)}
        if api_url:
            try:
                resp = requests.post(api_url, json=params or {}, timeout=30)
                return {'status_code': resp.status_code, 'response': resp.text}
            except Exception as e:
                return {'error': str(e)}
        if docker_image:
            try:
                result = subprocess.run(f'docker run --rm {docker_image}', shell=True, capture_output=True, text=True, timeout=120)
                return {'stdout': result.stdout, 'stderr': result.stderr, 'returncode': result.returncode}
            except Exception as e:
                return {'error': str(e)}
        return {'error': 'No valid execution method provided'}

    def shutdown(self):
        # Clean up if needed
        pass
