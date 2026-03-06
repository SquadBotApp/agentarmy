
import logging
from typing import List, Dict, Any
from ..contracts import TaskResult

logger = logging.getLogger(__name__)

class ExpansionManager:
    """
    Decides if the agent pool should be expanded based on performance metrics.
    """
    def __init__(self, performance_threshold: float = 0.9, cooldown_cycles: int = 5, last_results: List = None, average_score: float = 0.0):
        if not 0 < performance_threshold <= 1.0:
            raise ValueError("performance_threshold must be between 0 and 1.")
        self.performance_threshold = performance_threshold
        self.cooldown_cycles = cooldown_cycles
        self.cycles_since_expansion = cooldown_cycles  # Start ready to expand
        self.total_expansions = 0
        self.expansion_pattern = [3, 6, 9]  # 3-6-9 expansion logic
        self.last_results = last_results or []
        self.average_score = average_score

    @property
    def all_success(self) -> bool:
        """Check if all last_results have status 'success'."""
        if not self.last_results:
            return True
        return all(getattr(r, 'status', None) == 'success' for r in self.last_results)

    def should_expand(self, results: List = None) -> bool:
        """
        Determines whether to expand the agent pool using 3-6-9 logic.
        Returns True if performance is high and cooldown has passed.
        """
        # Update last_results if provided
        if results is not None:
            self.last_results = results
        
        self.cycles_since_expansion += 1
        if self.cycles_since_expansion <= self.cooldown_cycles:
            return False
        
        # Check all_success OR positive average_score
        if self.all_success or self.average_score > 0:
            logger.info(f"Performance threshold met ({self.average_score=:.2f}, all_success={self.all_success}). Recommending expansion.")
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
            if status == 'completed' and metrics:
                accuracy = getattr(metrics, 'accuracy', 0)
                if accuracy:
                    total_accuracy += accuracy
                    count += 1
        
        return total_accuracy / count if count > 0 else 0.0

    def get_expansion_count(self) -> int:
        """
        Returns the number of agents to add based on the 3-6-9 pattern and expansion round.
        Returns 2 if all_success is True or average_score > 0, otherwise 0.
        """
        if self.all_success or self.average_score > 0:
            return 2
        return 0

