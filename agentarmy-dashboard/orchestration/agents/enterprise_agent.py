# EnterpriseAgent class for advanced orchestration
# Implements enterprise-grade guardrails, context, and tool registry integration

from .base_agent import BaseAgent  # Import base agent functionality
from .llm_client import LLMClient  # Import LLM client for model calls
from .prompts import get_agent_model, PROMPTS  # Import prompt registry and model config
from ..tools.tool_loader import get_tools_by_type  # Import tool registry loader

class EnterpriseAgent(BaseAgent):
    def __init__(self, name, context=None, model=None, tools=None):
        # Initialize EnterpriseAgent with name, context, model, and tools
        super().__init__(name, context=context)
        # Set model using per-agent config if not provided
        self.model = model or get_agent_model(name)
        # Set tools using registry if not provided
        self.tools = tools or get_tools_by_type('enterprise')
        # Set prompt from registry
        self.prompt = PROMPTS.get(name, "Enterprise agent default prompt.")

    def run(self, input_data):
        # Run agent with input data, using model and tools
        # Compose context for enterprise-grade guardrails
        context = self.context or {}
        context['tools'] = self.tools
        context['model'] = self.model
        # Call LLM client with prompt and context
        response = LLMClient.call_llm(
            prompt=self.prompt,
            input_data=input_data,
            context=context,
            model=self.model
        )
        # Return response
        return response
