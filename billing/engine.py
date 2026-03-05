
"""
Billing Engine for AgentArmyOS
Real cost/profit tracking and billing logic.
"""
import logging
from typing import List
try:
    from core.contracts import TaskResult
except ImportError:
    from core.contracts import TaskResult

logger = logging.getLogger(__name__)

class BillingEngine:
    def __init__(self):
        self.usage_log: List[TaskResult] = []
        self.total_cost = 0.0

    def record_usage(self, results: List[TaskResult]):
        """Records usage from a list of task results and updates total cost."""
        for result in results:
            if result.cost_usd is not None and result.cost_usd > 0:
                self.usage_log.append(result)
                self.total_cost += result.cost_usd
        
        logger.info(f"Billing: Recorded {len(results)} results. Total cost is now ${self.total_cost:.6f}")

    def total_billed(self) -> float:
        """Returns the total accumulated cost."""
        return self.total_cost
