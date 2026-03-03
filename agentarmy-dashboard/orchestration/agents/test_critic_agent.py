import unittest
import json
import asyncio
from unittest.mock import patch
from orchestration.agents import critic_agent as _mod
from orchestration.agents.critic_agent import CriticAgent

class TestCriticAgent(unittest.TestCase):
    def setUp(self):
        self.agent = CriticAgent()

    def test_execute_success(self):
        mock_critique = {
            "zpe_score": {"total": 0.85, "components": {"usefulness": 0.9, "coherence": 0.8}},
            "issues": [],
            "improvements": [{"priority": 1, "action": "Looks good"}],
            "verdict": "accept"
        }

        async def run_test():
            with patch.object(_mod, "call_llm", return_value=json.dumps(mock_critique)):
                task_spec = {
                    "description": "Evaluate this code",
                    "context": {"execution_output": "print('hello world')"}
                }
                
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "completed")
                self.assertEqual(result["output"]["verdict"], "accept")
                self.assertEqual(result["output"]["zpe_score"]["components"]["usefulness"], 0.9)

        asyncio.run(run_test())

    def test_execute_llm_failure(self):
        async def run_test():
            with patch.object(_mod, "call_llm", side_effect=RuntimeError("LLM error")):
                task_spec = {"context": {"execution_output": "some output"}}
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "failed")
                self.assertIn("LLM error", result["error"])

        asyncio.run(run_test())

    def test_missing_content_to_evaluate(self):
        async def run_test():
            result = await self.agent.execute({"description": "Evaluate nothing"})
            self.assertEqual(result["status"], "failed")
            self.assertEqual(result["error"], "No content to evaluate provided")
        
        asyncio.run(run_test())

    def test_non_json_llm_response(self):
        """When LLM returns non-JSON text, critic should wrap it as raw_output."""
        async def run_test():
            with patch.object(_mod, "call_llm", return_value="This is not JSON"):
                task_spec = {
                    "description": "Evaluate something",
                    "context": {"execution_output": "some output"}
                }
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "completed")
                self.assertIn("raw_output", result["output"])
                self.assertEqual(result["output"]["verdict"], "revise")

        asyncio.run(run_test())

    def test_uses_canonical_prompt(self):
        """Verify the agent imports its prompt from prompts.py."""
        from orchestration.agents.prompts import get_agent_prompt
        expected_prompt = get_agent_prompt("critic")
        self.assertEqual(self.agent.system_prompt, expected_prompt)

if __name__ == '__main__':
    unittest.main()

    def test_llm_returns_non_json_fallback(self):
        async def run_test():
            with aioresponses() as m:
                m.post("https://api.anthropic.com/v1/messages", payload={"content": [{"text": "This looks good."}]}, status=200)
                result = await self.agent.execute({"input": "some output"})
                self.assertEqual(result["status"], "completed")
                self.assertEqual(result["output"]["verdict"], "REVISE")
                self.assertEqual(result["output"]["raw_output"], "This looks good.")

        asyncio.run(run_test())

if __name__ == '__main__':
    unittest.main()