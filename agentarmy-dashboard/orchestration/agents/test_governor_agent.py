import asyncio
import unittest
from unittest.mock import patch

from orchestration.agents import governor_agent as _mod
from orchestration.agents.governor_agent import GovernorAgent


class TestGovernorAgent(unittest.TestCase):
    def setUp(self):
        self.agent = GovernorAgent()

    def test_blocks_sensitive_output(self):
        async def run_test():
            with patch.object(_mod, "call_llm", return_value="VERDICT: PASS"):
                result = await self.agent.execute(
                    {"description": "review"},
                    {"execution_output": "API_KEY=sk-123 secret token", "iteration": 1, "max_iterations": 3},
                )
                self.assertTrue(result["blocked"])
                self.assertGreaterEqual(len(result["violations"]), 1)
                self.assertEqual(result["verdict"], "BLOCK")

        asyncio.run(run_test())

    def test_blocks_minor_mature_topic_without_approval(self):
        async def run_test():
            with patch.object(_mod, "call_llm", return_value="VERDICT: PASS"):
                result = await self.agent.execute(
                    {"description": "education content review"},
                    {
                        "execution_output": "lesson draft",
                        "education": {"learner_age": 14, "topic": "violence awareness", "approval_granted": False},
                    },
                )
                self.assertTrue(result["blocked"])
                self.assertIn("EDUCATION_SAFETY", " | ".join(result["violations"]))

        asyncio.run(run_test())

    def test_passes_safe_output(self):
        async def run_test():
            with patch.object(_mod, "call_llm", return_value="VERDICT: PASS\nRATIONALE: clean"):
                result = await self.agent.execute(
                    {"description": "review"},
                    {"execution_output": "All systems nominal.", "iteration": 1, "max_iterations": 3, "qb_spent": 1, "qb_budget": 5},
                )
                self.assertFalse(result["blocked"])
                self.assertEqual(result["verdict"], "PASS")
                self.assertEqual(result["violations"], [])

        asyncio.run(run_test())

    def test_verdict_parser_uses_explicit_verdict(self):
        async def run_test():
            with patch.object(_mod, "call_llm", return_value="VERDICT: PASS\nRATIONALE: do not block this output"):
                result = await self.agent.execute(
                    {"description": "review"},
                    {"execution_output": "clean output"},
                )
                self.assertFalse(result["blocked"])
                self.assertEqual(result["verdict"], "PASS")

        asyncio.run(run_test())

    def test_escalate_verdict_sets_escalated(self):
        async def run_test():
            with patch.object(_mod, "call_llm", return_value="VERDICT: ESCALATE\nSEVERITY: high"):
                result = await self.agent.execute(
                    {"description": "review"},
                    {"execution_output": "needs manual review"},
                )
                self.assertTrue(result["blocked"])
                self.assertTrue(result["escalated"])
                self.assertEqual(result["verdict"], "ESCALATE")
                self.assertEqual(result["severity"], "high")

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
