"""
Bounded Logistic Growth Governor for AgentArmyOS
Blueprint: Controls agent/task population growth using logistic curve.
"""
from typing import List, Any
import math

class BoundedGrowthGovernor:
    def __init__(self, max_population: int = 100):
        self.max_population = max_population

    def next_population(self, current: int, rate: float = 0.2) -> int:
        # Logistic growth: dN/dt = rN(1 - N/K)
        next_n = current + rate * current * (1 - current / self.max_population)
        return min(self.max_population, max(1, int(next_n)))
