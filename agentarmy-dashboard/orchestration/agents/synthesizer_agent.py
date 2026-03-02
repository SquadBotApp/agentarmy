import os
import json
import aiohttp
from typing import Dict, Any

from .prompts import get_agent_prompt
from .llm_client import call_llm


class SynthesizerAgent:
    """
    Synthesizer agent that combines outputs from multiple agents into a final deliverable.
    Uses the canonical prompt from prompts.py and the shared llm_client for LLM calls.
    """
    def __init__(self, model: str = "claude-3-5-haiku-20241022"):
        self.model = model
        self.system_prompt = get_agent_prompt("synthesizer")

    async def execute(self, task_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesize multiple agent outputs into a final report.
        Expected task_spec keys:
        - description: The overall goal of the synthesis.
        - context: Contains outputs from other agents, e.g., 'planner_output', 'executor_outputs'.
        """
        description = task_spec.get("description", "Synthesize mission results.")
        context = task_spec.get("context", {})

        if not context:
            return {"status": "failed", "error": "No context provided for synthesis."}

        if not self.api_key:
            return self._generate_mock_synthesis(description, context)

        user_message = f"Synthesize the results for the mission: '{description}'.\n\n=== Inputs to Synthesize ===\n"
        for key, value in context.items():
            user_message += f"\n--- {key.replace('_', ' ').title()} ---\n{json.dumps(value, indent=2, default=str)}\n"
        user_message += "\nGenerate the final synthesis JSON based on the provided inputs and your system prompt."

        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.model,
                    "max_tokens": 4096,
                    "system": self.system_prompt,
                    "messages": [{"role": "user", "content": user_message}]
                }
                headers = {"x-api-key": self.api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
                async with session.post(self.api_url, json=payload, headers=headers) as response:
                    if response.status != 200:
                        raise RuntimeError(f"Anthropic API Error: {await response.text()}")
                    data = await response.json()
                    content_text = data["content"][0]["text"]
                    try:
                        if "```json" in content_text:
                            content_text = content_text.split("```json")[1].split("```")[0].strip()
                        elif "```" in content_text:
                            content_text = content_text.split("```")[1].split("```")[0].strip()
                        synthesis = json.loads(content_text)
                    except (json.JSONDecodeError, IndexError):
                        synthesis = {"raw_output": content_text, "status": "partial"}
                    return {"status": "completed", "output": synthesis, "tokens": data.get("usage", {})}
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    def _generate_mock_synthesis(self, description: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a mock synthesis for testing/offline mode."""
        return {
            "status": "completed",
            "output": {
                "synthesis_id": "mock-synthesis-123",
                "mission_id": context.get("mission_id", "mock-mission-456"),
                "status": "complete",
                "deliverable": {"format": "markdown", "content": f"# Mock Synthesis Report\n\n**Goal:** {description}\n\nSuccessfully synthesized outputs from context."},
                "summary": {"goal_achieved": True, "executive_summary": "The mission was completed successfully based on mock data."},
                "metrics": {"total_cost_qb": 1.23, "total_time_ms": 5000, "agents_involved": len(context), "final_zpe_score": 0.85},
                "provenance": dict.fromkeys(context, "mock-id"),
            },
            "mock": True
        }