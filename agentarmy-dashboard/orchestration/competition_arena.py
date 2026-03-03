"""
Competition Arena: Multi-agent competition and collaboration engine for AgentArmyOS.
"""

from typing import List, Dict, Any, Callable
import threading
import time

class CompetitionArena:
    def __init__(self):
        self.competitions = {}
        self.leaderboard = {}
        self.listeners = []

    def register_listener(self, callback: Callable[[Dict[str, Any]], None]):
        self.listeners.append(callback)

    def notify(self, event: Dict[str, Any]):
        for cb in self.listeners:
            cb(event)

    def launch_competition(self, name: str, agents: List[Any], task: Callable[[Any], Dict[str, Any]], rounds: int = 1):
        results = []
        for r in range(rounds):
            round_results = []
            for agent in agents:
                result = task(agent)
                round_results.append({"agent": agent.name, "result": result})
                self.notify({"type": "round_result", "competition": name, "round": r+1, "agent": agent.name, "result": result})
            results.append(round_results)
        self.competitions[name] = results
        self.update_leaderboard(name, results)
        self.notify({"type": "competition_complete", "competition": name, "results": results})
        return results

    def update_leaderboard(self, name: str, results: List[List[Dict[str, Any]]]):
        scores = {}
        for round_results in results:
            for entry in round_results:
                agent = entry["agent"]
                score = entry["result"].get("score", 0)
                scores[agent] = scores.get(agent, 0) + score
        self.leaderboard[name] = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    def get_leaderboard(self, name: str = None):
        if name:
            return self.leaderboard.get(name, [])
        return self.leaderboard

# Example agent stub for demo
class DemoAgent:
    def __init__(self, name):
        self.name = name
    def act(self, task):
        # Simulate agent action
        return {"score": int(time.time()) % 10, "output": f"{self.name} did {task}"}

# Example usage (to be replaced by API/dashboard integration)
if __name__ == "__main__":
    arena = CompetitionArena()
    agents = [DemoAgent("Claude"), DemoAgent("3CX"), DemoAgent("Copilot")]
    def task(agent):
        return agent.act("summarize call")
    arena.launch_competition("Summarization", agents, task, rounds=3)
    print("Leaderboard:", arena.get_leaderboard("Summarization"))
