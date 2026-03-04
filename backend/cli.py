import argparse
import sys
from backend.app import AgentsRegistry, TaskQueue, EventBus
from backend.agent import Agent
from backend.sim_engine import Environment, Simulation, Billing

def main():
    parser = argparse.ArgumentParser(description="AgentArmyOS CLI")
    parser.add_argument("start", action="store_true", help="Start the Sim Engine loop")
    parser.add_argument("--agents", action="store_true", help="List all agents")
    args = parser.parse_args()

    env = Environment()
    billing = Billing(free_steps=10)
    agents = [
        Agent(id="agent_1", tier=3),
        Agent(id="agent_2", tier=6),
        Agent(id="agent_3", tier=9),
    ]
    registry = AgentsRegistry(agents)
    task_queue = TaskQueue()
    event_bus = EventBus()
    sim = Simulation(env, registry, task_queue, event_bus, billing)

    if args.agents:
        for a in agents:
            print(f"Agent: {a.id} (tier {a.tier})")
        sys.exit(0)

    if args.start:
        print("Starting Sim Engine loop. Press Ctrl+C to stop.")
        try:
            while True:
                sim.step()
        except KeyboardInterrupt:
            print("\nSim Engine stopped.")

if __name__ == "__main__":
    main()
