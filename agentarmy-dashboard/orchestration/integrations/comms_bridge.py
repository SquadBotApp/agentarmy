from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List

from .platform_hub import PlatformHub


COMMS_ALIAS_TARGETS: Dict[str, str] = {
    "3cx": "threecx_phone",
    "threecx": "threecx_phone",
    "phone": "threecx_phone",
    "claude": "claude_channel",
    "anthropic": "claude_channel",
    "copilot": "microsoft_copilot_studio",
    "copy": "microsoft_copilot_studio",
}


def _resolve_targets(targets: Iterable[str]) -> List[str]:
    resolved: List[str] = []
    for item in targets:
        raw = str(item).strip().lower()
        if not raw:
            continue
        platform_id = COMMS_ALIAS_TARGETS.get(raw, raw)
        if platform_id not in resolved:
            resolved.append(platform_id)
    return resolved


def broadcast_comms(payload: Dict[str, Any]) -> Dict[str, Any]:
    message = str(payload.get("message", "")).strip()
    if not message:
        return {
            "status": "failed",
            "error": "message is required",
            "dispatched_at": datetime.now(timezone.utc).isoformat(),
        }

    requested_targets = payload.get("targets") or ["3cx", "claude", "copilot"]
    if not isinstance(requested_targets, list):
        requested_targets = ["3cx", "claude", "copilot"]

    targets = _resolve_targets(requested_targets)
    hub = PlatformHub()
    event_type = str(payload.get("event_type", "comms_broadcast")).strip() or "comms_broadcast"

    dispatch_payload = {
        "message": message,
        "channel": str(payload.get("channel", "operations")).strip() or "operations",
        "priority": str(payload.get("priority", "normal")).strip() or "normal",
        "context": payload.get("context", {}) if isinstance(payload.get("context", {}), dict) else {},
    }
    results = hub.dispatch(event_type=event_type, payload=dispatch_payload, targets=targets)
    accepted = len([r for r in results.values() if r.get("status") == "accepted"])

    return {
        "status": "completed",
        "message": message,
        "event_type": event_type,
        "targets": targets,
        "accepted": accepted,
        "results": results,
        "dispatched_at": datetime.now(timezone.utc).isoformat(),
    }
