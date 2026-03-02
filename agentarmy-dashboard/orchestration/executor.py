import asyncio
import time
from typing import Dict, Any, Optional

from agents import PlannerAgent, ExecutorAgent, CriticAgent, SynthesizerAgent

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

    async def execute(self, task_id: str, agent_id: str, task_spec: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Run agent on task and return outcome with metrics.
        """
        start_time = time.time()
        status = "pending"
        result = None
        error = None

        try:
            agent = self._load_agent(agent_id)
            # Merge context into task_spec if provided
            spec = task_spec | {"context": context} if context else task_spec
            # Support both async and sync agents
            if asyncio.iscoroutinefunction(agent.execute):
                result = await agent.execute(spec)
            else:
                result = agent.execute(spec)
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
                # Assuming result contains token usage if successful
                "tokens": result.get("tokens", 0) if isinstance(result, dict) else 0
            }
        }

class RegistryAgentExecutor(AgentExecutor):
    """Executor initialized with a specific set of agents."""
    def __init__(self, agents: Dict[str, Any]):
        super().__init__()
        self._agents.update(agents)