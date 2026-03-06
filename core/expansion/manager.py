
import logging
from typing import List, Dict, Any
from ..contracts import TaskResult

logger = logging.getLogger(__name__)

class ExpansionManager:
    """
    Decides if the agent pool should be expanded based on performance metrics.
    Implements the 3-6-9-12-15-18 recursive expansion strategy for exponential scaling.
    
    ARMY PHILOSOPHY: "Failing a battle doesn't mean losing the war"
    - Partial successes are victories
    - Failed agents contribute to learning
    - The army wins through combined effort
    - Scale to 100-200+ agents for complex problems
    """
    def __init__(self, performance_threshold: float = 0.5, cooldown_cycles: int = 3, last_results: List = None, average_score: float = 0.0, max_agents: int = 200):
        if not 0 < performance_threshold <= 1.0:
            raise ValueError("performance_threshold must be between 0 and 1.")
        self.performance_threshold = performance_threshold
        self.cooldown_cycles = cooldown_cycles
        self.cycles_since_expansion = cooldown_cycles  # Start ready to expand
        self.total_expansions = 0
        self.max_agents = max_agents  # Cap at 200+ agents
        
        # Extended 3-6-9-12-15-18 pattern for exponential agent growth up to 200+
        # Pattern: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60...
        self.expansion_pattern = []
        for i in range(1, 70):  # Generate up to 60+ expansions
            self.expansion_pattern.append(3 * i)
        
        self.last_results = last_results or []
        self.average_score = average_score

    @property
    def all_success(self) -> bool:
        """Check if all last_results have status 'success'."""
        if not self.last_results:
            return True
        return all(getattr(r, 'status', None) == 'success' for r in self.last_results)

    @property
    def has_failures(self) -> bool:
        """Check if any tasks failed - these become learning opportunities."""
        if not self.last_results:
            return False
        return any(getattr(r, 'status', None) in ('failed', 'error') for r in self.last_results)

    @property
    def success_rate(self) -> float:
        """Calculate success rate from results."""
        if not self.last_results:
            return 1.0
        success_count = sum(1 for r in self.last_results if getattr(r, 'status', None) in ('success', 'completed'))
        return success_count / len(self.last_results)

    def should_expand(self, results: List = None) -> bool:
        """
        Determines whether to expand the agent pool using 3-6-9 logic.
        Returns True if performance is high OR if we have failures that can drive learning.
        The army wins through combined effort - partial success is still progress.
        """
        # Update last_results if provided
        if results is not None:
            self.last_results = results
            # Update average score
            self.average_score = self._calculate_average_performance(results)
        
        self.cycles_since_expansion += 1
        if self.cycles_since_expansion <= self.cooldown_cycles:
            return False
        
        # Expand if: high success rate OR we have failures (learning opportunities)
        # The army grows stronger through both success AND failure
        should_grow = self.success_rate >= 0.5 or self.has_failures
        
        if should_grow:
            logger.info(f"Expansion recommended: success_rate={self.success_rate:.2f}, has_failures={self.has_failures}, avg_score={self.average_score:.2f}")
            self.cycles_since_expansion = 0  # Reset cooldown
            self.total_expansions += 1
            return True
        return False

    def _calculate_average_performance(self, results: List) -> float:
        """Calculates average performance from a list of simulation results."""
        if not results:
            return 0.0
        
        total_accuracy = 0
        count = 0
        for result in results:
            # Safely access typed attributes using getattr
            status = getattr(result, 'status', None)
            metrics = getattr(result, 'metrics', None)
            if status in ('completed', 'success') and metrics:
                accuracy = getattr(metrics, 'accuracy', 0)
                if accuracy:
                    total_accuracy += accuracy
                    count += 1
            # Also count failed tasks as learning opportunities (partial contribution)
            elif status in ('failed', 'error'):
                count += 1
                total_accuracy += 0.1  # Give partial credit for attempted work
        
        return total_accuracy / count if count > 0 else 0.0

    def get_expansion_count(self, current_agent_count: int = 0) -> int:
        """
        Returns the number of agents to add based on the 3-6-9-12-15-18 pattern.
        Cycles through the pattern based on total_expansions count.
        Respects max_agents cap (default 200).
        
        ARMY PHILOSOPHY: Keep expanding until we hit max capacity.
        A failing agent isn't wrong - it just means that agent can't solve it alone.
        The army wins through combined effort.
        """
        # If we've reached max agents, don't expand further
        if current_agent_count >= self.max_agents:
            logger.info(f"Max agent capacity reached: {self.max_agents}. Army is ready for battle!")
            return 0
        
        if self.success_rate >= 0.5 or self.has_failures:
            # Get the expansion count from the pattern, cycling through
            pattern_index = (self.total_expansions - 1) % len(self.expansion_pattern)
            
            # Calculate how many we can still add
            agents_remaining = self.max_agents - current_agent_count
            
            # First expansion uses index 0 (3 agents), second uses index 1 (6 agents), etc.
            if self.total_expansions <= 1:
                expansion = 3
            else:
                expansion = self.expansion_pattern[pattern_index]
            
            # Cap expansion to not exceed max_agents
            expansion = min(expansion, agents_remaining)
            
            logger.info(f"ARMY EXPANSION: Adding {expansion} agents (total: {current_agent_count + expansion}/{self.max_agents})")
            return expansion
        
        return 0

