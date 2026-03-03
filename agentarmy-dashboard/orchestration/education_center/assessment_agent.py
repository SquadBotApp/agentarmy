"""
AssessmentAgent: Creates quizzes, tests, challenges, and coding exercises. Evaluates mastery and identifies weaknesses.
"""
class AssessmentAgent:
    def __init__(self, education_center):
        self.education_center = education_center
        self.name = "assessment_agent"
        self.event_bus = None

    def attach_event_bus(self, event_bus):
        self.event_bus = event_bus

    def step(self):
        return None

    def shutdown(self):
        return None
    def assess(self, topic):
        """Return an assessment for the topic and learner."""
        topic_text = str(topic or "general problem solving")
        return {
            "topic": topic_text,
            "questions": [
                f"What is the primary principle behind {topic_text}?",
                f"Apply {topic_text} to one practical scenario.",
                f"Identify one failure mode when using {topic_text}.",
            ],
            "rubric": {
                "accuracy": 0.4,
                "reasoning": 0.35,
                "application": 0.25,
            },
        }

    def score_submission(self, submission):
        raw = float((submission or {}).get("score", 0))
        return max(0, min(100, int(raw)))
