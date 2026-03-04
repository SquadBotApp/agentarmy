import requests
import os

MODEL_IDS = {
    "gemini": "gemini-1.5-pro",
    "qwen": "qwen-2-72b-instruct",
    "codex": "deepseek-coder-33b-instruct",
    "chatgpt": "gpt-3.5-turbo"
}

API_KEY = os.getenv("MODELSLAB_API_KEY") or "U4a5UEtOluadK4BXiVaDPPoKwbjwfalAbOiSYxjB4AwF0DUTWy20gXP3qyuN"
BASE_URL = "https://modelslab.com/api/v7/llm/chat/completions"

def call_modelslab_llm(model: str, user_message: str, system_message: str = "You are a helpful assistant."):
    payload = {
        "model": MODEL_IDS[model],
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ]
    }
    headers = {
        "key": API_KEY,
        "Content-Type": "application/json"
    }
    resp = requests.post(BASE_URL, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()
