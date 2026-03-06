import logging
from typing import List, Dict, Any
import asyncio
import uuid

from .contracts import TaskResult, SimulationMetrics
from .providers.router import ProviderRouter
from .providers.base import ProviderRequest

logger = logging.getLogger(__name__)

class MobiusOrchestrator:
    """
    Handles the strategy (planning) and execution of tasks.
    This component is the bridge between the high-level orchestrator and the "real world" simulation.
    """
    def __init__(self, agents: List[str], provider_router: ProviderRouter, max_inner_cycles: int = 100):
        if not agents:
            raise ValueError("MobiusOrchestrator requires at least one agent.")
        self.agents = agents
        self.provider_router = provider_router
        self.max_inner_cycles = max_inner_cycles
        logger.info(f"MobiusOrchestrator initialized with agents: {self.agents}, max_inner_cycles: {self.max_inner_cycles}")

    def strategy_phase(self, tasks: List[str]) -> List[str]:
        """
        Determines the strategy for the given tasks.
        Includes 'Creative Mode' to generate tasks if the queue is empty.
        """
        if not tasks:
            logger.info("Strategy phase: No tasks pending. Initiating Creative Mode.")
            try:
                import modelslab_llm
                logger.info("Consulting Hive Mind (LLM) for new objectives...")
                response = modelslab_llm.call_modelslab_llm(
                    model="chatgpt",
                    user_message="Generate 3 advanced, technical tasks for an autonomous AI agent army to optimize a cloud infrastructure or analyze data.",
                    system_message="You are the strategic commander of an autonomous AI agent army. Output only a comma-separated list of 3 task names (snake_case)."
                )
                if response and 'choices' in response and response['choices']:
                    content = response['choices'][0]['message']['content']
                    new_tasks = [t.strip() for t in content.split(',') if t.strip()]
                    if new_tasks:
                        logger.info(f"Hive Mind generated: {new_tasks}")
                        return new_tasks
            except Exception as e:
                logger.warning(f"Hive Mind unavailable ({e}). Falling back to default protocols.")
                return ["explore_system_capabilities", "optimize_internal_processes", "analyze_entropy"]
        logger.info(f"Strategy phase: Planning {len(tasks)} tasks.")
        return tasks

    async def mobius_loop(self, tasks: List[str], inner_cycles: int = None) -> List[TaskResult]:
        """
        Möbius loop: alternate between strategy and execution phases for multiple inner cycles,
        allowing dynamic plan adjustment and recursive improvement within a single orchestration cycle.
        
        Army victory logic: Partial failures are OK. The army wins if success_rate >= 0.5.
        This allows the loop to continue for improvement while recognizing partial success.
        """
        if inner_cycles is None:
            inner_cycles = self.max_inner_cycles
        current_tasks = tasks
        all_results = []
        
        # Helper to calculate success rate
        def calculate_success_rate(results: List[TaskResult]) -> float:
            if not results:
                return 0.0
            success_count = sum(1 for r in results if getattr(r, 'status', None) in ('success', 'completed'))
            return success_count / len(results)
        
        for cycle in range(inner_cycles):
            logger.info(f"Möbius loop: Inner cycle {cycle+1}/{inner_cycles}.")
            plan = self.strategy_phase(current_tasks)
            results = await self.execution_phase(plan)
            all_results.extend(results)

            # Calculate success rate for victory determination
            success_rate = calculate_success_rate(results)

            # Army victory logic: Partial successes are OK (success_rate >= 0.5)
            if success_rate >= 0.5:
                logger.info(f"Army VICTORY! Success rate: {success_rate:.2%} - Partial failures are OK.")
                # Continue to next cycle for further optimization, unless all tasks succeeded

            # Update tasks for next inner cycle based on failed tasks
            current_tasks = [r.task_name for r in results if r.status == 'failed']
            if not current_tasks:
                logger.info("All tasks succeeded, exiting early.")
                break  # All tasks succeeded, exit early
        
        # Final victory check on all results
        final_success_rate = calculate_success_rate(all_results)
        if final_success_rate >= 0.5:
            logger.info(f"FINAL ARMY VICTORY! Overall success rate: {final_success_rate:.2%}")
        else:
            logger.warning(f"Army needs improvement. Overall success rate: {final_success_rate:.2%}")
        
        return all_results

    async def execution_phase(self, plan: List[str]) -> List[TaskResult]:
        """
        Executes the plan by routing each task to the appropriate provider and enriching the results.
        """
        if not plan:
            return []
        
        logger.info(f"Execution phase: Executing plan with {len(plan)} tasks.")
        
        async def execute_task(task_name: str, agent_name: str) -> TaskResult:
            logger.info(f"Executing task '{task_name}' with agent '{agent_name}'.")
            try:
                # Route to the correct provider based on task type (use task_name as proxy for type)
                req = ProviderRequest(task_id=str(uuid.uuid4()), prompt=task_name)
                provider, provider_response = await self.provider_router.choose_and_call(req)

                # For now, simulate accuracy. In a real system, this would be evaluated.
                simulated_accuracy = round(1.0 - (provider_response.latency_ms / 10000), 4)

                return TaskResult(
                    task_name=task_name,
                    status='completed',
                    metrics=SimulationMetrics(accuracy=simulated_accuracy),
                    simulation_id=req.task_id,
                    cost_usd=provider_response.cost,
                    provider_name=provider.name
                )
            except Exception as e:
                logger.error(f"Task '{task_name}' failed during execution: {e}")
                return TaskResult(
                    task_name=task_name,
                    status='failed',
                    error_message=str(e)
                )

        # Create and run tasks concurrently
        execution_tasks = []
        for i, task_name in enumerate(plan):
            assigned_agent = self.agents[i % len(self.agents)]
            execution_tasks.append(execute_task(task_name, assigned_agent))
        
        results = await asyncio.gather(*execution_tasks)
        return results
       
