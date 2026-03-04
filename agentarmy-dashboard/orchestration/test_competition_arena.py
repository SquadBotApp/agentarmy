

import pytest
import asyncio
import math
from orchestration.competition_arena import CompetitionArena

class _Agent:
    def __init__(self, name, score):
        self.name = name
        self.score = score

@pytest.mark.asyncio
async def test_launch_and_leaderboard():
    arena = CompetitionArena()
    agents = [_Agent("A", 3), _Agent("B", 7)]

    def task(agent):
        return {"score": agent.score, "output": agent.name}

    results = await arena.launch_competition("basic", agents, task, rounds=2)
    assert len(results) == 2
    board = arena.get_leaderboard("basic")
    assert board[0]["agent"] == "B"
    assert math.isclose(board[0]["total_score"], 14.0, rel_tol=1e-9)

@pytest.mark.asyncio
async def test_safety_gate_blocks_agent():
    arena = CompetitionArena()
    agents = [_Agent("safe", 5), _Agent("blocked", 9)]

    def task(agent):
        return {"score": agent.score}

    def gate(agent, result):
        if agent.name == "blocked":
            return {"allowed": False, "reason": "policy"}
        return {"allowed": True}

    await arena.launch_competition("gated", agents, task, rounds=1, safety_gate=gate)
    board = arena.get_leaderboard("gated")
    assert board[0]["agent"] == "safe"
    assert board[-1]["agent"] == "blocked"
    assert math.isclose(board[-1]["total_score"], 0.0, rel_tol=1e-9)

@pytest.mark.asyncio
async def test_task_error_does_not_crash_competition():
    arena = CompetitionArena()
    agents = [_Agent("ok", 5), _Agent("boom", 1)]

    def task(agent):
        if agent.name == "boom":
            raise RuntimeError("failure")
        return {"score": agent.score}

    results = await arena.launch_competition("errors", agents, task, rounds=1)
    assert len(results[0]) == 2
    boom = [r for r in results[0] if r["agent"] == "boom"][0]
    assert boom["status"] == "error"
    assert math.isclose(boom["score"], 0.0, rel_tol=1e-9)

@pytest.mark.asyncio
async def test_invalid_inputs_raise():
    arena = CompetitionArena()
    with pytest.raises(ValueError):
        await arena.launch_competition("", [], lambda _: {}, rounds=1)
    with pytest.raises(ValueError):
        await arena.launch_competition("x", [_Agent("a", 1)], None, rounds=1)  # type: ignore[arg-type]
    with pytest.raises(ValueError):

        await arena.launch_competition("x", [_Agent("a", 1)], lambda _: {}, rounds=0)

