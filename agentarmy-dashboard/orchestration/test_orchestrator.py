import uuid
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from orchestrator import (
    Task,
    Agent,
    JobSpec,
    OrchestrationState,
    pick_next_task_and_agent,
    ZPEScore,
    default_agents,
)


def make_task(name, duration=1.0, deps=None):
    return Task(
        id=str(uuid.uuid4()),
        name=name,
        description="",
        duration=duration,
        depends_on=deps or [],
    )


def test_simple_linear_tasks():
    # create a chain of 3 tasks A -> B -> C
    a = make_task("A")
    b = make_task("B", deps=[a.id])
    c = make_task("C", deps=[b.id])

    tasks = {t.id: t for t in [a, b, c]}
    state = OrchestrationState(tasks=tasks, agents=default_agents())
    job = JobSpec(goal="test", constraints={})

    decision1 = pick_next_task_and_agent(state, job)
    assert decision1.next_task_id == a.id
    assert decision1.next_agent_id is not None

    # mark A as completed in history and re-run
    state.history.append({"task_id": a.id, "status": "completed"})
    decision2 = pick_next_task_and_agent(state, job)
    assert decision2.next_task_id == b.id

    # complete B
    state.history.append({"task_id": b.id, "status": "completed"})
    decision3 = pick_next_task_and_agent(state, job)
    assert decision3.next_task_id == c.id

    # complete C
    state.history.append({"task_id": c.id, "status": "completed"})
    decision4 = pick_next_task_and_agent(state, job)
    assert decision4.next_task_id is None
