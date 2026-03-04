# Recursive improvement engine
import logging
from typing import List, Any, Dict

logger = logging.getLogger(__name__)

class ReflectionEngine:
    """
    Analyzes task results to generate new tasks and learn lessons.
    This is the "self-improvement" part of the loop.
    """
    def __init__(self):
        # In a real-world scenario, this would connect to a vector DB or a persistent store.
        self.lessons_learned = []
        logger.info("ReflectionEngine initialized.")

    def after_task(self, plan: List[str], results: List[Any]):
        """
        A hook that runs after a plan is executed. It can be used for logging or immediate analysis.
        """
        # This method is more for logging and immediate side-effects.
        # The core logic for generating new tasks is in update_lessons.
        logger.info(f"Reflecting on plan: {plan} with results: {results}")
        self.lessons_learned.append({"plan": plan, "results": results})

    def update_lessons(self, results: List[Dict[str, Any]]) -> List[str]:
        """
        Analyzes results and generates new tasks based on success or failure.
        This is the core of the reflective process.
        """
        new_tasks = []
        if not results:
            return new_tasks

        for result in results:
            # This logic is robust to handle various dictionary formats from different tools.
            original_task = result.get('task_name', 'unknown_task')
            status = result.get('status', 'unknown')

            if status == 'completed':
                # If a task was successful, generate a verification task.
                new_task = f"verify_and_document_{original_task}"
                new_tasks.append(new_task)
            elif status == 'failed':
                # If a task failed, generate a retry task.
                new_task = f"retry_and_debug_{original_task}"
                new_tasks.append(new_task)

        return new_tasks
