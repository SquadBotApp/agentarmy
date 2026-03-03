"""
Runtime hooks binding EducationCenter to Defensive/Governance/Economic/Swarm domains.
"""
from typing import Dict, Any


class EducationRuntimeHooks:
    def __init__(self, runtime):
        self.runtime = runtime

    def defensive_check(self, topic_safety: Dict[str, Any], learner_profile: Dict[str, Any]) -> Dict[str, Any]:
        if topic_safety.get("level") == "blocked":
            return {"allowed": False, "reason": "defensive_block"}
        return {"allowed": True, "reason": "defensive_allow"}

    def governance_check(self, topic_safety: Dict[str, Any], learner_profile: Dict[str, Any]) -> Dict[str, Any]:
        age_band = learner_profile.get("age_band")
        if age_band in ("child", "teen") and topic_safety.get("level") == "mature":
            return {"allowed": False, "reason": "governance_parent_teacher_approval_required"}
        return {"allowed": True, "reason": "governance_allow"}

    def economic_reward(self, score: int, reward_policy: Dict[str, Any]) -> int:
        threshold = int(reward_policy.get("pass_threshold", 60))
        if score < threshold:
            return 0
        base_reward = int(reward_policy.get("base_reward", 10))
        score_divisor = max(1, int(reward_policy.get("score_divisor", 10)))
        return base_reward + int(score / score_divisor)

    def swarm_teaching_plan(self, topic: str, level: str) -> Dict[str, Any]:
        return {
            "topic": topic,
            "level": level,
            "agents": [
                "knowledge_agent",
                "curriculum_agent",
                "assessment_agent",
                "simulation_agent",
                "learning_style_agent",
                "progress_agent",
            ],
            "strategy": "collaborative-teaching-team",
        }

