"""
ProgressAgent: Tracks mastery levels, completed lessons, strengths/weaknesses, and recommends next steps.
"""
class ProgressAgent:
    def __init__(self, education_center):
        self.education_center = education_center
        self.name = "progress_agent"
        self.event_bus = None

    def attach_event_bus(self, event_bus):
        self.event_bus = event_bus

    def step(self):
        return None

    def shutdown(self):
        return None
    def track(self, learner_profile):
        """Return progress and recommendations for the learner."""
        mastery = int((learner_profile or {}).get("mastery", 0))
        sessions = int((learner_profile or {}).get("completed_sessions", 0))
        if mastery < 35:
            next_step = "reinforce_foundations"
        elif mastery < 80:
            next_step = "advance_guided_practice"
        else:
            next_step = "unlock_advanced_challenges"
        return {
            "mastery": max(0, min(100, mastery)),
            "completed_sessions": max(0, sessions),
            "next_step": next_step,
        }
