import unittest

from orchestration.competition_arena import CompetitionArena


class _Agent:
    def __init__(self, name, score):
        self.name = name
        self.score = score


class CompetitionArenaTest(unittest.TestCase):
    def test_launch_and_leaderboard(self):
        arena = CompetitionArena()
        agents = [_Agent("A", 3), _Agent("B", 7)]

        def task(agent):
            return {"score": agent.score, "output": agent.name}

        results = arena.launch_competition("basic", agents, task, rounds=2)
        self.assertEqual(len(results), 2)
        board = arena.get_leaderboard("basic")
        self.assertEqual(board[0]["agent"], "B")
        self.assertEqual(board[0]["total_score"], 14.0)

    def test_safety_gate_blocks_agent(self):
        arena = CompetitionArena()
        agents = [_Agent("safe", 5), _Agent("blocked", 9)]

        def task(agent):
            return {"score": agent.score}

        def gate(agent, result):
            if agent.name == "blocked":
                return {"allowed": False, "reason": "policy"}
            return {"allowed": True}

        arena.launch_competition("gated", agents, task, rounds=1, safety_gate=gate)
        board = arena.get_leaderboard("gated")
        self.assertEqual(board[0]["agent"], "safe")
        self.assertEqual(board[-1]["agent"], "blocked")
        self.assertEqual(board[-1]["total_score"], 0.0)

    def test_task_error_does_not_crash_competition(self):
        arena = CompetitionArena()
        agents = [_Agent("ok", 5), _Agent("boom", 1)]

        def task(agent):
            if agent.name == "boom":
                raise RuntimeError("failure")
            return {"score": agent.score}

        results = arena.launch_competition("errors", agents, task, rounds=1)
        self.assertEqual(len(results[0]), 2)
        boom = [r for r in results[0] if r["agent"] == "boom"][0]
        self.assertEqual(boom["status"], "error")
        self.assertEqual(boom["score"], 0.0)

    def test_invalid_inputs_raise(self):
        arena = CompetitionArena()
        with self.assertRaises(ValueError):
            arena.launch_competition("", [], lambda _: {}, rounds=1)
        with self.assertRaises(ValueError):
            arena.launch_competition("x", [_Agent("a", 1)], None, rounds=1)  # type: ignore[arg-type]
        with self.assertRaises(ValueError):
            arena.launch_competition("x", [_Agent("a", 1)], lambda _: {}, rounds=0)


if __name__ == "__main__":
    unittest.main()

