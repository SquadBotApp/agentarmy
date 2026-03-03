"""
Base class for EducationCenter agents.
"""
from abc import ABC, abstractmethod

class EducationAgent(ABC):
    """Abstract base class for all EducationCenter agents."""
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def run(self, *args, **kwargs):
        pass
