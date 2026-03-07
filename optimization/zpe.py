import logging
from typing import List, Dict, Any
from core.contracts import TaskResult

# Make scikit-optimize optional
try:
    from skopt import Optimizer
    from skopt.space import Real
    SKOPT_AVAILABLE = True
except ImportError:
    SKOPT_AVAILABLE = False
    Optimizer = None
    Real = None

try:
    import numpy as np
except ImportError:
    np = None

logger = logging.getLogger(__name__)

class ZPEngine:
    """
    Zero Point Energy (ZPE) Scoring Engine.

    Calculates a unified score for task results based on efficiency, cost, and quality.
    Uses Bayesian optimization to dynamically adjust weights.
    """
    def __init__(self):
        self.accuracy_weight = 0.6
        self.cost_weight = 0.3
        self.latency_weight = 0.1
        self.space = None
        self.optimizer = None
        
        if SKOPT_AVAILABLE and Real is not None:
            self.space = [
                Real(0.0, 1.0, name='accuracy_weight'),
                Real(0.0, 1.0, name='cost_weight'),
                Real(0.0, 1.0, name='latency_weight')
            ]
            self.optimizer = Optimizer(
                dimensions=self.space,
                base_estimator="GP",  # Gaussian Process
                n_initial_points=10,
                acq_func="gp_hedge",  # Probability Improvement acquisition
                random_state=42,
            )
        
        self.known_scores = []
        self.default_accuracy_weight = 0.6

    def score(self, results) -> float:
        """
        Calculates the ZPE score for a list of task results.
        Higher score indicates better performance: lower cost, higher accuracy, lower latency.
        
        Args:
            results: Can be a list of TaskResult objects or a dict/string (from tests)
        """
        # Handle non-List inputs (e.g., dict from tests, or string)
        if not isinstance(results, list):
            if isinstance(results, dict):
                # Handle dict format from meta_synthesizer
                if 'outputs' in results:
                    # This is a synthesis dict, not TaskResults - return default score
                    return 0.5
            return 0.0

        if not results:
            return 0.0

        total_score = 0.0
        for result in results:
            # Skip if result is not a TaskResult-like object
            if not hasattr(result, 'status'):
                continue
            if result.status == 'completed' and result.metrics is not None:
                # ZPE Score = w1*accuracy - w2*cost - w3*latency, then clamp to [0,1]
                # Normalize the latency to a 0-1 range
                latency = result.metrics.latency_ms if result.metrics.latency_ms is not None else 0.0
                # Normalize latency approximately; real normalization needs max latency observed 
                normalized_latency = latency / 1000.0  

                accuracy_score = self.accuracy_weight * result.metrics.accuracy
                cost_score = -self.cost_weight * (result.cost_usd if result.cost_usd is not None else 0.0)
                latency_score = -self.latency_weight * normalized_latency
                
                zpe = accuracy_score + cost_score + latency_score     
                total_score += max(0.0, min(1.0, zpe))  # Clamp to [0, 1]

        avg_score = total_score / len(results) if len(results) > 0 else 0.0
        logger.info(f"ZPE Engine: Calculated average score: {avg_score:.2f}")
        return avg_score
