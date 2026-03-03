from __future__ import annotations

import os
from typing import Any, Dict, Optional

import requests


class N8NAdapter:
    """Thin webhook adapter for integrating external n8n automations."""

    def __init__(
        self,
        webhook_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_seconds: float = 8.0,
        verify_tls: bool = True,
    ) -> None:
        self.webhook_url = webhook_url or os.getenv("N8N_WEBHOOK_URL", "")
        self.api_key = api_key or os.getenv("N8N_API_KEY", "")
        self.timeout_seconds = timeout_seconds
        self.verify_tls = verify_tls

    def is_enabled(self) -> bool:
        flag = os.getenv("N8N_ENABLED", "").lower()
        env_enabled = flag in {"1", "true", "yes", "on"}
        return bool(self.webhook_url) and (env_enabled or flag == "")

    def trigger(self, event_type: str, payload: Dict[str, Any], workflow: str = "default") -> Dict[str, Any]:
        if not self.webhook_url:
            return {
                "enabled": False,
                "status": "skipped",
                "reason": "N8N_WEBHOOK_URL not configured",
            }

        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-N8N-API-KEY"] = self.api_key

        body = {
            "event_type": event_type,
            "workflow": workflow,
            "payload": payload,
        }

        try:
            response = requests.post(
                self.webhook_url,
                headers=headers,
                json=body,
                timeout=self.timeout_seconds,
                verify=self.verify_tls,
            )
            status = "accepted" if response.ok else "error"
            return {
                "enabled": True,
                "status": status,
                "http_status": response.status_code,
                "workflow": workflow,
                "response_excerpt": response.text[:200],
            }
        except Exception as exc:
            return {
                "enabled": True,
                "status": "error",
                "workflow": workflow,
                "error": str(exc),
            }
