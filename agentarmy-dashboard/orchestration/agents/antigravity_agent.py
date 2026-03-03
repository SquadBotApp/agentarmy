from .base_agent import BaseAgent
from .llm_client import LLMClient
from .prompts import PROMPTS, get_agent_model
from ..tools.tool_loader import get_tools_by_type

class AntigravityAgent(BaseAgent):
    """
    Advanced agentic AI coding assistant designed for extensible orchestration.
    Inherits all base agent capabilities and integrates with LLM, prompt, and tool registry systems.
    """
    def __init__(self, name="Antigravity", model=None, tools=None):
        model = model or get_agent_model("antigravity")
        tools = tools or get_tools_by_type("antigravity")
        super().__init__(
            name=name,
            llm_client=LLMClient(model=model),
            prompt=PROMPTS.get("antigravity", "You are Antigravity, a powerful agentic AI coding assistant."),
            tools=tools
        )

    def act(self, *args, **kwargs):
        """Override with Antigravity-specific orchestration logic if needed."""
        return super().act(*args, **kwargs)
