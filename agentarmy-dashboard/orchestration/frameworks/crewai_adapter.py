from .base import BaseFrameworkAdapter


class CrewAIAdapter(BaseFrameworkAdapter):
    framework_name = "crewai"
    dependency_name = "crewai"
    coordination_mode = "crew"
