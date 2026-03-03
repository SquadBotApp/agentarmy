import unittest
import asyncio
from unittest.mock import patch
from orchestration.agents import executor_agent as _mod
from orchestration.agents.executor_agent import ExecutorAgent

class TestExecutorAgent(unittest.TestCase):
    def setUp(self):
        self.agent = ExecutorAgent()

    def test_execute_success(self):
        async def run_test():
            with patch.object(_mod, "call_llm", return_value="Executed successfully"):
                task_spec = {
                    "description": "Do something",
                    "context": {"foo": "bar"}
                }
                
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "completed")
                self.assertEqual(result["output"], "Executed successfully")

        asyncio.run(run_test())

    def test_execute_llm_failure(self):
        async def run_test():
            with patch.object(_mod, "call_llm", side_effect=RuntimeError("LLM error")):
                task_spec = {"description": "Do something"}
                result = await self.agent.execute(task_spec)
                
                self.assertEqual(result["status"], "failed")
                self.assertIn("LLM error", result["error"])

        asyncio.run(run_test())

    def test_missing_description(self):
        async def run_test():
            result = await self.agent.execute({})
            self.assertEqual(result["status"], "failed")
            self.assertEqual(result["error"], "No task description provided")
        
        asyncio.run(run_test())

    def test_uses_canonical_prompt(self):
        """Verify the agent imports its prompt from prompts.py."""
        from orchestration.agents.prompts import get_agent_prompt
        expected_prompt = get_agent_prompt("executor")
        self.assertEqual(self.agent.system_prompt, expected_prompt)

if __name__ == '__main__':
    unittest.main()