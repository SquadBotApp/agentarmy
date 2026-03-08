import logging
from typing import List
import asyncio
import uuid

from .contracts import TaskResult, SimulationMetrics
from .providers.router import ProviderRouter, ProviderRequest

logger = logging.getLogger(__name__)

class MobiusOrchestrator:
    """
    Handles the strategy (planning) and execution of tasks.
    This component is the bridge between the high-level orchestrator and the "real world" simulation.
    """
    def __init__(self, agents: List[str], provider_router: ProviderRouter):
        if not agents:
            raise ValueError("MobiusOrchestrator requires at least one agent.")
        self.agents = agents
        self.provider_router = provider_router
        logger.info(f"MobiusOrchestrator initialized with agents: {self.agents}")

    def strategy_phase(self, tasks: List[str]) -> List[str]:
        """
        Determines the strategy for the given tasks.
        Includes 'Creative Mode' to generate tasks if the queue is empty.
        """
        if not tasks:
            logger.info("Strategy phase: No tasks pending. Initiating Creative Mode.")
            # Note: The original code attempted to use 'modelslab_llm', which is not a standard library.
            # Assuming it's unavailable in this environment, we always fall back to default tasks.
            # If you have access to ModelsLab API, integrate via their SDK (modelslab-py) or HTTP requests.
            # For space OS, consider embedding a lightweight LLM or using pre-defined task generators.
            logger.info("Falling back to default protocols.")
            return ["explore_system_capabilities", "optimize_internal_processes", "analyze_entropy"]
        logger.info(f"Strategy phase: Planning {len(tasks)} tasks.")
        # Optional enhancement: Add actual strategy logic here, e.g., prioritize or decompose tasks.
        return tasks

    async def execution_phase(self, plan: List[str]) -> List[TaskResult]:
        """
        Executes the plan using the assigned agents and provider router.
        """
        async def execute_task(task_name: str, agent_name: str) -> TaskResult:
            # Try to use the provider router to execute the task
            try:
                # Create a proper ProviderRequest object
                request = ProviderRequest(
                    task_id=str(uuid.uuid4()),
                    prompt=task_name
                )
                
                # Call the provider router and unpack the tuple response
                provider, response = await self.provider_router.choose_and_call(request)
                
                # Convert ProviderResponse to TaskResult if response exists
                if response:
                    return TaskResult(
                        task_name=task_name,
                        status='completed',
                        metrics=SimulationMetrics(
                            accuracy=0.8  # Default accuracy
                        ),
                        cost_usd=getattr(response, 'cost', 0.0),
                        provider_name=provider.name if provider else None
                    )
                else:
                    return TaskResult(
                        task_name=task_name,
                        status='completed'
                    )
            except Exception as e:
                # Return a failed TaskResult on exception
                logger.warning(f"Task {task_name} failed: {e}")
                return TaskResult(
                    task_name=task_name,
                    status='failed',
                    error_message=str(e)
                )

        tasks = []
        for i, task_name in enumerate(plan):
            agent_name = self.agents[i % len(self.agents)]
            tasks.append(execute_task(task_name, agent_name))
        results = await asyncio.gather(*tasks)
        return results

    async def mobius_loop(self, tasks: List[str], inner_cycles: int = 10) -> List[TaskResult]:
        """
        Mobius loop: alternate between strategy and execution phases for multiple inner cycles,
        allowing dynamic plan adjustment and recursive improvement within a single orchestration cycle.
        
        Army victory logic: Partial failures are OK. The army wins if success_rate >= 0.5.
        This allows the loop to continue for improvement while recognizing partial success.
        """
        current_tasks = tasks
        all_results = []
        
        # Helper to calculate success rate
        def calculate_success_rate(results: List[TaskResult]) -> float:
            if not results:
                return 0.0
            # Only check 'completed' as per execution_phase statuses ('completed' or 'failed')
            success_count = sum(1 for r in results if r.status == 'completed')
            return success_count / len(results)
        
        for cycle in range(inner_cycles):
            logger.info(f"Mobius loop: Inner cycle {cycle+1}/{inner_cycles}.")
            plan = self.strategy_phase(current_tasks)
            
            # --- Execution phase: Use the provider router ---
            results = await self.execution_phase(plan)
            
            all_results.extend(results)
            success_rate = calculate_success_rate(results)
            logger.info(f"Mobius loop: Success rate for cycle {cycle+1}: {success_rate:.2f}")
            if success_rate >= 0.5:
                logger.info("Army victory condition met. Exiting Mobius loop early.")
                break
            # Optionally, update current_tasks for next cycle (e.g., failed tasks)
            current_tasks = [r.task_name for r in results if r.status != 'completed']
        return all_results

