import os
import json
import aiohttp
from typing import Dict, Any

class CriticAgent:
    """
    Critic agent that evaluates the output of other agents (Executor/Planner).
    Implements the 'Critic' role defined in the AgentArmy architecture.
    """
    def __init__(self, model: str = "claude-3-haiku-20240307"):
        self.model = model
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.system_prompt = """You are the Critic agent inside AgentArmy OS.
Your role:
- Evaluate outputs from Planner and Executor agents.
- Score dimensions (0.0-1.0): USEFULNESS, COHERENCE, COST_EFFICIENCY, RISK, ALIGNMENT.
- Return ONLY valid JSON.

Output format:
{
  "scores": {
    "usefulness": 0.0,
    "coherence": 0.0,
    "cost_efficiency": 0.0,
    "risk": 0.0,
    "alignment": 0.0,
    "composite_zpe": 0.0
  },
  "issues": ["issue 1", "issue 2"],
  "improvements": ["fix 1", "fix 2"],
  "verdict": "PASS" | "FAIL" | "REVISE"
}"""

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

        if not self.api_key:
            return self._generate_mock_critique(content_to_evaluate)

        user_message = f"""
        Task Description: {description}
        Content to Evaluate:
        {content_to_evaluate}
        
        Context: {json.dumps(context)}
        """

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
                    content_text = data["content"][0]["text"]
                    
                    # Attempt to parse JSON
                    try:
                        if "```json" in content_text:
                            content_text = content_text.split("```json")[1].split("```")[0].strip()
                        elif "```" in content_text:
                            content_text = content_text.split("```")[1].split("```")[0].strip()
                        evaluation = json.loads(content_text)
                    except json.JSONDecodeError:
                        # Fallback if LLM didn't return pure JSON
                        evaluation = {"raw_output": content_text, "verdict": "REVISE"}

                    return {
                        "status": "completed",
                        "output": evaluation,
                        "tokens": data.get("usage", {})
                    }
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    def _generate_mock_critique(self, _content: str) -> Dict[str, Any]:
        """Generate a mock critique for testing/offline mode."""
        return {
            "status": "completed",
            "output": {
                "scores": {
                    "usefulness": 0.8,
                    "coherence": 0.9,
                    "cost_efficiency": 0.7,
                    "risk": 0.1,
                    "alignment": 0.9,
                    "composite_zpe": 0.85
                },
                "issues": [],
                "improvements": ["Add more details"],
                "verdict": "PASS"
            },
            "mock": True
        }
