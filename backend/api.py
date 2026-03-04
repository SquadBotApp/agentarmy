from fastapi import FastAPI
from backend.agent import Agent
from backend.sim_engine import Environment, Simulation, Billing
from backend.app import AgentsRegistry, TaskQueue, EventBus
import threading
import time

app = FastAPI()

# --- Boot the Sim AI engine (shared instance) ---
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

# --- Background thread to run the simulation loop ---
def run_sim():
    while True:
        sim.step()
        time.sleep(0.1)

threading.Thread(target=run_sim, daemon=True).start()

@app.get("/agents")
def list_agents():
    return [{"id": a.id, "tier": a.tier} for a in agents]

@app.get("/env")
def get_env():
    return {"state": str(env)}

# Add more endpoints as needed for tasks, events, control, etc.
