import unittest
import asyncio
from executor import AgentExecutor

class MockAgent:
    async def execute(self, task_spec):
        await asyncio.sleep(0)  # satisfy async requirement
        if task_spec.get("fail"):
            raise RuntimeError("Agent crashed")
        return {"response": "Task Done", "tokens": 150}

class TestAgentExecutor(unittest.TestCase):
    def setUp(self):
        self.executor = AgentExecutor()
        self.agent = MockAgent()
        self.executor.register_agent("executor_agent", self.agent)

    def test_execute_success(self):
        async def run():
            result = await self.executor.execute(
                task_id="t1", 
                agent_id="executor_agent", 
                task_spec={"input": "do work"}
            )
            self.assertEqual(result["status"], "completed")
            self.assertEqual(result["output"]["response"], "Task Done")
            self.assertGreater(result["metrics"]["latency_ms"], 0)
        asyncio.run(run())

    def test_execute_failure(self):
        async def run():
            result = await self.executor.execute(
                task_id="t2", 
                agent_id="executor_agent", 
                task_spec={"fail": True}
            )
            self.assertEqual(result["status"], "failed")
            self.assertIn("Agent crashed", result["error"])
        asyncio.run(run())

if __name__ == '__main__':
    unittest.main()