from .base import BaseFrameworkAdapter


class AutoGenAdapter(BaseFrameworkAdapter):
    framework_name = "autogen"
    dependency_name = "autogen"
    coordination_mode = "group_chat"
