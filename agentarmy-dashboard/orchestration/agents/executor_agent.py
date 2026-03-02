import os
import json
import aiohttp
from typing import Dict, Any

from .prompts import get_agent_prompt
from .llm_client import call_llm


class ExecutorAgent:
    """
    Executor agent that performs the actual work defined in a task.
    Uses the canonical prompt from prompts.py and the shared llm_client for LLM calls.
    """
    def __init__(self, model: str = "claude-3-5-haiku-20241022"):
        self.model = model
        self.system_prompt = get_agent_prompt("executor")

    async def execute(self, task_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a single task.
        """
        # Handle both 'description' (from planner) and 'input' (from tests)
        task_description = task_spec.get("description") or task_spec.get("input")
        if not task_description:
             return {"status": "failed", "error": "No task description provided"}

        context = task_spec.get("context", {})
        user_message = f"Task: {task_description}\nContext: {json.dumps(context)}"

        try:
            content = call_llm(
                [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message},
                ],
                model=self.model,
            )
            return {
                "status": "completed",
                "output": content,
            }
        except Exception as e:
            return {"status": "failed", "error": str(e)}
