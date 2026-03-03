from .base import BaseFrameworkAdapter


class SmolAgentsAdapter(BaseFrameworkAdapter):
    framework_name = "smolagents"
    dependency_name = "smolagents"
    coordination_mode = "tool_agent"
