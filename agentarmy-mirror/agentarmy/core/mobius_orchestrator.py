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

    async def mobius_loop(self, tasks: List[str], inner_cycles: int = 10) -> List[TaskResult]:
        """
        Möbius loop: alternate between strategy and execution phases for multiple inner cycles,
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
                # Continue to next cycle if we haven't reached max
                if cycle < inner_cycles - 1:
                    logger.info("Continuing to next cycle for further optimization...")
            
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
        Executes the plan using the assigned agents and provider router.
        """
        async def execute_task(task_name: str, agent_name: str) -> TaskResult:
            # Simulate task execution
            await asyncio.sleep(0.1)
            return TaskResult(task_name=task_name, status='success')

        tasks = []
        for i, task_name in enumerate(plan):
            agent_name = self.agents[i % len(self.agents)]
            tasks.append(execute_task(task_name, agent_name))
        results = await asyncio.gather(*tasks)
        return results
