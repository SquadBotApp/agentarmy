import logging
from typing import List, Dict, Any
from agentarmy.core.contracts import TaskResult

logger = logging.getLogger(__name__)

class ZPEngine:
    """
    Zero Point Energy (ZPE) Scoring Engine.
    Calculates a unified score for task results based on efficiency, cost, and quality.
    """
    def __init__(self):
        pass

    def score(self, results: List[TaskResult]) -> float:
        """
        Calculates the ZPE score for a list of task results.
        Higher score indicates better performance (lower cost, higher accuracy, lower latency).
        """
        if not results:
            return 0.0

        total_score = 0.0
        for result in results:
            if result.status == 'completed' and result.metrics:
                # Simple scoring formula: accuracy / (cost + epsilon)
                # In a real system, this would be more complex and configurable.
                cost = result.cost_usd if result.cost_usd is not None else 0.001 # Avoid div by zero
                accuracy = result.metrics.accuracy
                
                # ZPE Score = Accuracy / Cost
                total_score += accuracy / cost

        avg_score = total_score / len(results)
        logger.info(f"ZPE Engine: Calculated average score: {avg_score:.2f}")
        return avg_score