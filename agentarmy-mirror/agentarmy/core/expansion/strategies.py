"""
Expansion strategies: defines 3-way, 6-way, 9-way branching templates.
"""

from __future__ import annotations

from typing import List, Dict, Any
from enum import Enum


class BranchStrategy(str, Enum):
    """Branching strategy types"""
    
    AGGRESSIVE = "aggressive"
    BALANCED = "balanced"
    CONSERVATIVE = "conservative"
    ANALYTICAL = "analytical"
    CREATIVE = "creative"
    VALIDATOR = "validator"
    OPTIMIZER = "optimizer"
    RISK_TAKER = "risk_taker"
    SAFETY_FIRST = "safety_first"


class ExpansionStrategies:
    """
    Defines 3-way, 6-way, and 9-way branching templates.
    Each template is a list of strategies to apply in parallel.
    """
    
    @staticmethod
    def three_way() -> List[BranchStrategy]:
        """
        3-way expansion: balanced coverage
        - Aggressive: take risks, try novel approaches
        - Balanced: moderate approach, standard practices
        - Conservative: safe, proven methods
        """
        return [
            BranchStrategy.AGGRESSIVE,
            BranchStrategy.BALANCED,
            BranchStrategy.CONSERVATIVE,
        ]
    
    @staticmethod
    def six_way() -> List[BranchStrategy]:
        """
        6-way expansion: comprehensive coverage
        - Aggressive: novel, high-risk approaches
        - Analytical: data-driven, systematic
        - Creative: unconventional, exploratory
        - Balanced: standard mixed approach
        - Validator: verification, testing-focused
        - Conservative: proven, low-risk
        """
        return [
            BranchStrategy.AGGRESSIVE,
            BranchStrategy.ANALYTICAL,
            BranchStrategy.CREATIVE,
            BranchStrategy.BALANCED,
            BranchStrategy.VALIDATOR,
            BranchStrategy.CONSERVATIVE,
        ]
    
    @staticmethod
    def nine_way() -> List[BranchStrategy]:
        """
        9-way expansion: maximum parallel exploration
        - Aggressive approaches: AGGRESSIVE, RISK_TAKER
        - Analytical approaches: ANALYTICAL, VALIDATOR, OPTIMIZER
        - Conservative approaches: CONSERVATIVE, SAFETY_FIRST
        - Balanced approaches: BALANCED, CREATIVE
        """
        return [
            BranchStrategy.AGGRESSIVE,
            BranchStrategy.RISK_TAKER,
            BranchStrategy.ANALYTICAL,
            BranchStrategy.OPTIMIZER,
            BranchStrategy.VALIDATOR,
            BranchStrategy.BALANCED,
            BranchStrategy.CREATIVE,
            BranchStrategy.CONSERVATIVE,
            BranchStrategy.SAFETY_FIRST,
        ]
    
    @staticmethod
    def get_strategy_config(strategy: BranchStrategy) -> Dict[str, Any]:
        """
        Get configuration parameters for a specific strategy.
        Controls temperature, risk level, provider selection.
        """
        
        configs = {
            BranchStrategy.AGGRESSIVE: {
                "temperature": 0.9,
                "risk_level": "high",
                "provider_preference": "experimental",
                "description": "Novel, high-risk exploration",
            },
            BranchStrategy.BALANCED: {
                "temperature": 0.7,
                "risk_level": "medium",
                "provider_preference": "balanced",
                "description": "Standard mixed approach",
            },
            BranchStrategy.CONSERVATIVE: {
                "temperature": 0.4,
                "risk_level": "low",
                "provider_preference": "proven",
                "description": "Proven, low-risk methods",
            },
            BranchStrategy.ANALYTICAL: {
                "temperature": 0.5,
                "risk_level": "low",
                "provider_preference": "analytical",
                "description": "Data-driven, systematic",
            },
            BranchStrategy.CREATIVE: {
                "temperature": 0.85,
                "risk_level": "high",
                "provider_preference": "experimental",
                "description": "Unconventional, exploratory",
            },
            BranchStrategy.VALIDATOR: {
                "temperature": 0.3,
                "risk_level": "low",
                "provider_preference": "proven",
                "description": "Verification and testing focused",
            },
            BranchStrategy.OPTIMIZER: {
                "temperature": 0.6,
                "risk_level": "medium",
                "provider_preference": "balanced",
                "description": "Performance optimization",
            },
            BranchStrategy.RISK_TAKER: {
                "temperature": 0.95,
                "risk_level": "very_high",
                "provider_preference": "experimental",
                "description": "Extreme risk-taking",
            },
            BranchStrategy.SAFETY_FIRST: {
                "temperature": 0.2,
                "risk_level": "very_low",
                "provider_preference": "proven",
                "description": "Maximum safety priority",
            },
        }
        
        return configs.get(strategy, configs[BranchStrategy.BALANCED])
