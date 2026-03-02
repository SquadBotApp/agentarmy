import os
import json
import aiohttp
import asyncio
from typing import Dict, Any, Optional

class PlannerAgent:
    """
    Strategic decomposition agent that breaks high-level goals into executable subtasks.
    Implements the 'Planner' role defined in the AgentArmy architecture.
    """

    def __init__(self, model: str = "claude-3-haiku-20240307"):
        self.model = model
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.system_prompt = (
            "You are an expert project planner for an autonomous agent system. "
            "Your goal is to decompose a user request into a list of specific, actionable subtasks. "
            "Return ONLY valid JSON containing a 'tasks' array. "
            "Each task must have: "
            "'id' (string, e.g., 't1'), "
            "'description' (string), "
            "'dependencies' (array of task ids that must finish before this one), "
            "and 'estimated_duration' (number, in hours)."
        )

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

        # If no API key is present, return a mock plan for testing/demo purposes
        if not self.api_key:
            print("Warning: ANTHROPIC_API_KEY not found. Using mock planner response.")
            return self._generate_mock_plan(goal)

        user_message = f"""
        Goal: {goal}
        Context: {json.dumps(context)}
        Constraints: {json.dumps(constraints)}
        
        Generate the execution plan JSON.
        """

        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.model,
                    "max_tokens": 2048,
                    "system": self.system_prompt,
                    "messages": [
                        {"role": "user", "content": user_message}
                    ]
                }
                headers = {
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }

                async with session.post(self.api_url, json=payload, headers=headers) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise RuntimeError(f"Anthropic API Error ({response.status}): {error_text}")

                    data = await response.json()
                    content_text = data["content"][0]["text"]
                    
                    # Extract JSON if wrapped in markdown code blocks
                    if "```json" in content_text:
                        content_text = content_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in content_text:
                        content_text = content_text.split("```")[1].split("```")[0].strip()

                    plan = json.loads(content_text)
                    
                    return {
                        "status": "success",
                        "plan": plan,
                        "tokens_used": data.get("usage", {}),
                        "model": self.model
                    }

        except Exception as e:
            return {"status": "failed", "error": str(e)}

    def _generate_mock_plan(self, goal: str) -> Dict[str, Any]:
        """Fallback plan generator for offline/demo mode."""
        return {
            "status": "success",
            "plan": {
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
            },
            "mock": True
        }