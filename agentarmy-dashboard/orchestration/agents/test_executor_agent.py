import unittest
import os
import asyncio
from unittest.mock import patch
from aioresponses import aioresponses
from .executor_agent import ExecutorAgent

class TestExecutorAgent(unittest.TestCase):
    def setUp(self):
        # Patch environment variable to ensure the agent tries to make an API call
        # instead of using the internal mock fallback
        self.env_patcher = patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"})
        self.env_patcher.start()
        self.agent = ExecutorAgent()

    def tearDown(self):
        self.env_patcher.stop()

    def test_execute_success(self):
        async def run_test():
            with aioresponses() as m:
                # Mock the Anthropic API response
                m.post(
                    "https://api.anthropic.com/v1/messages",
                    payload={
                        "content": [{"text": "Executed successfully"}],
                        "usage": {"input_tokens": 10, "output_tokens": 20}
                    },
                    status=200
                )
                
                task_spec = {
                    "description": "Do something",
                    "context": {"foo": "bar"}
                }
                
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "completed")
                self.assertEqual(result["output"], "Executed successfully")
                self.assertEqual(result["tokens"]["input_tokens"], 10)

        asyncio.run(run_test())

    def test_execute_api_failure(self):
        async def run_test():
            with aioresponses() as m:
                m.post(
                    "https://api.anthropic.com/v1/messages",
                    body="Internal Server Error",
                    status=500
                )
                
                task_spec = {"description": "Do something"}
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "failed")
                self.assertIn("Anthropic API Error", result["error"])

        asyncio.run(run_test())

    def test_missing_description(self):
        async def run_test():
            result = await self.agent.execute({})
            self.assertEqual(result["status"], "failed")
            self.assertEqual(result["error"], "No task description provided")
        
        asyncio.run(run_test())

if __name__ == '__main__':
    unittest.main()