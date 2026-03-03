from __future__ import annotations

from typing import Any, Dict, List

try:
    from frameworks import normalize_framework_name
except Exception:  # pragma: no cover
    from ..frameworks import normalize_framework_name

try:
    from integrations import MOBILE_VENDOR_TARGETS, SUPPORTED_PLATFORMS
except Exception:  # pragma: no cover
    from . import MOBILE_VENDOR_TARGETS, SUPPORTED_PLATFORMS

try:
    from tools.tool_loader import load_registry
except Exception:  # pragma: no cover - defensive import for runtime env differences
    load_registry = None


_KEYWORDS = {
    "coding": ("code", "feature", "bug", "test", "refactor", "pr"),
    "analysis": ("analyze", "report", "summarize", "insight", "evaluate"),
    "governance": ("policy", "approval", "risk", "governance", "audit"),
    "mobile": ("mobile", "ios", "android", "apple", "samsung", "google", "amazon"),
    "ssh": ("ssh", "sftp", "bastion", "remote host", "terminal"),
}


def _detect_intents(goal: str) -> List[str]:
    g = (goal or "").lower()
    intents: List[str] = []
    for name, words in _KEYWORDS.items():
        if any(w in g for w in words):
            intents.append(name)
    return intents or ["analysis"]


def _choose_framework(intents: List[str], requested: str | None) -> str:
    req = normalize_framework_name(requested)
    if req != "native":
        return req
    if "coding" in intents:
        return "langgraph"
    if "governance" in intents:
        return "crewai"
    return "native"


def _toolchain_for_intents(intents: List[str]) -> List[str]:
    desired_caps = []
    if "coding" in intents:
        desired_caps.extend(["code", "chat", "instruction"])
    if "analysis" in intents:
        desired_caps.extend(["reasoning", "summarization", "chat"])
    if "mobile" in intents:
        desired_caps.extend(["mobile", "workflow-automation"])
    if "ssh" in intents:
        desired_caps.extend(["ssh", "sftp", "terminal"])

    desired_caps = list(dict.fromkeys(desired_caps))
    if load_registry is None:
        return desired_caps

    try:
        registry = load_registry()
    except Exception:
        return desired_caps

    selected: List[str] = []
    for cap in desired_caps:
        for tool in registry:
            caps = tool.get("capabilities") or []
            if cap in caps:
                tid = tool.get("id")
                if isinstance(tid, str) and tid not in selected:
                    selected.append(tid)
                    break
    return selected or desired_caps


def _integration_targets(intents: List[str], mobile_vendors: List[str]) -> List[str]:
    targets: List[str] = []
    if "coding" in intents:
        targets.extend(["openai_codex", "google_jules", "roo_code"])
    if "analysis" in intents:
        targets.extend(["microsoft_copilot_studio", "ibm_watsonx_assistant"])
    if "governance" in intents:
        targets.extend(["agentforce_360", "sap_joule", "aws_q_dev"])
    if "mobile" in intents:
        for vendor in mobile_vendors:
            mapped = MOBILE_VENDOR_TARGETS.get(vendor.lower())
            if mapped:
                targets.append(mapped)
    if "ssh" in intents:
        targets.extend(["ssh_remote", "ssh_bastion", "sftp_gateway"])

    filtered = []
    for t in targets:
        if t in SUPPORTED_PLATFORMS and t not in filtered:
            filtered.append(t)
    return filtered


def build_efficiency_plan(payload: Dict[str, Any]) -> Dict[str, Any]:
    goal = str(payload.get("goal") or payload.get("task") or "")
    requested_framework = payload.get("framework")
    mobile_vendors = payload.get("mobile_vendors") or []
    if not isinstance(mobile_vendors, list):
        mobile_vendors = []

    intents = _detect_intents(goal)
    framework = _choose_framework(intents, requested_framework)
    toolchain = _toolchain_for_intents(intents)
    targets = _integration_targets(intents, mobile_vendors)

    parallel_tracks = [
        {"name": "planning", "enabled": True},
        {"name": "execution", "enabled": True},
        {"name": "evaluation", "enabled": True},
    ]
    if "governance" in intents:
        parallel_tracks.append({"name": "governance_gate", "enabled": True})

    return {
        "goal": goal,
        "intents": intents,
        "recommended_framework": framework,
        "toolchain": toolchain,
        "integration_targets": targets,
        "parallel_tracks": parallel_tracks,
        "fallbacks": {
            "framework": "native",
            "platform_dispatch": "skip_unconfigured_targets",
            "toolchain": "minimal_chat_tool",
        },
        "notes": [
            "Use explicit approvals for destructive actions.",
            "Prefer parallel tracks for planning/execution/evaluation to reduce latency.",
        ],
    }
