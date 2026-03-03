"""
EducationCenter top-level domain implementation.
"""
from copy import deepcopy
from typing import Any, Dict

from .assessment_agent import AssessmentAgent
from .curriculum_agent import CurriculumAgent
from .events import (
    EDU_ASSESSMENT_COMPLETED,
    EDU_LESSON_GENERATED,
    EDU_PROGRESS_UPDATED,
    EDU_REWARD_ISSUED,
    EDU_SESSION_BLOCKED,
    EDU_SESSION_STARTED,
    EDU_SIMULATION_REQUESTED,
)
from .knowledge_agent import KnowledgeAgent
from .learning_style_agent import LearningStyleAgent
from .policies import age_band, classify_topic, get_default_policies
from .progress_agent import ProgressAgent
from .runtime_hooks import EducationRuntimeHooks
from .safety_agent import SafetyAgent
from .simulation_agent import SimulationAgent


def _safe_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


class EducationCenter:
    def attach_event_bus(self, event_bus):
        """No-op for compatibility with agent registration."""
        pass
    """
    Sovereign learning domain coordinating six teaching agents + safety enforcement.
    """

    def __init__(self, runtime):
        self.runtime = runtime
        self.hooks = EducationRuntimeHooks(runtime)
        self.policies = get_default_policies()
        self.state = {
            "learners": {},
            "sessions": {},
            "events": [],
        }

        self.knowledge_agent = KnowledgeAgent(self)
        self.curriculum_agent = CurriculumAgent(self)
        self.assessment_agent = AssessmentAgent(self)
        self.simulation_agent = SimulationAgent(self)
        self.learning_style_agent = LearningStyleAgent(self)
        self.progress_agent = ProgressAgent(self)
        self.safety_agent = SafetyAgent(self)
        self.agents = [
            self.knowledge_agent,
            self.curriculum_agent,
            self.assessment_agent,
            self.simulation_agent,
            self.learning_style_agent,
            self.progress_agent,
        ]

    def bootstrap(self):
        self.register_with_runtime()
        return {
            "domain": "education_center",
            "registered_agents": [agent.name for agent in self.agents],
            "policies_version": self.policies.get("version"),
        }

    def register_with_runtime(self):
        if hasattr(self.runtime, "register_domain"):
            self.runtime.register_domain("education_center", self)
        if hasattr(self.runtime, "register_agent"):
            for agent in self.agents:
                self.runtime.register_agent(agent.name, agent)

    def _publish(self, event_type: str, payload: Dict[str, Any]):
        event = {"type": event_type, "payload": payload}
        self.state["events"] = [event, *self.state["events"]][:500]
        event_bus = getattr(self.runtime, "event_bus", None)
        if event_bus and hasattr(event_bus, "publish"):
            from orchestration.runtime_core.event_bus import Event

            event_bus.publish(Event(event_type, payload))

    def _learner(self, learner_id: str, profile: Dict[str, Any]):
        if current := self.state["learners"].get(learner_id):
            return current
        age = _safe_int(profile.get("age", 18), 18)
        learner = {
            "learner_id": learner_id,
            "age": age,
            "age_band": age_band(age, self.policies),
            "level": str(profile.get("level", "beginner")),
            "style": str(profile.get("style", "mixed")),
            "mastery": _safe_int(profile.get("mastery", 0), 0),
            "completed_sessions": 0,
            "reward_balance": 0,
        }
        self.state["learners"][learner_id] = learner
        return learner

    def start_session(self, request: Dict[str, Any]):
        learner_id = str(request.get("learner_id") or "anonymous")
        topic = str(request.get("topic") or "general literacy")
        learner = self._learner(learner_id, request.get("learner_profile", {}))
        safety = self.safety_agent.filter_content(topic, learner)
        defensive = self.hooks.defensive_check(safety["topic_safety"], learner)
        governance = self.hooks.governance_check(safety["topic_safety"], learner)

        if not defensive["allowed"] or not governance["allowed"] or not safety["allowed"]:
            payload = {
                "learner_id": learner_id,
                "topic": topic,
                "reason": "blocked_by_policy",
                "safety": safety,
                "defensive": defensive,
                "governance": governance,
            }
            self._publish(EDU_SESSION_BLOCKED, payload)
            return {"status": "blocked", **payload}

        path = self.curriculum_agent.build_path(topic, learner)
        explanation = self.knowledge_agent.explain(topic, learner["level"], learner["style"])
        swarm_plan = self.hooks.swarm_teaching_plan(topic, learner["level"])
        session_id = f"edu-{len(self.state['sessions']) + 1}"
        session = {
            "session_id": session_id,
            "learner_id": learner_id,
            "topic": topic,
            "path": path,
            "swarm_plan": swarm_plan,
            "status": "active",
        }
        self.state["sessions"][session_id] = session

        self._publish(EDU_SESSION_STARTED, {"session_id": session_id, "learner_id": learner_id, "topic": topic})
        self._publish(EDU_LESSON_GENERATED, {"session_id": session_id, "lesson": explanation})
        return {
            "status": "active",
            "session": session,
            "lesson": explanation,
            "policies": {
                "defensive": defensive,
                "governance": governance,
            },
        }

    def submit_assessment(self, request: Dict[str, Any]):
        session_id = str(request.get("session_id") or "")
        session = self.state["sessions"].get(session_id)
        if not session:
            return {"status": "failed", "error": "session_not_found"}
        learner = self.state["learners"][session["learner_id"]]
        score = self.assessment_agent.score_submission(request.get("submission", {}))
        reward = self.hooks.economic_reward(score, self.policies["reward_policy"])

        learner["mastery"] = max(0, min(100, learner["mastery"] + int(score / 10)))
        if score >= self.policies["reward_policy"]["pass_threshold"]:
            learner["completed_sessions"] += 1
            learner["reward_balance"] += reward
            session["status"] = "completed"

        progress = self.progress_agent.track(learner)
        adaptation = self.learning_style_agent.adapt(learner, {"confused": score < 50})

        payload = {
            "session_id": session_id,
            "learner_id": learner["learner_id"],
            "score": score,
            "progress": progress,
            "adaptation": adaptation,
        }
        self._publish(EDU_ASSESSMENT_COMPLETED, payload)
        self._publish(EDU_PROGRESS_UPDATED, {"learner_id": learner["learner_id"], "progress": progress})
        if reward > 0:
            self._publish(EDU_REWARD_ISSUED, {"learner_id": learner["learner_id"], "reward": reward})
        return {"status": "recorded", "score": score, "reward": reward, "progress": progress, "adaptation": adaptation}

    def generate_simulation(self, request: Dict[str, Any]):
        session_id = str(request.get("session_id") or "")
        session = self.state["sessions"].get(session_id)
        if not session:
            return {"status": "failed", "error": "session_not_found"}
        learner = self.state["learners"][session["learner_id"]]
        simulation = self.simulation_agent.simulate(session["topic"], learner)
        self._publish(EDU_SIMULATION_REQUESTED, {"session_id": session_id, "simulation": simulation})
        return {"status": "ok", "simulation": simulation}

    def get_policy(self):
        return deepcopy(self.policies)

    def get_state(self):
        return {
            "domain": "education_center",
            "learners": list(self.state["learners"].values()),
            "sessions": list(self.state["sessions"].values()),
            "events": list(self.state["events"][:50]),
            "policy_version": self.policies.get("version"),
        }

