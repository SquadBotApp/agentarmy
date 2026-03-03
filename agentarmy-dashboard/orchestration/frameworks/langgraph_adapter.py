from .base import BaseFrameworkAdapter


class LangGraphAdapter(BaseFrameworkAdapter):
    framework_name = "langgraph"
    dependency_name = "langgraph"
    coordination_mode = "state_graph"
