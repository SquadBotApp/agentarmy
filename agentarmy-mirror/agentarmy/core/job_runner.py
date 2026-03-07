"""
Job runner with Recursive Engine integration.
Wraps task execution and feeds results to the Recursive Engine for self-improvement.
"""

import logging
from typing import Any, Dict, List

from core.recursive import RecursiveEngine

logger = logging.getLogger(__name__)


class JobRunner:
    """
    Executes jobs and integrates with the Recursive Engine.
    After job completion, automatically ingests results for pattern learning.
    """
    
    def __init__(self, recursive_engine: RecursiveEngine | None = None):
        self.recursive_engine = recursive_engine or RecursiveEngine()
        self.job_count = 0
    
    async def run_job(
        self,
        job_id: str,
        tasks: List[Dict[str, Any]],
        executor_func
    ) -> Dict[str, Any]:
        """
        Execute a job (collection of tasks) and ingest results.
        
        Args:
            job_id: Unique job identifier
            tasks: List of task definitions
            executor_func: Async function to execute tasks
                          Should return list of task results
        
        Returns:
            job_result dict with all task outcomes
        """
        
        logger.info(f"JobRunner: Starting job {job_id} with {len(tasks)} tasks")
        self.job_count += 1
        
        try:
            # Execute all tasks
            task_results = await executor_func(tasks)

            # Build job result structure for Recursive Engine
            job_result = {
                "job_id": job_id,
                "tasks": [
                    {
                        "task_id": result.get("task_id", f"t_{i}"),
                        "provider": result.get("provider", "unknown"),
                        "success": bool(result.get("success", True)),
                        "latency_ms": int(result.get("latency_ms", 0)),
                        "cost_usd": float(result.get("cost_usd", 0.0)),
                        "zpe_score": float(result.get("zpe_score", 0.5)),
                        "metadata": result.get("metadata", {}),
                    }
                    for i, result in enumerate(task_results)
                ],
            }

            # Ingest into Recursive Engine for self-improvement
            logger.info(f"JobRunner: Ingesting job {job_id} into Recursive Engine")
            self.recursive_engine.ingest_job_result(job_result)

            # --- Universes integration (adaptive) ---
            from core.universes.universes import Universes
            from core.universes.collapse import UniverseCollapse
            from core.universes.selector import UniverseSelector
            from core.contracts.types import TaskResult

            # Convert dict results to TaskResult dataclasses
            task_result_objs = [
                TaskResult(
                    task_id=tr["task_id"],
                    provider=tr["provider"],
                    success=tr["success"],
                    output=tr.get("output"),
                    metadata=tr.get("metadata", {})
                ) for tr in job_result["tasks"]
            ]

            selector = UniverseSelector()
            universe_count = selector.select(task_result_objs)
            universe_engine = Universes(universe_count=universe_count)
            universes = universe_engine.expand_results(task_result_objs)

            collapse_engine = UniverseCollapse()
            collapsed = collapse_engine.collapse(universes)

            logger.info(f"JobRunner: Universes collapsed. Scores: {collapsed['scores']}")

            return collapsed
        except Exception as e:
            logger.error(f"JobRunner: Error executing job {job_id}: {str(e)}")
            raise


def create_job_runner(recursive_engine: RecursiveEngine | None = None) -> JobRunner:
    """Factory function to create a JobRunner instance"""
    
    return JobRunner(recursive_engine)
