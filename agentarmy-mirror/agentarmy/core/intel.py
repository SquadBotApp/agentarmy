import logging
from typing import List, Dict, Any
from .contracts import TaskResult

logger = logging.getLogger(__name__)

class CompetitiveIntelligence:
    """
    Analyzes execution results and external data to gather competitive intelligence.
    """
    def __init__(self):
        self.provider_history: Dict[str, List[Dict[str, float]]] = {}

    def gather_intel(self, results: List[TaskResult]) -> Dict[str, Any]:
        logger.info("Gathering competitive intelligence from task results...")
        
        # Update history from the latest results
        for result in results:
            if result.provider_name and result.cost_usd is not None and result.metrics:
                if result.provider_name not in self.provider_history:
                    self.provider_history[result.provider_name] = []
                self.provider_history[result.provider_name].append({'cost': result.cost_usd, 'accuracy': result.metrics.accuracy})

        # Analyze historical data to find best provider by cost
        avg_costs = {
            provider: sum(h['cost'] for h in history) / len(history)
            for provider, history in self.provider_history.items() if history
        }

        # Calculate stats for the current cycle
        total_cost = sum(r.cost_usd for r in results if r.cost_usd is not None)
        avg_accuracy = 0.0
        completed_count = sum(1 for r in results if r.status == 'completed' and r.metrics)
        if completed_count > 0:
            avg_accuracy = sum(r.metrics.accuracy for r in results if r.status == 'completed' and r.metrics) / completed_count

        # Logic to recommend a provider switch based on cost analysis
        recommended_action = "maintain_current_provider"
        cheapest_provider = min(avg_costs, key=avg_costs.get) if avg_costs else None

        # Simple logic: if the total cost of this cycle is high, and there is a known cheaper provider, recommend a switch.
        if total_cost > 0.05 and cheapest_provider:  # Threshold for high cost
            recommended_action = f"switch_to_provider:{cheapest_provider}"

        return {
            "market_sentiment": "positive",
            "top_performing_provider": cheapest_provider or "openai", # Placeholder
            "total_cycle_cost": total_cost,
            "average_accuracy": avg_accuracy,
            "recommendation": recommended_action
        }