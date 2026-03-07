"""
medical_classifier.py
Detects and flags medical content in prompts. Returns risk level: 'safe', 'unsafe', or 'ambiguous'.
"""
import re
from typing import Literal

RiskLevel = Literal['safe', 'unsafe', 'ambiguous']

SAFE_KEYWORDS = [
    'faint', 'bleeding', 'chest pain', 'first aid', 'burn', 'sprain', 'CPR', 'choking', 'allergic reaction',
]
UNSAFE_KEYWORDS = [
    'surgery', 'incision', 'cut open', 'stitch', 'inject', 'prescribe', 'diagnose', 'medication', 'improvised tool',
    'remove object', 'tourniquet', 'amputate', 'operate', 'self-harm', 'overdose', 'poison', 'sew', 'suture',
]


def classify_medical_prompt(prompt: str) -> RiskLevel:
    prompt_lc = prompt.lower()
    if any(word in prompt_lc for word in UNSAFE_KEYWORDS):
        return 'unsafe'
    if any(word in prompt_lc for word in SAFE_KEYWORDS):
        return 'safe'
    # If medical terms detected but not clearly safe/unsafe, return ambiguous
    if re.search(r'\b(pain|collapse|confusion|severe|emergency|doctor|hospital)\b', prompt_lc):
        return 'ambiguous'
    return 'safe'  # Default to safe if no medical content detected
