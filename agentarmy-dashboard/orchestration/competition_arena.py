"""
Competition Arena: deterministic multi-agent competition engine for AgentArmyOS.
"""
from __future__ import annotations

import asyncio
import inspect
from dataclasses import dataclass
from time import perf_counter
from typing import Any, Callable, Dict, List, Optional


TaskFn = Callable[[Any], Dict[str, Any]]
SafetyGateFn = Callable[[Any, Dict[str, Any]], Dict[str, Any]]
EventListener = Callable[[Dict[str, Any]], None]


@dataclass
class RoundEntry:
    agent: str
    round_index: int
    score: float
    latency_ms: float
    passed_safety: bool
    blocked_reason: Optional[str]
    status: str
    result: Dict[str, Any]


class CompetitionArena:
    def __init__(self):
        self.competitions: Dict[str, List[List[Dict[str, Any]]]] = {}
        self.leaderboard: Dict[str, List[Dict[str, Any]]] = {}
        self.listeners: List[EventListener] = []

    def register_listener(self, callback: EventListener):
        self.listeners.append(callback)

    def notify(self, event: Dict[str, Any]):
        for cb in self.listeners:
            try:
                cb(event)
            except Exception:
                # Listener failures should never break arena execution.
                continue

    @staticmethod
    def _agent_name(agent: Any) -> str:
        return str(getattr(agent, "name", None) or getattr(agent, "agent_id", None) or repr(agent))

    @staticmethod
    def _validate_inputs(name: str, agents: List[Any], task: TaskFn, rounds: int):
        if not str(name or "").strip():
            raise ValueError("competition name is required")
        if not isinstance(agents, list) or not agents:
            raise ValueError("agents must be a non-empty list")
        if not callable(task):
            raise ValueError("task must be callable")
        if not isinstance(rounds, int) or rounds <= 0:
            raise ValueError("rounds must be a positive integer")

    @staticmethod
    async def _run_task(func: Callable, *args: Any) -> Any:
        res = func(*args)
        return await res if inspect.isawaitable(res) else res

    async def _run_agent_round(
        self,
        agent: Any,
        agent_name: str,
        round_index: int,
        task: TaskFn,
        safety_gate: Optional[SafetyGateFn],
        competition_name: str,
    ) -> Dict[str, Any]:
        start = perf_counter()
        try:
            raw_result = await self._run_task(task, agent) or {}
            if not isinstance(raw_result, dict):
                raw_result = {"score": 0, "output": str(raw_result)}
            score = float(raw_result.get("score", 0) or 0)
            status = "ok"
        except Exception as err:
            raw_result = {"score": 0, "error": str(err)}
            score = 0.0
            status = "error"

        safety_verdict = {"allowed": True, "reason": None}
        if callable(safety_gate):
            try:
                safety_verdict = await self._run_task(safety_gate, agent, raw_result) or {"allowed": True, "reason": None}
            except Exception as err:
                safety_verdict = {"allowed": False, "reason": f"safety_gate_error: {err}"}

        allowed = bool(safety_verdict.get("allowed", True))
        if not allowed:
            score = 0.0
            status = "blocked"

        latency_ms = (perf_counter() - start) * 1000.0
        entry = RoundEntry(
            agent=agent_name,
            round_index=round_index,
            score=score,
            latency_ms=latency_ms,
            passed_safety=allowed,
            blocked_reason=safety_verdict.get("reason"),
            status=status,
            result=raw_result,
        )
        payload = {
            "agent": entry.agent,
            "round": entry.round_index,
            "score": entry.score,
            "latency_ms": round(entry.latency_ms, 3),
            "passed_safety": entry.passed_safety,
            "blocked_reason": entry.blocked_reason,
            "status": entry.status,
            "result": entry.result,
        }
        self.notify({"type": "round_result", "competition": competition_name, **payload})
        return payload

    async def launch_competition(
        self,
        name: str,
        agents: List[Any],
        task: TaskFn,
        rounds: int = 1,
        safety_gate: Optional[SafetyGateFn] = None,
    ) -> List[List[Dict[str, Any]]]:
        self._validate_inputs(name, agents, task, rounds)

        results: List[List[Dict[str, Any]]] = []
        self.notify(
            {
                "type": "competition_started",
                "competition": name,
                "rounds": rounds,
                "agents": [self._agent_name(a) for a in agents],
            }
        )

        for r in range(rounds):
            round_results: List[Dict[str, Any]] = []
            for agent in agents:
                agent_name = self._agent_name(agent)
                payload = await self._run_agent_round(
                    agent, agent_name, r + 1, task, safety_gate, name
                )
                round_results.append(payload)
            results.append(round_results)

        self.competitions[name] = results
        leaderboard = self.update_leaderboard(name, results)
        self.notify(
            {
                "type": "competition_complete",
                "competition": name,
                "results": results,
                "leaderboard": leaderboard,
            }
        )
        return results

    def update_leaderboard(self, name: str, results: List[List[Dict[str, Any]]]):
        scores: Dict[str, Dict[str, Any]] = {}
        for round_results in results:
            if not isinstance(round_results, list):
                continue
            if not round_results:
                continue
            round_max = max(float(entry.get("score", 0) or 0) for entry in round_results)
            for entry in round_results:
                agent = str(entry.get("agent", "unknown"))
                score = float(entry.get("score", 0) or 0)
                latency = float(entry.get("latency_ms", 0) or 0)
                s = scores.setdefault(
                    agent,
                    {"agent": agent, "total_score": 0.0, "wins": 0, "rounds": 0, "avg_latency_ms": 0.0},
                )
                s["total_score"] += score
                s["rounds"] += 1
                s["avg_latency_ms"] += latency
                if score == round_max:
                    s["wins"] += 1

        for item in scores.values():
            rounds = max(1, int(item["rounds"]))
            item["avg_latency_ms"] = item["avg_latency_ms"] / rounds
            item["total_score"] = round(item["total_score"], 6)
            item["avg_latency_ms"] = round(item["avg_latency_ms"], 6)

        board = sorted(
            scores.values(),
            key=lambda x: (-x["total_score"], -x["wins"], x["avg_latency_ms"], x["agent"]),
        )
        self.leaderboard[name] = board
        return board

    def get_leaderboard(self, name: str = None):
        return self.leaderboard.get(name, []) if name else self.leaderboard

    def get_competition(self, name: str):
        return self.competitions.get(name, [])


# Example agent stub for demo
class DemoAgent:
    def __init__(self, name):
        self.name = name

    def act(self, task):
        # Deterministic score based on agent name length for demo stability.
        return {"score": len(self.name), "output": f"{self.name} did {task}"}


if __name__ == "__main__":
    arena = CompetitionArena()
    agents = [DemoAgent("Claude"), DemoAgent("3CX"), DemoAgent("Copilot")]

    def task(agent):
        return agent.act("summarize call")

    async def main():
        await arena.launch_competition("Summarization", agents, task, rounds=3)
        print("Leaderboard:", arena.get_leaderboard("Summarization"))

    asyncio.run(main())
