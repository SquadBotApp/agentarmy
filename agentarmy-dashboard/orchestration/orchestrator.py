from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
import math
import uuid

# =========
# Core models
# =========

@dataclass
class Task:
    id: str
    name: str
    description: str
    duration: float  # in hours
    depends_on: List[str] = field(default_factory=list)
    assigned_agent: Optional[str] = None
    earliest_start: float = 0.0
    earliest_finish: float = 0.0
    latest_start: float = 0.0
    latest_finish: float = 0.0
    slack: float = 0.0
    is_critical: bool = False


@dataclass
class Agent:
    id: str
    name: str
    role: str  # "planner", "executor", "critic", "governor"
    cost_per_hour: float
    risk_profile: float  # 0–1 (0 = ultra safe, 1 = aggressive)
    tools: List[str] = field(default_factory=list)


@dataclass
class JobSpec:
    goal: str
    constraints: Dict[str, Any]
    deadline_hours: Optional[float] = None
    budget: Optional[float] = None
    risk_tolerance: float = 0.5  # 0–1


@dataclass
class OrchestrationState:
    tasks: Dict[str, Task]
    agents: Dict[str, Agent]
    history: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class ZPEScore:
    total: float
    components: Dict[str, float]


@dataclass
class OrchestrationDecision:
    next_task_id: Optional[str]
    next_agent_id: Optional[str]
    zpe_score: ZPEScore
    cpm_summary: Dict[str, Any]
    rationale: str
    alternatives: List[Dict[str, Any]]


# =========
# Agent graph
# =========

def default_agents() -> Dict[str, Agent]:
    return {
        "planner": Agent(
            id="planner",
            name="Planner",
            role="planner",
            cost_per_hour=80.0,
            risk_profile=0.4,
            tools=["llm", "search"]
        ),
        "executor": Agent(
            id="executor",
            name="Executor",
            role="executor",
            cost_per_hour=70.0,
            risk_profile=0.6,
            tools=["llm", "codegen"]
        ),
        "critic": Agent(
            id="critic",
            name="Critic",
            role="critic",
            cost_per_hour=90.0,
            risk_profile=0.3,
            tools=["llm"]
        ),
        "governor": Agent(
            id="governor",
            name="Governor",
            role="governor",
            cost_per_hour=100.0,
            risk_profile=0.2,
            tools=["llm", "policy"]
        ),
    }


# =========
# CPM scheduling
# =========

def compute_cpm(tasks: Dict[str, Task]) -> Tuple[Dict[str, Task], float]:
    """
    Mutates tasks with ES/EF/LS/LF/slack/is_critical.
    Returns updated tasks and total project duration.
    """
    # Handle empty task list
    if not tasks:
        return tasks, 0.0

    # Topological order (simple Kahn-style)
    in_degree = {tid: 0 for tid in tasks}
    for t in tasks.values():
        for dep in t.depends_on:
            in_degree[t.id] += 1

    queue = [tid for tid, deg in in_degree.items() if deg == 0]
    topo_order: List[str] = []

    while queue:
        current = queue.pop(0)
        topo_order.append(current)
        for t in tasks.values():
            if current in t.depends_on:
                in_degree[t.id] -= 1
                if in_degree[t.id] == 0:
                    queue.append(t.id)

    # Forward pass (ES/EF)
    for tid in topo_order:
        task = tasks[tid]
        if not task.depends_on:
            task.earliest_start = 0.0
        else:
            task.earliest_start = max(
                tasks[dep].earliest_finish for dep in task.depends_on
            )
        task.earliest_finish = task.earliest_start + task.duration

    project_duration = max((t.earliest_finish for t in tasks.values()), default=0.0)

    # Backward pass (LS/LF)
    for tid in reversed(topo_order):
        task = tasks[tid]
        successors = [
            t for t in tasks.values() if tid in t.depends_on
        ]
        if not successors:
            task.latest_finish = project_duration
        else:
            task.latest_finish = min(s.latest_start for s in successors)
        task.latest_start = task.latest_finish + -task.duration
        task.slack = task.latest_start - task.earliest_start
        task.is_critical = abs(task.slack) < 1e-6

    return tasks, project_duration


# =========
# ZPE / Möbius scoring
# =========

def zpe_score(
    usefulness: float,
    coherence: float,
    cost: float,
    latency: float,
    risk: float,
    alignment: float,
    weights: Optional[Dict[str, float]] = None,
) -> ZPEScore:
    """
    All inputs 0–1 except cost/latency (normalized before calling).
    Higher is better.
    """
    if weights is None:
        weights = {
            "usefulness": 0.25,
            "coherence": 0.2,
            "cost": 0.15,
            "latency": 0.1,
            "risk": 0.15,
            "alignment": 0.15,
        }

    # Invert cost/latency/risk (lower is better)
    cost_term = 1.0 - cost
    latency_term = 1.0 - latency
    risk_term = 1.0 - risk

    components = {
        "usefulness": usefulness * weights["usefulness"],
        "coherence": coherence * weights["coherence"],
        "cost": cost_term * weights["cost"],
        "latency": latency_term * weights["latency"],
        "risk": risk_term * weights["risk"],
        "alignment": alignment * weights["alignment"],
    }

    total = sum(components.values())

    return ZPEScore(total=total, components=components)


def mobius_update(previous_score: float, current_score: float, inertia: float = 0.7) -> float:
    """
    Simple Möbius-style loop: blend previous and current to avoid thrash.
    """
    return inertia * previous_score + (1.0 - inertia) * current_score


# =========
# Orchestration logic
# =========

def pick_next_task_and_agent(
    state: OrchestrationState,
    job: JobSpec,
    previous_zpe: float = 0.5,
) -> OrchestrationDecision:
    # 1) Run CPM
    tasks, project_duration = compute_cpm(state.tasks)

    # 2) Candidate tasks: not done, all deps satisfied
    completed_ids = {h.get("task_id") for h in state.history if h.get("status") == "completed"}
    ready_tasks = [
        t for t in tasks.values()
        if t.id not in completed_ids and all(dep in completed_ids for dep in t.depends_on)
    ]

    if not ready_tasks:
        zero_score = ZPEScore(total=previous_zpe, components={})
        return OrchestrationDecision(
            next_task_id=None,
            next_agent_id=None,
            zpe_score=zero_score,
            cpm_summary={"project_duration": project_duration},
            rationale="No remaining tasks; workflow complete.",
            alternatives=[],
        )

    # 3) For each ready task, evaluate candidate agents
    agents = list(state.agents.values())
    alternatives: List[Dict[str, Any]] = []
    best: Optional[Tuple[Task, Agent, ZPEScore]] = None

    for task in ready_tasks:
        for agent in agents:
            usefulness = 0.7
            coherence = 0.7
            cost_norm = min(1.0, agent.cost_per_hour / 150.0)
            latency_norm = min(1.0, task.duration / 8.0)
            risk_norm = agent.risk_profile
            alignment = 1.0 - abs(job.risk_tolerance - agent.risk_profile)

            score = zpe_score(
                usefulness=usefulness,
                coherence=coherence,
                cost=cost_norm,
                latency=latency_norm,
                risk=risk_norm,
                alignment=alignment,
            )

            if task.is_critical:
                score.total += 0.05

            alternatives.append({
                "task_id": task.id,
                "agent_id": agent.id,
                "score": score.total,
                "components": score.components,
                "is_critical": task.is_critical,
            })

            if best is None or score.total > best[2].total:
                best = (task, agent, score)

    assert best is not None
    best_task, best_agent, best_score = best

    blended_score = mobius_update(previous_zpe, best_score.total)

    rationale = (
        f"Selected task '{best_task.name}' for agent '{best_agent.name}' "
        f"(role={best_agent.role}), ZPE={best_score.total:.3f}, "
        f"critical={best_task.is_critical}."
    )

    cpm_summary = {
        "project_duration": project_duration,
        "critical_tasks": [t.id for t in tasks.values() if t.is_critical],
    }

    return OrchestrationDecision(
        next_task_id=best_task.id,
        next_agent_id=best_agent.id,
        zpe_score=ZPEScore(
            total=blended_score,
            components=best_score.components,
        ),
        cpm_summary=cpm_summary,
        rationale=rationale,
        alternatives=alternates_top_k(alternatives, k=5),
    )


def alternates_top_k(alternatives: List[Dict[str, Any]], k: int = 5) -> List[Dict[str, Any]]:
    return sorted(alternatives, key=lambda a: a["score"], reverse=True)[:k]


# =========
# Public entrypoint (for your /orchestrate route)
# =========

def orchestrate(payload: Dict[str, Any]) -> Dict[str, Any]:
    # support legacy "task" payload shape for backwards compatibility
    if "job" not in payload and "task" in payload:
        # payload may include priority/context etc; we ignore most for now
        job_raw = {"goal": payload.get("task", "")}
        state_raw = (payload.get("context") or {}).get("state", {})
        previous_zpe = float((payload.get("context") or {}).get("previous_zpe", 0.5))
    else:
        job_raw = payload.get("job", {})
        state_raw = payload.get("state", {})
        previous_zpe = float(payload.get("previous_zpe", 0.5))

    job = JobSpec(
        goal=job_raw.get("goal", ""),
        constraints=job_raw.get("constraints", {}) or {},
        deadline_hours=job_raw.get("deadline_hours"),
        budget=job_raw.get("budget"),
        risk_tolerance=float(job_raw.get("risk_tolerance", 0.5)),
    )

    tasks_dict: Dict[str, Task] = {}
    for t in state_raw.get("tasks", []):
        tid = t.get("id") or str(uuid.uuid4())
        tasks_dict[tid] = Task(
            id=tid,
            name=t.get("name", tid),
            description=t.get("description", ""),
            duration=float(t.get("duration", 1.0)),
            depends_on=t.get("depends_on", []) or [],
            assigned_agent=t.get("assigned_agent"),
        )

    agents = default_agents()

    state = OrchestrationState(
        tasks=tasks_dict,
        agents=agents,
        history=state_raw.get("history", []) or [],
    )

    decision = pick_next_task_and_agent(
        state=state,
        job=job,
        previous_zpe=previous_zpe,
    )

    return {
        "nextTaskId": decision.next_task_id,
        "nextAgentId": decision.next_agent_id,
        "zpe": {
            "total": decision.zpe_score.total,
            "components": decision.zpe_score.components,
        },
        "cpm": decision.cpm_summary,
        "rationale": decision.rationale,
        "alternatives": decision.alternatives,
    }
