import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from executor import RegistryAgentExecutor
from job_runner import JobRunner
from agents.base_agent import BaseAgent


class FakeAgent(BaseAgent):
    def __init__(self):
        super().__init__(agent_id="executor", name="Fake", role="executor")

    async def execute(self, task_spec):
        await asyncio.sleep(0)
        return {"content": "execution output"}


class FakeN8N:
    def __init__(self):
        self.calls = []

    def is_enabled(self):
        return True

    def trigger(self, event_type, payload, workflow="default"):
        self.calls.append(
            {"event_type": event_type, "payload": payload, "workflow": workflow}
        )
        return {"enabled": True, "status": "accepted", "workflow": workflow}


class FakePlatformHub:
    def __init__(self):
        self.calls = []

    def default_targets(self):
        return ["openai_codex"]

    def dispatch(self, event_type, payload, targets):
        self.calls.append(
            {"event_type": event_type, "payload": payload, "targets": list(targets)}
        )
        return {t: {"status": "accepted"} for t in targets}


def fake_orchestrate(payload):
    return {
        "nextTaskId": "t1",
        "nextAgentId": "executor",
        "zpe": {"total": 0.8, "components": {}},
        "cpm": {"project_duration": 2.0, "critical_tasks": ["t1"]},
        "rationale": "test",
        "alternatives": [],
    }


def test_job_runner_full_loop():
    runner = JobRunner(fake_orchestrate, RegistryAgentExecutor({"executor": FakeAgent()}))
    payload = {
        "job": {"goal": "Ship feature"},
        "state": {
            "tasks": [
                {"id": "t1", "name": "Implement feature", "description": "Do implementation", "duration": 2}
            ],
            "history": [],
        },
        "previous_zpe": 0.5,
    }

    result = asyncio.run(runner.run_workflow(payload))

    assert "decision" in result
    assert "execution" in result
    assert result["execution"]["status"] == "completed"
    assert result["evaluation"]["status"] == "completed"
    assert result["metrics"]["workflow_latency_ms"] >= 0


def test_job_runner_triggers_n8n_when_enabled():
    fake_n8n = FakeN8N()
    runner = JobRunner(
        fake_orchestrate,
        RegistryAgentExecutor({"executor": FakeAgent()}),
        n8n=fake_n8n,
    )
    payload = {
        "job": {"goal": "Ship feature"},
        "state": {"tasks": [{"id": "t1", "name": "Implement", "description": "Do it", "duration": 1}], "history": []},
        "previous_zpe": 0.5,
        "integrations": {"n8n": {"enabled": True, "workflow": "agentarmy-default"}},
    }

    result = asyncio.run(runner.run_workflow(payload))

    assert result["integrations"]["n8n"]["status"] == "accepted"
    assert result["integrations"]["n8n"]["workflow"] == "agentarmy-default"
    assert len(fake_n8n.calls) == 1
    assert fake_n8n.calls[0]["event_type"] == "agentarmy.workflow.completed"


def test_job_runner_claudebot_routes_to_claudebot_workflow():
    fake_n8n = FakeN8N()
    runner = JobRunner(
        fake_orchestrate,
        RegistryAgentExecutor({"executor": FakeAgent()}),
        n8n=fake_n8n,
    )
    payload = {
        "job": {"goal": "Run CLaudebot for release notes"},
        "state": {"tasks": [{"id": "t1", "name": "Implement", "description": "Do it", "duration": 1}], "history": []},
        "previous_zpe": 0.5,
        "integrations": {"n8n": {"enabled": True}},
    }

    result = asyncio.run(runner.run_workflow(payload))

    assert result["integrations"]["n8n"]["workflow"] == "claudebot"


def test_job_runner_uses_requested_framework():
    fake_n8n = FakeN8N()
    runner = JobRunner(
        fake_orchestrate,
        RegistryAgentExecutor({"executor": FakeAgent()}),
        n8n=fake_n8n,
    )
    payload = {
        "job": {"goal": "Ship feature"},
        "state": {"tasks": [{"id": "t1", "name": "Implement", "description": "Do it", "duration": 1}], "history": []},
        "previous_zpe": 0.5,
        "framework": "crewai",
    }

    result = asyncio.run(runner.run_workflow(payload))

    assert result["metrics"]["framework_used"] == "crewai"
    assert result["execution"]["metrics"]["framework_used"] == "crewai"


def test_job_runner_dispatches_platform_integrations():
    fake_n8n = FakeN8N()
    fake_hub = FakePlatformHub()
    runner = JobRunner(
        fake_orchestrate,
        RegistryAgentExecutor({"executor": FakeAgent()}),
        n8n=fake_n8n,
        platform_hub=fake_hub,
    )
    payload = {
        "job": {"goal": "Ship feature"},
        "state": {"tasks": [{"id": "t1", "name": "Implement", "description": "Do it", "duration": 1}], "history": []},
        "previous_zpe": 0.5,
        "integrations": {
            "platforms": {
                "enabled": True,
                "targets": ["openai_codex", "google_jules", "roo_code"],
            }
        },
    }

    result = asyncio.run(runner.run_workflow(payload))

    assert "platforms" in result["integrations"]
    assert result["integrations"]["platforms"]["openai_codex"]["status"] == "accepted"
    assert len(fake_hub.calls) == 1
    assert fake_hub.calls[0]["targets"] == ["openai_codex", "google_jules", "roo_code"]


def test_job_runner_dispatches_mobile_vendor_targets():
    fake_n8n = FakeN8N()
    fake_hub = FakePlatformHub()
    runner = JobRunner(
        fake_orchestrate,
        RegistryAgentExecutor({"executor": FakeAgent()}),
        n8n=fake_n8n,
        platform_hub=fake_hub,
    )
    payload = {
        "job": {"goal": "Ship mobile release"},
        "state": {"tasks": [{"id": "t1", "name": "Implement", "description": "Do it", "duration": 1}], "history": []},
        "previous_zpe": 0.5,
        "integrations": {
            "mobile": {
                "enabled": True,
                "vendors": ["apple", "google"],
            }
        },
    }

    result = asyncio.run(runner.run_workflow(payload))

    assert "platforms" in result["integrations"]
    assert result["integrations"]["platforms"]["apple_mobile"]["status"] == "accepted"
    assert result["integrations"]["platforms"]["google_mobile"]["status"] == "accepted"
    assert fake_hub.calls[0]["targets"] == ["apple_mobile", "google_mobile"]
