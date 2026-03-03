from datetime import datetime, timezone
from typing import Any, Dict, List


SOCIAL_PROFILE_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "x": {
        "purpose": "realtime alerts and sentiment",
        "recommended_fields": ["handle", "keywords", "watchlists"],
    },
    "linkedin": {
        "purpose": "professional updates and partnership signals",
        "recommended_fields": ["company_page", "industry_topics", "hiring_signals"],
    },
    "github": {
        "purpose": "technical release intelligence",
        "recommended_fields": ["org", "repositories", "security_advisories"],
    },
    "youtube": {
        "purpose": "long-form commentary and product launches",
        "recommended_fields": ["channel", "topic_tags"],
    },
    "reddit": {
        "purpose": "community-level trend detection",
        "recommended_fields": ["subreddits", "query_terms"],
    },
    "discord": {
        "purpose": "community operations and incident chatter",
        "recommended_fields": ["server", "channels", "alert_terms"],
    },
}

ALLOWED_SOURCE_TYPES = {"official", "newsroom", "developer", "community", "third_party_analysis"}


def _clamp(value: float, min_v: float, max_v: float) -> float:
    return max(min_v, min(max_v, value))


def _score_signal(signal: Dict[str, Any]) -> Dict[str, Any]:
    source_type = str(signal.get("source_type", "community")).strip().lower()
    verified = bool(signal.get("verified", False))
    corroboration_count = int(signal.get("corroboration_count", 0) or 0)
    evidence_quality = float(signal.get("evidence_quality", 0.5) or 0.5)
    recency_hours = float(signal.get("recency_hours", 24.0) or 24.0)

    type_weight = {
        "official": 1.0,
        "newsroom": 0.9,
        "developer": 0.8,
        "third_party_analysis": 0.7,
        "community": 0.6,
    }.get(source_type, 0.45)
    verification_weight = 0.15 if verified else 0.0
    corroboration_weight = _clamp(corroboration_count / 8.0, 0.0, 0.25)
    evidence_weight = _clamp(evidence_quality, 0.0, 1.0) * 0.25
    recency_weight = _clamp((96.0 - recency_hours) / 96.0, 0.0, 1.0) * 0.1

    score = _clamp(type_weight * 0.5 + verification_weight + corroboration_weight + evidence_weight + recency_weight, 0.0, 1.0)
    is_credible = score >= 0.72

    return {
        "source": signal.get("source", "unknown"),
        "claim": signal.get("claim", ""),
        "source_type": source_type,
        "score": round(score, 3),
        "credible": is_credible,
        "reasoning": [
            f"source_type={source_type}",
            f"verified={verified}",
            f"corroboration_count={corroboration_count}",
            f"evidence_quality={round(_clamp(evidence_quality, 0.0, 1.0), 2)}",
            f"recency_hours={round(max(recency_hours, 0.0), 1)}",
        ],
    }


def _normalize_profiles(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    profiles = payload.get("profiles", [])
    if not isinstance(profiles, list):
        return []

    normalized: List[Dict[str, Any]] = []
    for item in profiles:
        if not isinstance(item, dict):
            continue
        platform = str(item.get("platform", "")).strip().lower()
        if not platform:
            continue
        template = SOCIAL_PROFILE_TEMPLATES.get(platform, {
            "purpose": "custom intelligence feed",
            "recommended_fields": ["handle", "keywords"],
        })
        normalized.append(
            {
                "platform": platform,
                "handle": str(item.get("handle", "")).strip(),
                "mode": str(item.get("mode", "monitor")).strip().lower(),
                "purpose": item.get("purpose") or template["purpose"],
                "recommended_fields": template["recommended_fields"],
            }
        )
    return normalized


def build_social_intel(payload: Dict[str, Any]) -> Dict[str, Any]:
    profiles = _normalize_profiles(payload)
    raw_signals = payload.get("signals", [])
    signals = raw_signals if isinstance(raw_signals, list) else []

    scored_signals = [_score_signal(s) for s in signals if isinstance(s, dict)]
    credible_signals = [s for s in scored_signals if s["credible"]]
    low_confidence = [s for s in scored_signals if not s["credible"]]

    rejected_source_types = [
        str(s.get("source_type", "unknown")).strip().lower()
        for s in signals
        if isinstance(s, dict) and str(s.get("source_type", "")).strip().lower() not in ALLOWED_SOURCE_TYPES
    ]

    defense_actions = [
        "Escalate claims with score < 0.72 to human review before automation.",
        "Prioritize official/developer sources for incident response decisions.",
        "Trigger connector quarantine if 3+ low-confidence claims come from a single source in 24h.",
    ]
    learning_updates = [
        "Persist credibility outcomes to improve source weighting.",
        "Track false-positive and false-negative rates per source_type.",
        "Update watchlists weekly from top credible signals.",
    ]

    avg_score = round(sum(s["score"] for s in scored_signals) / len(scored_signals), 3) if scored_signals else 0.0

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "goal": str(payload.get("goal", "social intelligence analysis")),
        "profiles": profiles,
        "credibility_summary": {
            "total_signals": len(scored_signals),
            "credible_count": len(credible_signals),
            "low_confidence_count": len(low_confidence),
            "average_score": avg_score,
        },
        "credible_signals": credible_signals[:20],
        "low_confidence_signals": low_confidence[:20],
        "defense_actions": defense_actions,
        "learning_updates": learning_updates,
        "policy_notes": [
            "Only analyze authorized/public signals.",
            "Do not ingest private messages or bypass platform restrictions.",
            f"Rejected source types (if any): {sorted(set(rejected_source_types))}",
        ],
    }
