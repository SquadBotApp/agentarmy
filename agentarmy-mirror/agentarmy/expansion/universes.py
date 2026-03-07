import logging
import asyncio
from typing import List, Dict, Any
from core.contracts import TaskResult

logger = logging.getLogger(__name__)

class Universes:
    """
    Manages parallel execution environments (universes) to explore different strategies or configurations simultaneously.
    """
    def __init__(self):
        self.universes: Dict[str, Any] = {}

    async def run_parallel_simulations(self, tasks: List[str], strategies: List[str], mobius_orchestrator) -> List[TaskResult]:
        """
        Runs the given tasks across multiple universes, each applying a different strategy.
        """
        logger.info(f"Universes: Spawning {len(strategies)} parallel universes.")
        
        async def run_universe(strategy_name: str) -> List[TaskResult]:
            logger.info(f"Universe '{strategy_name}': Starting simulation.")
            # In a real implementation, we might clone the orchestrator or context here
            # and apply the specific strategy configuration.
            # For now, we'll just use the strategy name as a prefix for tasks to simulate difference.
            modified_tasks = [f"[{strategy_name}] {task}" for task in tasks]
            results = await mobius_orchestrator.mobius_loop(modified_tasks, inner_cycles=1)
            return results

        coroutines = [run_universe(strategy) for strategy in strategies]
        results_list = await asyncio.gather(*coroutines)
        
        # Flatten results
        all_results = [item for sublist in results_list for item in sublist]
        return all_results