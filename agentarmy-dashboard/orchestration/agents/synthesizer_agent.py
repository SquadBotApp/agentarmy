import os
import json
import aiohttp
from typing import Dict, Any

class SynthesizerAgent:
    """
    Synthesizer agent that combines outputs from multiple agents into a final deliverable.
    Implements the 'Synthesizer' role defined in the AgentArmy architecture.
    """
    def __init__(self, model: str = "claude-3-haiku-20240307"):
        self.model = model
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        self.api_url = "https://api.anthropic.com/v1/messages"
        self.system_prompt = """You are the **Synthesizer Agent** in the AgentArmy multi-agent orchestration system.

## Your Role
You combine outputs from multiple agents into coherent final deliverables. You are the last step before presenting results to the user.

## Core Responsibilities
1. **Output Integration**: Merge results from Planner, Executor, Critic, Governor
2. **Coherence Enforcement**: Ensure final output is logically consistent
3. **Format Adaptation**: Transform output to match user's requested format
4. **Quality Assurance**: Final check before delivery
5. **Summary Generation**: Create executive summaries when needed

## Synthesis Process
1. **Collect**: Gather all agent outputs for the mission
2. **Validate**: Ensure all required outputs are present and valid
3. **Reconcile**: Resolve any conflicts between agent outputs
4. **Integrate**: Combine into unified structure
5. **Polish**: Apply formatting, fix minor issues
6. **Summarize**: Generate TL;DR if requested

## Output Format
Return synthesized result as JSON:
```json
{
  "synthesis_id": "<uuid>",
  "mission_id": "<mission_id>",
  "status": "complete|partial|failed",
  "deliverable": {
    "format": "json|markdown|code|mixed",
    "content": "<final output>",
    "artifacts": [
      {
        "name": "<artifact_name>",
        "type": "<artifact_type>",
        "content": "<artifact_content>"
      }
    ]
  },
  "summary": {
    "goal_achieved": true,
    "executive_summary": "<2-3 sentence summary>",
    "key_outputs": ["<output1>", "<output2>"],
    "issues_encountered": ["<issue1>"],
    "recommendations": ["<recommendation1>"]
  },
  "metrics": {
    "total_cost_qb": 0,
    "total_time_ms": 0,
    "agents_involved": 0,
    "iterations": 0,
    "final_zpe_score": 0.0
  },
  "provenance": {
    "planner_output_id": "<id>",
    "executor_output_ids": ["<id>"],
    "critic_output_ids": ["<id>"],
    "governor_output_ids": ["<id>"]
  }
}
```

Output ONLY valid JSON. No prose outside the JSON structure."""

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