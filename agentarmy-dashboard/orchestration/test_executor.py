import unittest
import asyncio
from executor import AgentExecutor

class MockAgent:
    async def execute(self, task_spec):
        await asyncio.sleep(0)  # satisfy async requirement
        if task_spec.get("fail"):
            raise RuntimeError("Agent crashed")
        if task_spec.get("return_failed"):
            return {"status": "failed", "error": "validation failed", "tokens_used": 12}
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

    def test_execute_propagates_agent_failed_status(self):
        async def run():
            result = await self.executor.execute(
                task_id="t3",
                agent_id="executor_agent",
                task_spec={"return_failed": True},
            )
            self.assertEqual(result["status"], "failed")
            self.assertEqual(result["error"], "validation failed")
            self.assertEqual(result["metrics"]["tokens"], 12)
        asyncio.run(run())

    def test_execute_merges_context(self):
        async def run():
            class ContextEchoAgent:
                async def execute(self, task_spec):
                    await asyncio.sleep(0)
                    return {"status": "completed", "context": task_spec.get("context", {})}

            self.executor.register_agent("context_echo", ContextEchoAgent())
            result = await self.executor.execute(
                task_id="t4",
                agent_id="context_echo",
                task_spec={"context": {"from_task": 1}},
                context={"from_exec": 2},
            )
            self.assertEqual(result["status"], "completed")
            self.assertEqual(result["output"]["context"]["from_task"], 1)
            self.assertEqual(result["output"]["context"]["from_exec"], 2)
        asyncio.run(run())

    def test_execute_with_framework_adapter(self):
        async def run():
            result = await self.executor.execute(
                task_id="t5",
                agent_id="executor_agent",
                task_spec={"input": "do work"},
                framework="langgraph",
            )
            self.assertEqual(result["status"], "completed")
            self.assertEqual(result["metrics"]["framework_used"], "langgraph")
            self.assertEqual(result["output"]["framework"]["framework"], "langgraph")
        asyncio.run(run())

if __name__ == '__main__':
    unittest.main()
