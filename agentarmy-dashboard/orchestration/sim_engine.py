from typing import List, Optional, Any


class Environment:
    def __init__(self):
        self.state = {}
        self.events = []

    def get_observation(self, agent) -> dict:
        # Later: scope by agent, privileges, etc.
        return {
            "state": self.state,
            "events": list(self.events),
            "agent_id": agent.id,
            "agent_tier": agent.tier,
        }

    def apply_action(self, agent, action: dict) -> dict:
        """
        action: {
            "type": "update_state" | "emit_event" | "call_tool" | ...,
            "payload": {...}
        }
        """
        result = {"ok": True, "effect": None}

        atype = action.get("type")
        payload = action.get("payload", {})

        if atype == "update_state":
            self.state.update(payload)
            result["effect"] = {"state_updated": payload}

        elif atype == "emit_event":
            self.events.append(payload)
            result["effect"] = {"event_emitted": payload}

        elif atype == "noop":
            result["effect"] = {"noop": True}

        else:
            result["ok"] = False
            result["error"] = f"Unknown action type: {atype}"

        return result


class Billing:
    def __init__(self, free_steps: int = 10):
        self.free_steps = free_steps
        self.usage = {}  # agent_id -> steps_used

    def allow(self, agent, reason: str, payload: Optional[Any]) -> bool:
        aid = agent.id

        if getattr(agent, "is_system", lambda: False)():
            return True

        used = self.usage.get(aid, 0)

        if used < self.free_steps:
            self.usage[aid] = used + 1
            return True

        # Past free tier → require tier >= 6 (paid / upgraded)
        if getattr(agent, "tier", 3) >= 6:
            self.usage[aid] = used + 1
            return True

        self._trigger_paywall(agent, used)
        return False

    def _trigger_paywall(self, agent, used: int):
        # TODO: integrate with your real UX / API
        print(
            f"[PAYWALL] Agent {agent.id} used {used} steps. "
            f"Upgrade to tier 6/9 to continue hybrid Sim AI."
        )


class Simulation:
    def __init__(self, env: Environment, agents, task_queue, event_bus, billing: Billing):
        """
        agents: something that can:
            - .always_on()
            - .subscribed_to(event)
            - .for_task(task)
        task_queue: something that can:
            - .pop_ready()
        event_bus: something that can:
            - .consume()
        """
        self.env = env
        self.agents = agents
        self.task_queue = task_queue
        self.event_bus = event_bus
        self.billing = billing

    def step(self):
        # 1) Continuous agents
        for agent in self.agents.always_on():
            self._run_agent_cycle(agent, reason="continuous")

        # 2) Event-driven agents
        for event in self.event_bus.consume():
            for agent in self.agents.subscribed_to(event):
                self._run_agent_cycle(agent, reason="event", payload=event)

        # 3) Task-driven agents
        while True:
            task = self.task_queue.pop_ready()
            if not task:
                break
            agent = self.agents.for_task(task)
            if agent is None:
                continue
            self._run_agent_cycle(agent, reason="task", payload=task)

    def _run_agent_cycle(self, agent, reason: str, payload: Optional[Any] = None):
        if not self.billing.allow(agent, reason, payload):
            return

        obs = self.env.get_observation(agent)
        action = agent.decide(obs, reason=reason, payload=payload)
        result = self.env.apply_action(agent, action)
        agent.update_memory(result)
