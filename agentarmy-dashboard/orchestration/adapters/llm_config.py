"""
LLM configuration adapter
Handles diversified model routing (OpenAI, Anthropic, Groq, xAI, Gemini)
"""

import os
from typing import Optional

def get_llm_config(provider: str = "default", model: Optional[str] = None):
    """
    Get LLM configuration for a specific provider
    Used by agents for model selection
    
    Args:
        provider: "openai", "anthropic", "groq", "xai", "gemini", or "default"
        model: override model name (optional)
    
    Returns:
        dict with model config for CrewAI
    """
    
    configs = {
        "openai": {
            "model": model or "gpt-4o-mini",
            "temperature": 0.7,
            "api_key": os.getenv("OPENAI_API_KEY", ""),
        },
        "anthropic": {
            "model": model or "claude-3-5-sonnet-20241022",
            "temperature": 0.7,
            "api_key": os.getenv("ANTHROPIC_API_KEY", ""),
        },
        "groq": {
            "model": model or "llama-3-70b-versatile",
            "temperature": 0.7,
            "api_key": os.getenv("GROQ_API_KEY", ""),
            "base_url": "https://api.groq.com/openai/v1",
        },
        "xai": {
            "model": model or "grok-beta",
            "temperature": 0.7,
            "api_key": os.getenv("XAI_API_KEY", ""),
            "base_url": "https://api.x.ai/v1",
        },
        "gemini": {
            "model": model or "gemini-1.5-flash",
            "temperature": 0.7,
            "api_key": os.getenv("GEMINI_API_KEY", ""),
        },
    }
    
    # Default to first available, or openai
    if provider not in configs:
        for p, config in configs.items():
            if config.get("api_key"):
                return config
        provider = "openai"
    
    return configs.get(provider, configs["openai"])

def select_provider_for_role(role: str) -> str:
    """
    Recommend provider based on agent role
    (Can be overridden by model_preferences)
    
    Role-specific optimization:
    - Planner: Anthropic (strategic reasoning)
    - Router: Groq (fast routing decisions)
    - Safety/Governance: Anthropic (safety-focused)
    - Workers: Groq (fast execution)
    - Synthesizer: OpenAI (balanced, high quality)
    """
    
    role_map = {
        "planner": "anthropic",
        "router": "groq",
        "governance": "anthropic",
        "worker": "groq",
        "synthesizer": "openai",
    }
    
    provider = role_map.get(role.lower(), "openai")
    
    # Fall back to available provider if not configured
    if not os.getenv(f"{provider.upper()}_API_KEY"):
        available = []
        if os.getenv("OPENAI_API_KEY"):
            available.append("openai")
        if os.getenv("ANTHROPIC_API_KEY"):
            available.append("anthropic")
        if os.getenv("GROQ_API_KEY"):
            available.append("groq")
        if os.getenv("XAI_API_KEY"):
            available.append("xai")
        if os.getenv("GEMINI_API_KEY"):
            available.append("gemini")
        
        if available:
            provider = available[0]
        else:
            provider = "openai"  # Ultimate fallback (mock in dev)
    
    return provider
