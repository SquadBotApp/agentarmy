"""
3-6-9 Expansion Engine: Controlled parallel task expansion and collapse
"""

from .signals import ExpansionSignals, ExpansionLevel
from .strategies import ExpansionStrategies, BranchStrategy
from .branch import Branch, BranchFactory
from .collapse import CollapseEngine, VotingEngine

# Backward compatibility: ExpansionManager alias for ExpansionEngine
from .expansion_engine import ExpansionEngine
from .manager import ExpansionManager

__all__ = [
    "ExpansionSignals",
    "ExpansionLevel",
    "ExpansionStrategies",
    "BranchStrategy",
    "Branch",
    "BranchFactory",
    "CollapseEngine",
    "VotingEngine",
    "ExpansionEngine",
    "ExpansionManager",
]
