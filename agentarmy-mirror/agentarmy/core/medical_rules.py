"""
medical_rules.py
Encodes explicit rules for handling medical prompts based on risk level.
"""
from .medical_classifier import classify_medical_prompt, RiskLevel


def medical_policy_decision(prompt: str) -> dict:
    """
    Returns a decision dict:
      - action: 'allow', 'override', or 'block'
      - reason: explanation
    """
    risk: RiskLevel = classify_medical_prompt(prompt)
    if risk == 'safe':
        return {'action': 'allow', 'reason': 'Prompt is safe first-aid.'}
    if risk == 'unsafe':
        return {'action': 'override', 'reason': 'Prompt is unsafe/invasive. Override with safe guidance.'}
    if risk == 'ambiguous':
        return {'action': 'override', 'reason': 'Prompt is ambiguous. Treat as unsafe and override.'}
    return {'action': 'block', 'reason': 'Unknown risk. Block by default.'}
