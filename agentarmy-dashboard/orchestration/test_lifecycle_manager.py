import unittest

from orchestration.lifecycle_manager import AgentVersion, LifecycleManager, RiskLevel, SafetyPosture


class LifecycleManagerTest(unittest.TestCase):
    def setUp(self):
        self.mgr = LifecycleManager()
        self.agent, _ = self.mgr.create_agent(
            name="tester",
            role="executor",
            tools=["shell"],
            safety_posture=SafetyPosture.HIGH,
        )

    def test_deploy_only_from_candidate_or_staging(self):
        deployed, _ = self.mgr.deploy_agent(self.agent.agent_id)
        self.assertEqual(deployed.stage.value, "active")
        with self.assertRaises(ValueError):
            self.mgr.deploy_agent(self.agent.agent_id)

    def test_unfreeze_requires_frozen_stage(self):
        with self.assertRaises(ValueError):
            self.mgr.unfreeze_agent(self.agent.agent_id)
        self.mgr.freeze_agent(self.agent.agent_id)
        with self.assertRaises(ValueError):
            self.mgr.unfreeze_agent(self.agent.agent_id, actor="user")
        event = self.mgr.unfreeze_agent(self.agent.agent_id, actor="user:root")
        self.assertEqual(event.event_type.value, "unfreeze")

    def test_demote_requires_privileged_actor_when_weakening(self):
        with self.assertRaises(ValueError):
            self.mgr.demote_agent(self.agent.agent_id, SafetyPosture.RELAXED, actor="user")
        event = self.mgr.demote_agent(self.agent.agent_id, SafetyPosture.RELAXED, actor="governor")
        self.assertEqual(event.event_type.value, "demotion")

    def test_merge_self_is_blocked(self):
        with self.assertRaises(ValueError):
            self.mgr.merge_agents(self.agent.agent_id, self.agent.agent_id)

    def test_unlock_tools_requires_privileged_actor(self):
        self.mgr.lock_tools(self.agent.agent_id)
        with self.assertRaises(ValueError):
            self.mgr.unlock_tools(self.agent.agent_id, actor="user")
        event = self.mgr.unlock_tools(self.agent.agent_id, actor="governor")
        self.assertEqual(event.event_type.value, "tool_unlock")

    def test_human_approved_evolution_requires_privileged_actor(self):
        proposed = AgentVersion(
            tools=["shell"],
            safety_posture=SafetyPosture.RELAXED,
            risk_level=RiskLevel.HIGH,
            qb_efficiency=1.0,
            specialization_tags=["executor"],
        )
        with self.assertRaises(ValueError):
            self.mgr.evolve_agent(self.agent.agent_id, proposed, actor="user:dev", human_approved=True)


if __name__ == "__main__":
    unittest.main()
