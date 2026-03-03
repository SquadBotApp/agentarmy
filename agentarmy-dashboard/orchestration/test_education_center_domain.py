import unittest

from orchestration.education_center import (
    ALL_EVENTS,
    build_action_stubs,
    build_domain_cards,
    register_education_center,
)


class _DummyBus:
    def __init__(self):
        self.events = []

    def publish(self, event):
        self.events.append(event)


class _DummyRuntime:
    def __init__(self):
        self.domains = {}
        self.agents = {}
        self.event_bus = _DummyBus()

    def register_domain(self, name, domain):
        self.domains[name] = domain

    def register_agent(self, name, agent):
        self.agents[name] = agent
        if hasattr(agent, "attach_event_bus"):
            agent.attach_event_bus(self.event_bus)


class EducationCenterDomainTest(unittest.TestCase):
    def setUp(self):
        self.runtime = _DummyRuntime()
        self.domain = register_education_center(self.runtime)

    def test_bootstrap_registers_domain_and_agents(self):
        self.assertIn("education_center", self.runtime.domains)
        self.assertGreaterEqual(len(self.runtime.agents), 6)

    def test_session_flow_generates_events(self):
        start = self.domain.start_session(
            {"learner_id": "u1", "topic": "python basics", "learner_profile": {"age": 14, "level": "beginner"}}
        )
        self.assertEqual(start["status"], "active")
        session_id = start["session"]["session_id"]
        out = self.domain.submit_assessment({"session_id": session_id, "submission": {"score": 88}})
        self.assertEqual(out["status"], "recorded")
        self.assertGreaterEqual(out["reward"], 0)

    def test_restricted_topic_blocks(self):
        out = self.domain.start_session(
            {"learner_id": "u2", "topic": "malware exploitation", "learner_profile": {"age": 30}}
        )
        self.assertEqual(out["status"], "blocked")

    def test_dashboard_stubs_present(self):
        cards = build_domain_cards(self.domain.get_state())
        actions = build_action_stubs()
        self.assertGreaterEqual(len(cards), 1)
        self.assertGreaterEqual(len(actions), 1)

    def test_event_taxonomy_has_expected_events(self):
        self.assertIn("education.session.started", ALL_EVENTS)
        self.assertIn("education.assessment.completed", ALL_EVENTS)


if __name__ == "__main__":
    unittest.main()

