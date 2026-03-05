import os
import requests
import logging

logger = logging.getLogger(__name__)

def call_modelslab_llm(model, user_message, system_message):
    """
    Calls the ModelsLab LLM API (or compatible).
    If the API key is missing, raises ValueError to trigger the system's 
    internal fallback protocols (Creative Mode).
    """
    api_key = os.getenv("MODELSLAB_API_KEY")
    if not api_key:
        # This specific error message is expected by the caller to trigger fallback
        raise ValueError("MODELSLAB_API_KEY environment variable not set.")

    # Example endpoint - replace with actual if available
    url = "https://modelslab.com/api/v6/llm/chat"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ]
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        raise e