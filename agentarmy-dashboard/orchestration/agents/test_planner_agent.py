import unittest
import json
import asyncio
from unittest.mock import patch
from orchestration.agents import planner_agent as _mod
from orchestration.agents.planner_agent import PlannerAgent

class TestPlannerAgent(unittest.TestCase):
    def setUp(self):
        self.agent = PlannerAgent()

    def test_execute_success(self):
        mock_plan = {
            "tasks": [
                {"id": "t1", "description": "Step 1", "dependencies": [], "estimated_duration": 1}
            ]
        }

        async def run_test():
            with patch.object(_mod, "call_llm", return_value=json.dumps(mock_plan)):
                task_spec = {"goal": "Create a plan"}
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "success")
                self.assertEqual(result["plan"], mock_plan)

        asyncio.run(run_test())

    def test_execute_llm_failure(self):
        async def run_test():
            with patch.object(_mod, "call_llm", side_effect=RuntimeError("LLM error")):
                task_spec = {"goal": "Create a plan"}
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "failed")
                self.assertIn("LLM error", result["error"])

        asyncio.run(run_test())

    def test_missing_goal_raises_error(self):
        async def run_test():
            with self.assertRaises(ValueError) as cm:
                await self.agent.execute({})
            self.assertIn("PlannerAgent requires a 'goal'", str(cm.exception))

        asyncio.run(run_test())

    def test_mock_fallback_produces_plan(self):
        """When call_llm returns non-JSON (mock fallback), agent still returns a valid plan."""
        async def run_test():
            with patch.object(_mod, "call_llm", return_value="[mock-llm] some text"):
                task_spec = {"goal": "Test mock"}
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "success")
                self.assertIn("tasks", result["plan"])
                self.assertIn("Analyze requirements for: Test mock", result["plan"]["tasks"][0]["description"])

        asyncio.run(run_test())

    def test_uses_canonical_prompt(self):
        """Verify the agent imports its prompt from prompts.py."""
        from orchestration.agents.prompts import get_agent_prompt
        expected_prompt = get_agent_prompt("planner")
        self.assertEqual(self.agent.system_prompt, expected_prompt)

if __name__ == '__main__':
    unittest.main()