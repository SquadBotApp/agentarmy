"""
EducationCenter policy model.
"""
from copy import deepcopy

DEFAULT_POLICY_SET = {
    "version": "1.0.0",
    "age_policy": {
        "child_max_age": 12,
        "teen_max_age": 17,
    },
    "restricted_keywords": ["exploit", "malware", "weapon", "fraud", "self-harm", "illegal"],
    "mature_keywords": ["violence", "sexual", "substance", "gambling"],
    "reward_policy": {
        "pass_threshold": 60,
        "base_reward": 10,
        "score_divisor": 10,
    },
    "difficulty_policy": {
        "low_mastery_threshold": 35,
        "high_mastery_threshold": 80,
    },
}


def get_default_policies():
    return deepcopy(DEFAULT_POLICY_SET)


def classify_topic(topic, policies):
    text = str(topic or "").lower()
    restricted = policies.get("restricted_keywords", [])
    mature = policies.get("mature_keywords", [])
    if any(k in text for k in restricted):
        return {"level": "blocked", "reason": "restricted topic"}
    if any(k in text for k in mature):
        return {"level": "mature", "reason": "mature topic"}
    return {"level": "safe", "reason": "no restrictions"}


def age_band(age, policies):
    age_value = int(age or 0)
    if age_value <= 0:
        return "unknown"
    if age_value <= int(policies["age_policy"]["child_max_age"]):
        return "child"
    if age_value <= int(policies["age_policy"]["teen_max_age"]):
        return "teen"
    return "adult"

