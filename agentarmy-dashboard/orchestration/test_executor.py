import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents.base_agent import BaseAgent
from executor import RegistryAgentExecutor


class FakeAgent(BaseAgent):
    def __init__(self):
        super().__init__(agent_id="executor", name="Fake", role="executor")

    async def execute(self, task_spec, context):
        return {"content": f"done:{task_spec.get('name', 'task')}"}


def test_registry_agent_executor_success():
    exec_layer = RegistryAgentExecutor({"executor": FakeAgent()})
    result = asyncio.run(exec_layer.execute("t1", "executor", {"name": "compile"}, {}))

    assert result["status"] == "completed"
    assert result["task_id"] == "t1"
    assert result["agent_id"] == "executor"
    assert "done:compile" in result["output"]["content"]
    assert result["metrics"]["latency_ms"] >= 0
