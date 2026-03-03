"""
EducationCenter domain package exports.
"""

from .dashboard_stubs import build_action_stubs, build_domain_cards
from .education_center import EducationCenter
from .events import ALL_EVENTS
from .policies import get_default_policies
from .registry import register_education_center

__all__ = [
    "EducationCenter",
    "ALL_EVENTS",
    "get_default_policies",
    "register_education_center",
    "build_domain_cards",
    "build_action_stubs",
]
