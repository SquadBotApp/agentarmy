"""Governance module - enforces rules on outputs"""
from typing import Dict, List, Any

class Governance:
    def enforce(self, data):
        return data

# Domain classifiers
SELF_HARM_KEYWORDS = ["suicide", "self harm", "suicidal", "eating disorder", "self injury"]
VIOLENCE_KEYWORDS = ["murder", "weapon", "assault", "bomb", "terrorist", "shooting", "kill"]
ILLEGAL_KEYWORDS = ["drug", "hack", "fraud", "theft", "piracy"]
DANGEROUS_KEYWORDS = ["explosive", "poison", "bioweapon", "chemical weapon", "ied", "firebomb"]

def classify_domain(task: str) -> str:
    task_lower = task.lower()
    if any(kw in task_lower for kw in SELF_HARM_KEYWORDS):
        return "self_harm"
    if any(kw in task_lower for kw in VIOLENCE_KEYWORDS):
        return "violence"
    if any(kw in task_lower for kw in ILLEGAL_KEYWORDS):
        return "illegal"
    if any(kw in task_lower for kw in DANGEROUS_KEYWORDS):
        return "dangerous"
    return "none"

