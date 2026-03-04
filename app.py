import os

from sim_engine import Environment, Simulation, Billing
from agent import Agent

# --- Minimal registries so the engine runs ---

class AgentsRegistry:
    def __init__(self, agents):
        self.agents = agents

    def always_on(self):
        return [a for a in self.agents if a.tier >= 3]

    def subscribed_to(self, event):
        return self.agents  # simple: all agents see all events

    def for_task(self, task):
        return self.agents[0]  # simple: first agent handles tasks


class TaskQueue:
    def __init__(self):
        self.queue = []

    def pop_ready(self):
        if self.queue:
            return self.queue.pop(0)
        return None


class EventBus:
    def __init__(self):
        self.events = []

    def consume(self):
        events = list(self.events)
        self.events.clear()
        return events


# --- Boot the Sim AI engine ---

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

# --- Run the hybrid loop forever ---
while True:
    sim.step()

# Load API keys
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")

if not OPENAI_KEY or not ANTHROPIC_KEY:
    raise RuntimeError("Missing API keys. Set OPENAI_API_KEY and ANTHROPIC_API_KEY.")

# Initialize providers
openai_provider = OpenAIProvider(api_key=OPENAI_KEY)
anthropic_provider = AnthropicProvider(api_key=ANTHROPIC_KEY)
simai_provider = SimAiProvider()

# Register providers
providers = {
    "openai": openai_provider,
    "anthropic": anthropic_provider,
    "simai": simai_provider
}

# Initialize router
router = ModelRouter(providers)

# Temporary test run
if __name__ == "__main__":
    print("Router initialized successfully.")

    # Test Sim Ai integration
    sim_task = Task(type="simulation", messages=[{"role": "user", "content": "Run a test simulation."}])
    result = router.execute(sim_task)
    print("Sim Ai result:", result)
