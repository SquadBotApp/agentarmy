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
                    return [t.strip() for t in content.split(',') if t.strip()]
            except Exception as e:
                logger.error(f"Creative Mode failed: {e}")
            return ["default_task"]
        return tasks

    async def mobius_loop(self, tasks: List[str], inner_cycles: int = 2) -> List[TaskResult]:
        """
        Möbius loop: alternate between strategy and execution phases for multiple inner cycles,
        allowing dynamic plan adjustment and recursive improvement within a single orchestration cycle.
        """
        current_tasks = tasks
        all_results = []
        for cycle in range(inner_cycles):
            logger.info(f"Möbius loop: Inner cycle {cycle+1}/{inner_cycles}.")
            plan = self.strategy_phase(current_tasks)
            results = await self.execution_phase(plan)
            all_results.extend(results)
            # Optionally, update tasks for next inner cycle based on results (simple retry for failed tasks)
            current_tasks = [r.task_name for r in results if r.status == 'failed']
            if not current_tasks:
                break  # All tasks succeeded, exit early
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
