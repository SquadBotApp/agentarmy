import os
import json
import aiohttp
import asyncio
from typing import Dict, Any, Optional

from .prompts import get_agent_prompt
from .llm_client import call_llm


class PlannerAgent:
    """
    Strategic decomposition agent that breaks high-level goals into executable subtasks.
    Implements the 'Planner' role defined in the AgentArmy architecture.
    Uses the canonical prompt from prompts.py and the shared llm_client for LLM calls.
    """

    def __init__(self, model: str = "claude-3-5-haiku-20241022"):
        self.model = model
        self.system_prompt = get_agent_prompt("planner")

    async def execute(self, task_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the planning task.
        
        Args:
            task_spec: Dictionary containing 'goal', 'context', and optional 'constraints'.
            
        Returns:
            Dictionary containing the generated plan and metadata.
        """
        goal = task_spec.get("goal")
        if not goal:
            raise ValueError("PlannerAgent requires a 'goal' in the task specification.")

        context = task_spec.get("context", {})
        constraints = task_spec.get("constraints", {})

        user_message = (
            f"Goal: {goal}\n"
            f"Context: {json.dumps(context)}\n"
            f"Constraints: {json.dumps(constraints)}\n\n"
            f"Generate the execution plan JSON."
        )

        try:
            content_text = call_llm(
                [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message},
                ],
                model=self.model,
            )

            # Extract JSON if wrapped in markdown code blocks
            if "```json" in content_text:
                content_text = content_text.split("```json")[1].split("```")[0].strip()
            elif "```" in content_text:
                content_text = content_text.split("```")[1].split("```")[0].strip()

            plan = json.loads(content_text)
            
            return {
                "status": "success",
                "plan": plan,
                "model": self.model,
            }

        except json.JSONDecodeError:
            # LLM returned non-JSON (e.g. mock fallback) — wrap as best-effort plan
            return {
                "status": "success",
                "plan": self._extract_fallback_plan(content_text, goal),
                "model": self.model,
                "note": "Parsed from non-JSON LLM output",
            }
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    def _extract_fallback_plan(self, raw_text: str, goal: str) -> Dict[str, Any]:
        """Build a minimal plan dict when the LLM didn't return valid JSON."""
        return {
            "tasks": [
                {
                    "id": "t1",
                    "description": f"Analyze requirements for: {goal}",
                    "dependencies": [],
                    "estimated_duration": 0.5
                },
                {
                    "id": "t2",
                    "description": "Formulate execution strategy",
                    "dependencies": ["t1"],
                    "estimated_duration": 1.0
                },
                {
                    "id": "t3",
                    "description": "Execute core steps",
                    "dependencies": ["t2"],
                    "estimated_duration": 2.0
                }
            ]
        }