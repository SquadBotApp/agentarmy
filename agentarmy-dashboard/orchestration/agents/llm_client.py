from __future__ import annotations

import json
import os
from typing import Any, Dict, List

import requests


LLMMessage = Dict[str, str]


class LLMClientError(RuntimeError):
    pass


def _call_backend_llm(messages: List[LLMMessage], model: str) -> str:
    base_url = os.getenv("ORCHESTRATION_LLM_URL", "http://localhost:4000")
    token = os.getenv("ORCHESTRATION_BEARER_TOKEN", "")
    if not token:
        raise LLMClientError("ORCHESTRATION_BEARER_TOKEN is not configured")

    response = requests.post(
        f"{base_url.rstrip('/')}/llm",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={"messages": messages, "model": model},
        timeout=30,
    )
    if not response.ok:
        raise LLMClientError(f"Backend /llm failed ({response.status_code}): {response.text[:200]}")
    data = response.json()
    content = data.get("content")
    if not isinstance(content, str) or not content.strip():
        raise LLMClientError("Backend /llm returned empty content")
    return content


def _call_anthropic_direct(messages: List[LLMMessage], model: str) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise LLMClientError("ANTHROPIC_API_KEY is not configured")

    system = ""
    user_messages: List[Dict[str, str]] = []
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role == "system":
            system += ("\n" if system else "") + content
        elif role in {"user", "assistant"}:
            user_messages.append({"role": role, "content": content})

    payload: Dict[str, Any] = {
        "model": model,
        "max_tokens": 800,
        "messages": user_messages or [{"role": "user", "content": "Hello"}],
    }
    if system:
        payload["system"] = system

    response = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        data=json.dumps(payload),
        timeout=30,
    )
    if not response.ok:
        raise LLMClientError(f"Anthropic API failed ({response.status_code}): {response.text[:200]}")

    body = response.json()
    content_blocks = body.get("content", [])
    text_parts = [b.get("text", "") for b in content_blocks if b.get("type") == "text"]
    content = "\n".join(p for p in text_parts if p).strip()
    if not content:
        raise LLMClientError("Anthropic API returned no text content")
    return content


def call_llm(messages: List[LLMMessage], model: str = "claude-3-5-haiku-20241022") -> str:
    """
    Real LLM call path:
    1) Node backend /llm (preferred; central auth/RBAC/secrets)
    2) Direct Anthropic API
    3) Deterministic fallback (for local/offline tests)
    """
    try:
        return _call_backend_llm(messages, model)
    except Exception:
        try:
            return _call_anthropic_direct(messages, model)
        except Exception:
            # Deterministic fallback for tests/dev without secrets.
            user_text = "\n".join(m.get("content", "") for m in messages if m.get("role") == "user").strip()
            return f"[mock-llm] {user_text[:400]}"
