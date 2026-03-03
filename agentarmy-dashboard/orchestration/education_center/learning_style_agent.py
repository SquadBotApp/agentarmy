"""
LearningStyleAgent: Analyzes and adapts to the user's learning style, pacing, and preferred formats.
"""
class LearningStyleAgent:
    def __init__(self, education_center):
        self.education_center = education_center
        self.name = "learning_style_agent"
        self.event_bus = None

    def attach_event_bus(self, event_bus):
        self.event_bus = event_bus

    def step(self):
        return None

    def shutdown(self):
        return None
    def adapt(self, learner_profile, feedback):
        """Adjust teaching strategy based on feedback and profile."""
        profile = dict(learner_profile or {})
        mastery = int(profile.get("mastery", 0))
        confusion = bool((feedback or {}).get("confused"))
        if confusion or mastery < 35:
            pace = "slower"
            difficulty_shift = "down"
        elif mastery > 80:
            pace = "faster"
            difficulty_shift = "up"
        else:
            pace = "steady"
            difficulty_shift = "steady"
        style = profile.get("style", "mixed")
        return {
            "style": style,
            "pace": pace,
            "difficulty_shift": difficulty_shift,
            "recommended_format": "diagram+examples" if style == "visual" else "text+practice",
        }
