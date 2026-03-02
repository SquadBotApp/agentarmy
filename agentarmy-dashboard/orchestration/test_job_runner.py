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

    async def execute(self, task_spec, context):
        return {"content": "execution output"}


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
