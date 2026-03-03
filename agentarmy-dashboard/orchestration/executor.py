import inspect
import time
from typing import Dict, Any, Optional

from agents import PlannerAgent, ExecutorAgent, CriticAgent, SynthesizerAgent
from frameworks import get_framework_adapter, normalize_framework_name

class AgentExecutor:
    """
    Executes decisions returned by the orchestrator by dispatching to specific agents.
    Implements the execution layer defined in Phase 2 of the Platform Roadmap.
    """
    
    def __init__(self):
        self._agents = {}
        self.register_agent("planner", PlannerAgent())
        self.register_agent("executor", ExecutorAgent())
        self.register_agent("critic", CriticAgent())
        self.register_agent("synthesizer", SynthesizerAgent())

    def register_agent(self, agent_id: str, agent_instance: Any):
        """Register an agent instance to handle tasks."""
        self._agents[agent_id] = agent_instance

    def _load_agent(self, agent_id: str):
        """Load agent by ID. Raises ValueError if not found."""
        if agent_id not in self._agents:
            raise ValueError(f"Agent '{agent_id}' not found in registry.")
        return self._agents[agent_id]

    async def _invoke(self, fn, spec):
        value = fn(spec)
        if inspect.isawaitable(value):
            return await value
        return value

    async def execute(
        self,
        task_id: str,
        agent_id: str,
        task_spec: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
        framework: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run agent on task and return outcome with metrics.
        """
        start_time = time.time()
        status = "pending"
        result = None
        error = None
        framework_name = normalize_framework_name(framework)
        framework_adapter = get_framework_adapter(framework_name)

        try:
            agent = self._load_agent(agent_id)
            # Merge context into task_spec while preserving any existing context fields.
            if context:
                merged_context = {}
                if isinstance(task_spec.get("context"), dict):
                    merged_context.update(task_spec["context"])
                merged_context.update(context)
                spec = task_spec | {"context": merged_context}
            else:
                spec = task_spec
            # Support both async and sync agents
            if framework_name != "native":
                result = await framework_adapter.run(
                    role=agent_id,
                    task_spec=spec,
                    context=context or {},
                    native_execute=agent.execute,
                )
            else:
                result = await self._invoke(agent.execute, spec)

            # Normalize wrapper status to reflect the agent-level outcome.
            if isinstance(result, dict):
                agent_status = str(result.get("status", "")).lower()
                if agent_status in {"failed", "blocked"}:
                    status = agent_status
                    error = result.get("error")
                else:
                    status = "completed"
            else:
                status = "completed"
        except Exception as e:
            status = "failed"
            error = str(e)
            
        latency_ms = (time.time() - start_time) * 1000

        return {
            "task_id": task_id,
            "agent_id": agent_id,
            "status": status,
            "output": result,
            "error": error,
            "metrics": {
                "latency_ms": latency_ms,
                "framework_used": framework_name,
                # Assuming result contains token usage if successful
                "tokens": (
                    result.get("tokens")
                    or result.get("tokens_used")
                    or (result.get("metrics", {}) or {}).get("tokens_used", 0)
                ) if isinstance(result, dict) else 0
            }
        }

class RegistryAgentExecutor(AgentExecutor):
    """Executor initialized with a specific set of agents."""
    def __init__(self, agents: Dict[str, Any]):
        super().__init__()
        self._agents.update(agents)
