import asyncio
import unittest
from unittest.mock import patch

from orchestration.agents import enterprise_agent as _mod
from orchestration.agents.enterprise_agent import EnterpriseAgent


class TestEnterpriseAgent(unittest.TestCase):
    def setUp(self):
        self.agent = EnterpriseAgent()

    def test_fails_without_description(self):
        async def run_test():
            result = await self.agent.execute({}, {})
            self.assertEqual(result["status"], "failed")
            self.assertIn("No task description provided", result["error"])
            self.assertEqual(result["agent_id"], "enterprise")

        asyncio.run(run_test())

    def test_execute_success_with_tool_fallback(self):
        async def run_test():
            with patch.object(_mod, "_get_tools_by_type", side_effect=lambda t: [{"id": "claude", "type": "llm"}] if t == "llm" else []):
                with patch.object(_mod, "call_llm", return_value="enterprise response"):
                    result = await self.agent.execute(
                        {"description": "Build enterprise plan", "tool_type": "llm"},
                        {"mission_id": "m1", "budget": {"qb": 10}, "iteration": 1},
                    )
                    self.assertEqual(result["status"], "completed")
                    self.assertEqual(result["content"], "enterprise response")
                    self.assertEqual(result["agent_id"], "enterprise")
                    self.assertIn("claude", result["tools_used"])

        asyncio.run(run_test())

    def test_execute_with_explicit_registry(self):
        async def run_test():
            with patch.object(_mod, "call_llm", return_value="ok"):
                result = await self.agent.execute(
                    {"description": "Use provided tools"},
                    {"tool_registry": [{"id": "internal-bridge", "type": "enterprise"}]},
                )
                self.assertEqual(result["status"], "completed")
                self.assertEqual(result["tools_used"], ["internal-bridge"])

        asyncio.run(run_test())

    def test_rejects_non_dict_task_spec(self):
        async def run_test():
            result = await self.agent.execute("bad-input", {})  # type: ignore[arg-type]
            self.assertEqual(result["status"], "failed")
            self.assertIn("task_spec must be a dictionary", result["error"])

        asyncio.run(run_test())

    def test_blocks_requires_approval_without_approval(self):
        async def run_test():
            result = await self.agent.execute(
                {"description": "delete from users", "requires_approval": True},
                {"approval_granted": False},
            )
            self.assertEqual(result["status"], "blocked")
            self.assertIn("violations", result)
            self.assertGreaterEqual(len(result["violations"]), 1)

        asyncio.run(run_test())

    def test_governor_hook_can_block(self):
        async def run_test():
            def governor_hook(_task, _ctx):
                return {"blocked": True, "violations": ["GOVERNANCE_COMPLIANCE: blocked by hook"]}

            result = await self.agent.execute(
                {"description": "safe task"},
                {"governor_hook": governor_hook},
            )
            self.assertEqual(result["status"], "blocked")
            self.assertIn("blocked by hook", " ".join(result.get("violations", [])))

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
