"""
SafetyAgent: Ensures age-appropriate, safe content using the Defensive subsystem.
"""
from .policies import classify_topic


class SafetyAgent:
    def __init__(self, education_center):
        self.education_center = education_center
        self.name = "safety_agent"
        self.event_bus = None

    def attach_event_bus(self, event_bus):
        self.event_bus = event_bus

    def step(self):
        return None

    def shutdown(self):
        return None
    def filter_content(self, content, learner_profile):
        """Return content filtered for safety and age-appropriateness."""
        policies = self.education_center.policies
        topic_safety = classify_topic(content, policies)
        age_band = learner_profile.get("age_band", "unknown")
        blocked = topic_safety["level"] == "blocked"
        needs_approval = topic_safety["level"] == "mature" and age_band in ("child", "teen")
        return {
            "allowed": not blocked and not needs_approval,
            "topic_safety": topic_safety,
            "age_band": age_band,
            "requires_approval": needs_approval,
            "filtered_content": "[FILTERED]" if blocked else content,
        }
