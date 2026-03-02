import unittest
import os
import json
import asyncio
from unittest.mock import patch
from aioresponses import aioresponses
from .planner_agent import PlannerAgent

class TestPlannerAgent(unittest.TestCase):
    def setUp(self):
        # Patch environment variable to ensure the agent tries to make an API call
        # instead of using the internal mock fallback.
        self.env_patcher = patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"})
        self.env_patcher.start()
        self.agent = PlannerAgent()

    def tearDown(self):
        self.env_patcher.stop()

    def test_execute_success(self):
        async def run_test():
            with aioresponses() as m:
                mock_plan = {
                    "tasks": [
                        {"id": "t1", "description": "Step 1", "dependencies": [], "estimated_duration": 1}
                    ]
                }
                m.post(
                    "https://api.anthropic.com/v1/messages",
                    payload={
                        "content": [{"text": json.dumps(mock_plan)}],
                        "usage": {"input_tokens": 10, "output_tokens": 50}
                    },
                    status=200
                )
                
                task_spec = {"goal": "Create a plan"}
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "success")
                self.assertEqual(result["plan"], mock_plan)
                self.assertEqual(result["tokens_used"]["output_tokens"], 50)

        asyncio.run(run_test())

    def test_execute_api_failure(self):
        async def run_test():
            with aioresponses() as m:
                m.post(
                    "https://api.anthropic.com/v1/messages",
                    body="Server error",
                    status=500
                )
                
                task_spec = {"goal": "Create a plan"}
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "failed")
                self.assertIn("Anthropic API Error", result["error"])

        asyncio.run(run_test())

    def test_missing_goal_raises_error(self):
        async def run_test():
            with self.assertRaises(ValueError) as cm:
                await self.agent.execute({})
            self.assertIn("PlannerAgent requires a 'goal'", str(cm.exception))

        asyncio.run(run_test())

    def test_mock_fallback_when_no_api_key(self):
        # Temporarily remove the API key for this test
        self.env_patcher.stop()
        agent_no_key = PlannerAgent()
        
        async def run_test():
            task_spec = {"goal": "Test mock"}
            result = await agent_no_key.execute(task_spec)
            
            self.assertEqual(result["status"], "success")
            self.assertTrue(result.get("mock"))
            self.assertIn("Analyze requirements for: Test mock", result["plan"]["tasks"][0]["description"])

        asyncio.run(run_test())
        
        # Restore the patcher for other tests
        self.env_patcher.start()

if __name__ == '__main__':
    unittest.main()