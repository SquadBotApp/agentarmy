from datetime import datetime, timezone
from typing import Any, Dict, List


SSH_PROFILE_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "linux_server": {
        "port": 22,
        "required_controls": ["host_key_pinning", "least_privilege_user"],
        "recommended_auth": ["ed25519_key", "hardware_key"],
    },
    "network_device": {
        "port": 22,
        "required_controls": ["host_key_pinning", "command_audit"],
        "recommended_auth": ["ed25519_key"],
    },
    "bastion": {
        "port": 22,
        "required_controls": ["mfa_jump_host", "session_recording", "ip_allowlist"],
        "recommended_auth": ["hardware_key", "short_lived_cert"],
    },
}


def _normalize_profiles(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw_profiles = payload.get("profiles", [])
    if not isinstance(raw_profiles, list):
        return []

    profiles: List[Dict[str, Any]] = []
    for item in raw_profiles:
        if not isinstance(item, dict):
            continue
        host = str(item.get("host", "")).strip()
        if not host:
            continue
        profile_type = str(item.get("profile_type", "linux_server")).strip().lower()
        template = SSH_PROFILE_TEMPLATES.get(profile_type, SSH_PROFILE_TEMPLATES["linux_server"])
        auth_mode = str(item.get("auth_mode", "ed25519_key")).strip().lower()
        controls = item.get("controls", [])
        controls = controls if isinstance(controls, list) else []
        merged_controls = sorted(set(template["required_controls"] + [str(c).strip().lower() for c in controls if str(c).strip()]))
        port = int(item.get("port") or template["port"])

        profiles.append(
            {
                "name": str(item.get("name", host)).strip(),
                "host": host,
                "port": port,
                "username": str(item.get("username", "automation")).strip(),
                "profile_type": profile_type,
                "auth_mode": auth_mode,
                "controls": merged_controls,
                "recommended_auth": template["recommended_auth"],
            }
        )
    return profiles


def _risk_flags(profile: Dict[str, Any]) -> List[str]:
    flags: List[str] = []
    auth_mode = profile.get("auth_mode", "")
    controls = set(profile.get("controls", []))

    if auth_mode in {"password", "keyboard-interactive"}:
        flags.append("Password/interactive auth increases compromise risk.")
    if "host_key_pinning" not in controls:
        flags.append("Host key pinning missing; MITM risk elevated.")
    if "session_recording" not in controls and profile.get("profile_type") == "bastion":
        flags.append("Bastion without session recording weakens forensic coverage.")
    if "least_privilege_user" not in controls and profile.get("profile_type") == "linux_server":
        flags.append("Least-privilege service account not explicitly enforced.")
    return flags


def build_ssh_plan(payload: Dict[str, Any]) -> Dict[str, Any]:
    goal = str(payload.get("goal", "SSH integration hardening"))
    profiles = _normalize_profiles(payload)

    analyzed: List[Dict[str, Any]] = []
    high_risk = 0
    for profile in profiles:
        flags = _risk_flags(profile)
        auth_mode = profile.get("auth_mode", "")
        base_score = 0.35 if auth_mode in {"password", "keyboard-interactive"} else 0.2
        password_penalty = 0.2 if auth_mode in {"password", "keyboard-interactive"} else 0.0
        risk_score = min(1.0, base_score + (len(flags) * 0.2) + password_penalty)
        if risk_score >= 0.7:
            high_risk += 1
        analyzed.append(
            {
                **profile,
                "risk_flags": flags,
                "risk_score": round(risk_score, 3),
                "ready": len(flags) == 0,
            }
        )

    actions = [
        "Require key-based auth (ed25519 or short-lived certs) for all production hosts.",
        "Pin host keys and rotate on controlled schedule.",
        "Route privileged automation through bastion with session recording and MFA.",
        "Tag each SSH target with owner/on-call to speed incident response.",
    ]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "goal": goal,
        "profiles": analyzed,
        "summary": {
            "total_profiles": len(analyzed),
            "high_risk_profiles": high_risk,
            "ready_profiles": len([p for p in analyzed if p["ready"]]),
        },
        "recommended_actions": actions,
        "policy_notes": [
            "Use SSH only on authorized infrastructure.",
            "No credential stuffing, brute force, or unauthorized access attempts.",
            "Prefer audited automation channels for command execution.",
        ],
    }
