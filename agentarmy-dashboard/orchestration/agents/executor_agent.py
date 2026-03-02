import os
import json
import aiohttp
from typing import Dict, Any

class ExecutorAgent:
    """
    Executor agent that performs the actual work defined in a task.
    Designed to work with the AgentArmy executor.py interface.
    """
    def __init__(self, model: str = "claude-3-haiku-20240307"):
        self.model = model
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.system_prompt = (
            "You are an expert executor agent. Your goal is to complete the assigned task "
            "accurately and concisely based on the provided description and context. "
            "Return your output in a clear, structured format."
        )

    async def execute(self, task_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a single task.
        """
        # Handle both 'description' (from planner) and 'input' (from tests)
        task_description = task_spec.get("description") or task_spec.get("input")
        if not task_description:
             return {"status": "failed", "error": "No task description provided"}

        context = task_spec.get("context", {})
        
        # Fallback for testing/offline
        if not self.api_key:
            return self._generate_mock_execution(task_description)

        user_message = f"Task: {task_description}\nContext: {json.dumps(context)}"

        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.model,
                    "max_tokens": 1024,
                    "system": self.system_prompt,
                    "messages": [{"role": "user", "content": user_message}]
                }
                headers = {
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                async with session.post(self.api_url, json=payload, headers=headers) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise RuntimeError(f"Anthropic API Error: {error_text}")
                    
                    data = await response.json()
                    content = data["content"][0]["text"]
                    return {
                        "status": "completed",
                        "output": content,
                        "tokens": data.get("usage", {})
                    }
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    def _generate_mock_execution(self, description: str) -> Dict[str, Any]:
        """Generate a mock response when no API key is available."""
        return {
            "status": "completed",
            "output": f"Mock execution result for: {description}",
            "mock": True
        }
