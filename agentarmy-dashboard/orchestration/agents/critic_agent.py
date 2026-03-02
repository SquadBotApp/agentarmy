import os
import json
import aiohttp
from typing import Dict, Any

from .prompts import get_agent_prompt
from .llm_client import call_llm


class CriticAgent:
    """
    Critic agent that evaluates the output of other agents (Executor/Planner).
    Uses the canonical prompt from prompts.py and the shared llm_client for LLM calls.
    """
    def __init__(self, model: str = "claude-3-5-haiku-20241022"):
        self.model = model
        self.system_prompt = get_agent_prompt("critic")

    async def execute(self, task_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate the provided content.
        Expected task_spec keys:
        - description: What was supposed to be done.
        - context: Contains 'execution_output' or 'plan' to evaluate.
        """
        description = task_spec.get("description", "Unknown task")
        context = task_spec.get("context", {})
        
        # The output to critique might be passed as 'execution_output' in context, 
        # or just 'input' in task_spec for simple tests.
        content_to_evaluate = context.get("execution_output") or task_spec.get("input")
        
        if not content_to_evaluate:
             return {"status": "failed", "error": "No content to evaluate provided"}

        user_message = (
            f"Task Description: {description}\n"
            f"Content to Evaluate:\n{content_to_evaluate}\n\n"
            f"Context: {json.dumps(context)}"
        )

        try:
            content_text = call_llm(
                [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message},
                ],
                model=self.model,
            )

            # Attempt to parse JSON
            try:
                if "```json" in content_text:
                    content_text = content_text.split("```json")[1].split("```")[0].strip()
                elif "```" in content_text:
                    content_text = content_text.split("```")[1].split("```")[0].strip()
                evaluation = json.loads(content_text)
            except json.JSONDecodeError:
                # Fallback if LLM didn't return pure JSON
                evaluation = {"raw_output": content_text, "verdict": "revise"}

            return {
                "status": "completed",
                "output": evaluation,
            }
        except Exception as e:
            return {"status": "failed", "error": str(e)}
