"""
KnowledgeAgent: Explains concepts, provides examples, analogies, and step-by-step reasoning.
Adapts complexity based on age and skill level.
"""
class KnowledgeAgent:
    def __init__(self, education_center):
        self.education_center = education_center
        self.name = "knowledge_agent"
        self.event_bus = None

    def attach_event_bus(self, event_bus):
        self.event_bus = event_bus

    def step(self):
        return None

    def shutdown(self):
        return None
    def explain(self, topic, level, style):
        """Return an explanation of the topic at the given level and style."""
        topic_text = str(topic or "general problem solving")
        level_text = str(level or "beginner").lower()
        style_text = str(style or "mixed").lower()
        complexity = {
            "beginner": "simple language and concrete examples",
            "intermediate": "layered concepts with practical tradeoffs",
            "advanced": "deep technical framing with edge cases",
        }.get(level_text, "clear practical framing")
        delivery = {
            "visual": "diagram-oriented explanation",
            "audio": "narrative spoken-style explanation",
            "mixed": "balanced text + examples explanation",
        }.get(style_text, "balanced explanation")
        return {
            "topic": topic_text,
            "level": level_text,
            "style": style_text,
            "summary": f"{topic_text} explained using {complexity} and {delivery}.",
            "steps": [
                f"Define the core concept of {topic_text}.",
                "Work through one practical example.",
                "Contrast one common mistake and fix.",
            ],
        }
