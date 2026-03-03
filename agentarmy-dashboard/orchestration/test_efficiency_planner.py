import unittest

try:
    from integrations import build_efficiency_plan
except Exception:  # pragma: no cover
    from orchestration.integrations import build_efficiency_plan


class TestEfficiencyPlanner(unittest.TestCase):
    def test_recommends_framework_for_coding_goal(self):
        plan = build_efficiency_plan({"goal": "Fix bug and write tests"})
        self.assertEqual(plan["recommended_framework"], "langgraph")
        self.assertIn("coding", plan["intents"])

    def test_resolves_mobile_vendor_targets(self):
        plan = build_efficiency_plan(
            {"goal": "Deploy mobile integration", "mobile_vendors": ["apple", "google"]}
        )
        self.assertIn("mobile", plan["intents"])
        self.assertIn("apple_mobile", plan["integration_targets"])
        self.assertIn("google_mobile", plan["integration_targets"])

    def test_honors_explicit_framework_request(self):
        plan = build_efficiency_plan(
            {"goal": "Analyze support logs", "framework": "crewai"}
        )
        self.assertEqual(plan["recommended_framework"], "crewai")

    def test_recommends_frabric_for_coding_plus_governance(self):
        plan = build_efficiency_plan(
            {"goal": "Implement feature with policy approvals and governance audit"}
        )
        self.assertEqual(plan["recommended_framework"], "frabric")

    def test_honors_fabric_alias(self):
        plan = build_efficiency_plan(
            {"goal": "Build governed automation", "framework": "fabric"}
        )
        self.assertEqual(plan["recommended_framework"], "frabric")


if __name__ == "__main__":
    unittest.main()
