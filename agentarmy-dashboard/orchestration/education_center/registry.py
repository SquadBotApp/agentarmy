"""
Registration wiring for EducationCenter domain.
"""
from typing import Any

from .education_center import EducationCenter


def register_education_center(runtime: Any):
    """
    Attach EducationCenter to a runtime object.
    Expects runtime to optionally expose:
    - register_domain(name, domain)
    - register_agent(name, agent)
    - event_bus.publish(...)
    """
    domain = EducationCenter(runtime)
    domain.bootstrap()
    return domain

