import os
from agentarmy.providers.openai_provider import OpenAIProvider
from agentarmy.providers.anthropic_provider import AnthropicProvider
from agentarmy.providers.simai_provider import SimAiProvider
from agentarmy.core.router import ModelRouter

# Load API keys
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")

if not OPENAI_KEY or not ANTHROPIC_KEY:
    raise RuntimeError("Missing API keys. Set OPENAI_API_KEY and ANTHROPIC_API_KEY.")

# Initialize providers
openai_provider = OpenAIProvider(api_key=OPENAI_KEY)
anthropic_provider = AnthropicProvider(api_key=ANTHROPIC_KEY)
simai_provider = SimAiProvider()

# Register providers
providers = {
    "openai": openai_provider,
    "anthropic": anthropic_provider,
    "simai": simai_provider
}

# Initialize router
router = ModelRouter(providers)

# Temporary test run
if __name__ == "__main__":
    print("Router initialized successfully.")
