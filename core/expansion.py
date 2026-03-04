import logging
from typing import List, Dict, Any
from .contracts import TaskResult

logger = logging.getLogger(__name__)

class ExpansionManager:
    """
    Decides if the agent pool should be expanded based on performance metrics.
    """
    def __init__(self, performance_threshold: float = 0.9, cooldown_cycles: int = 5):
        if not 0 < performance_threshold <= 1.0:
            raise ValueError("performance_threshold must be between 0 and 1.")
        
        self.performance_threshold = performance_threshold
        self.cooldown_cycles = cooldown_cycles
        self.cycles_since_expansion = cooldown_cycles  # Start ready to expand

    def _calculate_average_performance(self, results: List[TaskResult]) -> float:
        """Calculates average performance from a list of simulation results."""
        if not results:
            return 0.0
        
        total_accuracy = 0
        count = 0
        for result in results:
            # Safely access typed attributes
            if result.status == 'completed' and result.metrics:
                total_accuracy += result.metrics.accuracy
                count += 1
        
        return total_accuracy / count if count > 0 else 0.0

    def should_expand(self, results: List[TaskResult]) -> bool:
        """
        Determines whether to expand the agent pool.
        Returns True if performance is high and cooldown has passed.
        """
        self.cycles_since_expansion += 1

        if self.cycles_since_expansion <= self.cooldown_cycles:
            return False

        avg_performance = self._calculate_average_performance(results)
        if avg_performance >= self.performance_threshold:
            logger.info(f"Performance threshold met ({avg_performance=:.2f}). Recommending expansion.")
            self.cycles_since_expansion = 0  # Reset cooldown
            return True
        
        return False