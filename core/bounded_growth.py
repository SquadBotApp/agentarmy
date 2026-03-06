"""
Bounded Logistic Growth Governor for AgentArmyOS
Blueprint: Controls agent/task population growth using logistic curve.
Allows rapid scaling to 100-200 agents for the 3-6-9-12-15-18+ expansion strategy.
"""
from typing import List, Any
import math

class BoundedGrowthGovernor:
    def __init__(self, max_population: int = 200):
        self.max_population = max_population

    def next_population(self, current: int, rate: float = 0.5) -> int:
        """
        Logistic growth: dN/dt = rN(1 - N/K)
        Higher rate (0.5) allows faster growth to reach 200 agents quickly.
        This supports the 3-6-9-12-15-18 expansion strategy.
        """
        if current >= self.max_population:
            return self.max_population
        # Aggressive growth formula for army expansion
        next_n = current + rate * current * (1 - current / self.max_population)
        return min(self.max_population, max(current + 1, int(next_n)))
