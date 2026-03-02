import unittest
import os
import json
import asyncio
from unittest.mock import patch
from aioresponses import aioresponses
from .critic_agent import CriticAgent

class TestCriticAgent(unittest.TestCase):
    def setUp(self):
        # Patch environment variable to ensure the agent tries to make an API call
        # instead of using the internal mock fallback.
        self.env_patcher = patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"})
        self.env_patcher.start()
        self.agent = CriticAgent()

    def tearDown(self):
        self.env_patcher.stop()

    def test_execute_success(self):
        async def run_test():
            with aioresponses() as m:
                mock_critique = {
                    "scores": {"usefulness": 0.9, "coherence": 0.8},
                    "issues": [],
                    "improvements": ["Looks good"],
                    "verdict": "PASS"
                }
                m.post(
                    "https://api.anthropic.com/v1/messages",
                    payload={
                        "content": [{"text": json.dumps(mock_critique)}],
                        "usage": {"input_tokens": 50, "output_tokens": 100}
                    },
                    status=200
                )
                
                task_spec = {
                    "description": "Evaluate this code",
                    "context": {"execution_output": "print('hello world')"}
                }
                
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "completed")
                self.assertEqual(result["output"]["verdict"], "PASS")
                self.assertEqual(result["output"]["scores"]["usefulness"], 0.9)
                self.assertEqual(result["tokens"]["output_tokens"], 100)

        asyncio.run(run_test())

    def test_execute_api_failure(self):
        async def run_test():
            with aioresponses() as m:
                m.post(
                    "https://api.anthropic.com/v1/messages",
                    body="Internal Server Error",
                    status=500
                )
                
                task_spec = {"context": {"execution_output": "some output"}}
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "failed")
                self.assertIn("Anthropic API Error", result["error"])

        asyncio.run(run_test())

    def test_missing_content_to_evaluate(self):
        async def run_test():
            result = await self.agent.execute({"description": "Evaluate nothing"})
            self.assertEqual(result["status"], "failed")
            self.assertEqual(result["error"], "No content to evaluate provided")
        
        asyncio.run(run_test())

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