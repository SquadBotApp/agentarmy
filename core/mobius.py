import logging
from typing import List, Dict, Any
from . import sim_engine # This is a dependency for executing tasks
from .contracts import TaskResult, SimulationMetrics

logger = logging.getLogger(__name__)

class MobiusOrchestrator:
    """
    Handles the strategy (planning) and execution of tasks.
    This component is the bridge between the high-level orchestrator and the "real world" simulation.
    """
    def __init__(self, agents: List[str]):
        if not agents:
            raise ValueError("MobiusOrchestrator requires at least one agent.")
        self.agents = agents
        logger.info(f"MobiusOrchestrator initialized with agents: {self.agents}")

    def strategy_phase(self, tasks: List[str]) -> List[str]:
        """
        Determines the strategy for the given tasks.
        Includes 'Creative Mode' to generate tasks if the queue is empty.
        """
        if not tasks:
            logger.info("Strategy phase: No tasks pending. Initiating Creative Mode.")
            
            # Attempt to use LLM for creativity (The Hive Mind)
            try:
                import modelslab_llm
                logger.info("Consulting Hive Mind (LLM) for new objectives...")
                response = modelslab_llm.call_modelslab_llm(
                    model="chatgpt",
                    user_message="Generate 3 advanced, technical tasks for an autonomous AI agent army to optimize a cloud infrastructure or analyze data.",
                    system_message="You are the strategic commander of an autonomous AI agent army. Output only a comma-separated list of 3 task names (snake_case)."
                )
                # Robust parsing of the response
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

    def execution_phase(self, plan: List[str]) -> List[TaskResult]:
        """
        Executes the plan by running simulations for each task and enriching the results.
        """
        if not plan:
            return []
        
        logger.info(f"Execution phase: Executing plan with {len(plan)} tasks.")
        results = []
        for i, task_name in enumerate(plan):
            # A simple round-robin agent assignment strategy
            assigned_agent = self.agents[i % len(self.agents)]
            logger.info(f"Executing task '{task_name}' with agent '{assigned_agent}'.")
            
            try:
                sim_config = {"agent_name": assigned_agent, "task_details": task_name}
                sim_result = sim_engine.run_simulation(config=sim_config)

                # Create a structured result object
                results.append(TaskResult(
                    task_name=task_name,
                    status='completed',
                    metrics=SimulationMetrics(accuracy=sim_result['metrics']['accuracy']),
                    simulation_id=sim_result['simulation_id']
                ))

            except Exception as e:
                logger.error(f"Task '{task_name}' failed during execution: {e}")
                results.append(TaskResult(
                    task_name=task_name,
                    status='failed',
                    error_message=str(e)
                ))
        
        return results