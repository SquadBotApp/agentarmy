"""
Branch representation: a single parallel execution path.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List
from datetime import datetime

from .strategies import BranchStrategy


@dataclass
class Branch:
    """
    Represents a single parallel branch in expansion.
    Each branch has a unique role, provider, and execution plan.
    """
    
    branch_id: str
    strategy: BranchStrategy
    role: str  # e.g., "analyst", "optimizer", "validator"
    provider: str  # e.g., "openai", "claude"
    temperature: float
    risk_level: str
    task_prompt: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    # Results (filled after execution)
    result: str = ""
    success: bool = False
    latency_ms: float = 0.0
    cost_usd: float = 0.0
    zpe_score: float = 0.0
    executed_at: datetime | None = None


class BranchFactory:
    """Factory for creating branches from strategies."""
    
    def __init__(self, providers: List[str] | None = None):
        self.providers = providers or ["openai", "claude"]
        self.branch_counter = 0
    
    def create_branches(
        self,
        strategies: List[BranchStrategy],
        base_task: str,
        role_map: Dict[BranchStrategy, str] | None = None
    ) -> List[Branch]:
        """
        Create a list of branches from strategies.
        Each branch gets a unique ID, strategy, role, and provider assignment.
        """
        
        branches = []
        
        for strategy in strategies:
            self.branch_counter += 1
            
            # Get role from mapping or default
            role = (role_map or {}).get(strategy, strategy.value)
            
            # Round-robin provider assignment
            provider = self.providers[self.branch_counter % len(self.providers)]
            
            # Import here to avoid circular imports
            from .strategies import ExpansionStrategies
            config = ExpansionStrategies.get_strategy_config(strategy)
            
            branch = Branch(
                branch_id=f"branch_{self.branch_counter}",
                strategy=strategy,
                role=role,
                provider=provider,
                temperature=config["temperature"],
                risk_level=config["risk_level"],
                task_prompt=self._adjust_prompt(base_task, strategy, config),
                metadata={
                    "strategy_description": config["description"],
                    "provider_preference": config["provider_preference"],
                },
            )
            
            branches.append(branch)
        
        return branches
    
    def _adjust_prompt(
        self,
        base_task: str,
        strategy: BranchStrategy,
        config: Dict[str, Any]
    ) -> str:
        """
        Adjust task prompt based on strategy.
        Adds instructions to influence approach without changing core task.
        """
        
        strategy_instructions = {
            BranchStrategy.AGGRESSIVE: "\n[Instruction: Be bold and creative. Take risks. Explore novel solutions.]",
            BranchStrategy.BALANCED: "\n[Instruction: Use balanced, proven approaches. Moderate risk.]",
            BranchStrategy.CONSERVATIVE: "\n[Instruction: Prioritize safety and proven methods. Minimize risk.]",
            BranchStrategy.ANALYTICAL: "\n[Instruction: Use data-driven analysis. Show your reasoning step by step.]",
            BranchStrategy.CREATIVE: "\n[Instruction: Think creatively. Explore unconventional approaches.]",
            BranchStrategy.VALIDATOR: "\n[Instruction: Focus on verification and testing. Validate thoroughly.]",
            BranchStrategy.OPTIMIZER: "\n[Instruction: Optimize for efficiency and performance.]",
            BranchStrategy.RISK_TAKER: "\n[Instruction: Take extreme risks. Explore the boundaries.]",
            BranchStrategy.SAFETY_FIRST: "\n[Instruction: Prioritize absolute safety above all else.]",
        }
        
        instruction = strategy_instructions.get(strategy, "")
        return base_task + instruction
