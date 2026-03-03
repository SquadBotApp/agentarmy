from __future__ import annotations

import os
from typing import Any, Dict, Iterable, List

import requests


SUPPORTED_PLATFORMS: Dict[str, str] = {
    "agentforce_360": "Agentforce 360",
    "microsoft_copilot_studio": "Microsoft Copilot Studio",
    "ibm_watsonx_assistant": "IBM watsonx Assistant",
    "openai_codex": "OpenAI Codex",
    "roo_code": "Roo Code",
    "google_jules": "Google Jules",
    "hashbrown": "Hashbrown",
    "project_astra": "Project Astra",
    "yellow_ai": "Yellow.ai",
    "moveworks": "Moveworks",
    "aws_q_dev": "AWS Q Dev",
    "sap_joule": "SAP Joule",
    "apple_mobile": "Apple Mobile Ecosystem",
    "samsung_mobile": "Samsung Galaxy Ecosystem",
    "google_mobile": "Google Mobile Ecosystem",
    "amazon_mobile": "Amazon Mobile Ecosystem",
    "ssh_remote": "SSH Remote Hosts",
    "ssh_bastion": "SSH Bastion Layer",
    "sftp_gateway": "SFTP Gateway",
    "threecx_phone": "3CX Communications",
    "claude_channel": "Claude Channel",
    "copilot_channel": "Copilot Channel",
}

MOBILE_VENDOR_TARGETS: Dict[str, str] = {
    "apple": "apple_mobile",
    "samsung": "samsung_mobile",
    "google": "google_mobile",
    "amazon": "amazon_mobile",
}


def _env_prefix(platform_id: str) -> str:
    return platform_id.upper()


class PlatformHub:
    """Dispatches workflow events to third-party agent platforms."""

    def __init__(self, timeout_seconds: float = 8.0, verify_tls: bool = True) -> None:
        self.timeout_seconds = timeout_seconds
        self.verify_tls = verify_tls

    def dispatch(
        self,
        event_type: str,
        payload: Dict[str, Any],
        targets: Iterable[str],
    ) -> Dict[str, Dict[str, Any]]:
        results: Dict[str, Dict[str, Any]] = {}
        normalized_targets: List[str] = []
        seen = set()
        for target in targets:
            target_id = str(target).strip().lower()
            if not target_id or target_id in seen:
                continue
            seen.add(target_id)
            normalized_targets.append(target_id)

        for platform_id in normalized_targets:
            if platform_id not in SUPPORTED_PLATFORMS:
                results[platform_id] = {"status": "skipped", "reason": "unsupported platform"}
                continue
            results[platform_id] = self._dispatch_one(platform_id, event_type, payload)
        return results

    def _dispatch_one(self, platform_id: str, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        env_key = _env_prefix(platform_id)
        webhook_url = os.getenv(f"{env_key}_WEBHOOK_URL", "")
        if not webhook_url:
            return {"status": "skipped", "reason": f"{env_key}_WEBHOOK_URL not configured"}

        headers = {"Content-Type": "application/json"}
        api_key = os.getenv(f"{env_key}_API_KEY", "")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        body = {
            "platform_id": platform_id,
            "platform_name": SUPPORTED_PLATFORMS[platform_id],
            "event_type": event_type,
            "payload": payload,
        }

        try:
            response = requests.post(
                webhook_url,
                headers=headers,
                json=body,
                timeout=self.timeout_seconds,
                verify=self.verify_tls,
            )
            return {
                "status": "accepted" if response.ok else "error",
                "http_status": response.status_code,
                "response_excerpt": response.text[:200],
            }
        except Exception as exc:
            return {"status": "error", "error": str(exc)}

    def default_targets(self) -> List[str]:
        return list(SUPPORTED_PLATFORMS.keys())

    def resolve_mobile_targets(self, vendors: Iterable[str]) -> List[str]:
        targets: List[str] = []
        for vendor in vendors:
            key = str(vendor).strip().lower()
            target = MOBILE_VENDOR_TARGETS.get(key)
            if target and target not in targets:
                targets.append(target)
        return targets
