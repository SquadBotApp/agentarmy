"""
AgentArmy Deployment Orchestrator
==================================
Air-traffic control for the agent society.  Determines which agents
participate in a mission, assigns them to MissionGraph nodes, coordinates
with Swarm Runners, adapts in real-time via ZPE signals, and enforces
safety / economy constraints at every step.

Integrations:
  - LifecycleManager  → checks agent stage, governance, safety posture
  - Orchestrator (CPM) → task dependency graph & critical path
  - Economy Layer      → Qb/QBC budget awareness
  - Swarm Runners      → execution dispatching & feedback
  - Constitutional Engine → safety gating
"""

from __future__ import annotations

import uuid
import math
import random
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from lifecycle_manager import (
    LifecycleManager,
    LifecycleStage,
    ManagedAgent,
    RiskLevel,
    SafetyPosture,
)


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class NodeType(str, Enum):
    AGENT      = "agent"
    TOOL       = "tool"
    LOGIC      = "logic"
    GATE       = "gate"       # governance / safety gate
    PARALLEL   = "parallel"
    AGGREGATE  = "aggregate"
    SYNTHESIZE = "synthesize"


class MissionStatus(str, Enum):
    PLANNING   = "planning"
    DEPLOYING  = "deploying"
    RUNNING    = "running"
    ADAPTING   = "adapting"
    COMPLETED  = "completed"
    FAILED     = "failed"
    ABORTED    = "aborted"


class CollaborationPattern(str, Enum):
    PLAN_EXECUTE       = "planner→executor"
    EXECUTE_CRITIQUE   = "executor→critic"
    CRITIQUE_ESCALATE  = "critic→governor"
    ESCALATE_REPLAN    = "governor→planner"
    SYNTHESIZE_OUTPUT  = "synthesizer→user"


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class MissionNode:
    """A single node in the MissionGraph."""
    node_id: str = field(default_factory=lambda: f"node-{uuid.uuid4().hex[:8]}")
    node_type: NodeType = NodeType.AGENT
    label: str = ""
    required_role: str = ""            # planner | executor | critic | governor | synthesizer
    reasoning_style: str = "standard"  # standard | creative | analytical | cautious
    risk_level: RiskLevel = RiskLevel.LOW
    cost_weight: float = 1.0
    domain: str = ""
    tools_needed: List[str] = field(default_factory=list)
    depends_on: List[str] = field(default_factory=list)
    assigned_agent_id: Optional[str] = None
    assigned_runner_id: Optional[str] = None
    status: str = "pending"            # pending | running | completed | failed | skipped
    result: Optional[Dict[str, Any]] = None
    zpe_score: float = 0.0
    qb_cost: float = 0.0
    latency_ms: float = 0.0


@dataclass
class MissionGraph:
    """DAG of nodes representing a mission's execution plan."""
    mission_id: str = field(default_factory=lambda: f"mission-{uuid.uuid4().hex[:10]}")
    goal: str = ""
    domain: str = ""
    nodes: Dict[str, MissionNode] = field(default_factory=dict)
    status: MissionStatus = MissionStatus.PLANNING
    budget_qb: float = 100.0
    spent_qb: float = 0.0
    risk_tolerance: float = 0.5
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    adaptation_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RunnerProfile:
    """Swarm Runner descriptor."""
    runner_id: str
    specialization: List[str] = field(default_factory=list)
    latency_avg_ms: float = 200.0
    cost_per_call: float = 0.01
    tools: List[str] = field(default_factory=list)
    safety_cleared: bool = True
    current_load: int = 0
    max_concurrent: int = 5


@dataclass
class DeploymentEvent:
    """Audit record for deployment decisions."""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    mission_id: str = ""
    event_type: str = ""   # team_selected | node_assigned | adaptation | escalation | completion | failure
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TeamComposition:
    """Selected agent team for a mission."""
    agents: Dict[str, str] = field(default_factory=dict)  # role → agent_id
    rationale: Dict[str, str] = field(default_factory=dict)  # role → selection reason
    total_estimated_cost: float = 0.0
    risk_assessment: str = "standard"


# ---------------------------------------------------------------------------
# Selection scoring
# ---------------------------------------------------------------------------

def _agent_fitness(
    agent: ManagedAgent,
    required_role: str,
    domain: str,
    risk_tolerance: float,
    budget_remaining: float,
) -> float:
    """Score an agent's fitness for a role in a mission (0-1)."""
    score = 0.0
    v = agent.current_version

    # Role match (hard requirement)
    if agent.role != required_role:
        return 0.0

    # Must be deployable
    if agent.stage not in (LifecycleStage.ACTIVE, LifecycleStage.CANDIDATE):
        return 0.0
    if agent.frozen:
        return 0.0

    # Performance history (40% weight)
    perf = agent.performance_score if agent.total_missions > 0 else 0.5
    score += 0.40 * perf

    # ZPE alignment (20%)
    if v:
        score += 0.20 * v.zpe_baseline

    # Safety posture alignment (15%) — prefer safer for high-risk missions
    if v:
        posture_match = 1.0 - abs(v.safety_posture.level / 4 - risk_tolerance)
        score += 0.15 * max(0, posture_match)

    # Economy efficiency (15%)
    if v:
        eff = min(v.qb_efficiency, 2.0) / 2.0  # normalize to 0-1
        score += 0.15 * eff

    # Domain specialization (10%)
    if v and domain:
        if domain in v.specialization_tags or domain in agent.domain_restrictions:
            score += 0.10

    return round(min(score, 1.0), 4)


def _runner_fitness(
    runner: RunnerProfile,
    node: MissionNode,
) -> float:
    """Score a runner for a mission node."""
    score = 0.0

    # Tool compatibility (40%)
    if node.tools_needed:
        overlap = len(set(node.tools_needed) & set(runner.tools))
        score += 0.40 * (overlap / len(node.tools_needed))
    else:
        score += 0.40  # no tool requirement

    # Latency (25%) — lower is better
    latency_norm = max(0, 1.0 - runner.latency_avg_ms / 2000)
    score += 0.25 * latency_norm

    # Cost (20%) — lower is better
    cost_norm = max(0, 1.0 - runner.cost_per_call / 0.10)
    score += 0.20 * cost_norm

    # Availability (15%)
    load_ratio = runner.current_load / max(runner.max_concurrent, 1)
    score += 0.15 * (1.0 - load_ratio)

    if not runner.safety_cleared and node.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
        return 0.0

    return round(min(score, 1.0), 4)


# ---------------------------------------------------------------------------
# Collaboration patterns
# ---------------------------------------------------------------------------

ROLE_HANDOFF: Dict[str, str] = {
    "planner":     "executor",
    "executor":    "critic",
    "critic":      "governor",
    "governor":    "planner",
    "synthesizer": "__output__",
}

STANDARD_PIPELINE = ["planner", "executor", "critic", "synthesizer"]
HIGH_RISK_PIPELINE = ["planner", "executor", "critic", "governor", "synthesizer"]


# ---------------------------------------------------------------------------
# Deployment Orchestrator
# ---------------------------------------------------------------------------

class DeploymentOrchestrator:
    """
    Air-traffic control for the agent society.

    Responsibilities
    ----------------
    1. Select optimal agent team per mission
    2. Assign agents to MissionGraph nodes
    3. Coordinate collaboration patterns
    4. Dispatch to Swarm Runners
    5. Adapt dynamically via ZPE signals
    6. Enforce safety & governance at every step
    7. Optimize for cost / speed / reliability
    """

    def __init__(self, lifecycle: LifecycleManager) -> None:
        self.lifecycle = lifecycle
        self.missions: Dict[str, MissionGraph] = {}
        self.runners: Dict[str, RunnerProfile] = {}
        self.event_log: List[DeploymentEvent] = []
        self._register_default_runners()

    # ------------------------------------------------------------------
    # Runner management
    # ------------------------------------------------------------------

    def _register_default_runners(self) -> None:
        defaults = [
            RunnerProfile("runner-llm-01", ["planner", "critic"], 300, 0.02, ["llm", "search"]),
            RunnerProfile("runner-exec-01", ["executor"], 500, 0.05, ["llm", "codegen", "shell"]),
            RunnerProfile("runner-fast-01", ["synthesizer"], 100, 0.01, ["llm"]),
            RunnerProfile("runner-gov-01", ["governor"], 200, 0.03, ["llm", "policy_check"]),
        ]
        for r in defaults:
            self.runners[r.runner_id] = r

    def register_runner(self, runner: RunnerProfile) -> None:
        self.runners[runner.runner_id] = runner

    # ------------------------------------------------------------------
    # Team selection
    # ------------------------------------------------------------------

    def select_team(
        self,
        mission: MissionGraph,
    ) -> TeamComposition:
        """Pick the best agent for each role needed by the mission."""
        pipeline = (
            HIGH_RISK_PIPELINE
            if mission.risk_tolerance < 0.3
            else STANDARD_PIPELINE
        )
        budget_remaining = mission.budget_qb - mission.spent_qb
        candidates = self.lifecycle.list_agents()

        team: Dict[str, str] = {}
        rationale: Dict[str, str] = {}
        total_cost = 0.0

        for role in pipeline:
            scored: List[Tuple[float, ManagedAgent]] = []
            for agent in candidates:
                fit = _agent_fitness(
                    agent, role, mission.domain,
                    mission.risk_tolerance, budget_remaining,
                )
                if fit > 0:
                    scored.append((fit, agent))

            scored.sort(key=lambda x: x[0], reverse=True)

            if scored:
                best_score, best_agent = scored[0]
                team[role] = best_agent.agent_id
                rationale[role] = (
                    f"score={best_score:.3f}  perf={best_agent.performance_score:.2f}  "
                    f"missions={best_agent.total_missions}"
                )
                # estimate cost from version efficiency
                v = best_agent.current_version
                est = (1.0 / max(v.qb_efficiency, 0.01)) if v else 1.0
                total_cost += est

        risk_label = (
            "high"
            if mission.risk_tolerance < 0.3
            else "elevated" if mission.risk_tolerance < 0.5
            else "standard"
        )

        composition = TeamComposition(
            agents=team,
            rationale=rationale,
            total_estimated_cost=round(total_cost, 2),
            risk_assessment=risk_label,
        )

        self._log_event(DeploymentEvent(
            mission_id=mission.mission_id,
            event_type="team_selected",
            details={
                "team": team,
                "risk": risk_label,
                "estimated_cost": total_cost,
            },
        ))

        return composition

    # ------------------------------------------------------------------
    # Node assignment
    # ------------------------------------------------------------------

    def assign_nodes(
        self,
        mission: MissionGraph,
        team: TeamComposition,
    ) -> MissionGraph:
        """Map team agents + runners to each mission node."""
        for node in mission.nodes.values():
            # Assign agent
            role = node.required_role or "executor"
            agent_id = team.agents.get(role)
            if agent_id:
                node.assigned_agent_id = agent_id

            # Assign runner
            best_runner = self._pick_runner(node)
            if best_runner:
                node.assigned_runner_id = best_runner.runner_id

            # Insert governance gate if high risk
            if node.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
                gate_id = f"gate-{node.node_id}"
                if gate_id not in mission.nodes:
                    gate = MissionNode(
                        node_id=gate_id,
                        node_type=NodeType.GATE,
                        label=f"Governance gate for {node.label}",
                        required_role="governor",
                        risk_level=node.risk_level,
                        depends_on=[node.node_id],
                    )
                    gov_agent = team.agents.get("governor")
                    if gov_agent:
                        gate.assigned_agent_id = gov_agent
                    mission.nodes[gate_id] = gate

            self._log_event(DeploymentEvent(
                mission_id=mission.mission_id,
                event_type="node_assigned",
                details={
                    "node": node.node_id,
                    "agent": node.assigned_agent_id,
                    "runner": node.assigned_runner_id,
                    "role": role,
                },
            ))

        mission.status = MissionStatus.DEPLOYING
        return mission

    def _pick_runner(self, node: MissionNode) -> Optional[RunnerProfile]:
        scored = [
            (_runner_fitness(r, node), r)
            for r in self.runners.values()
        ]
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[0][1] if scored and scored[0][0] > 0 else None

    # ------------------------------------------------------------------
    # Execution dispatch  (simulated)
    # ------------------------------------------------------------------

    def execute_mission(self, mission_id: str) -> MissionGraph:
        """Run all nodes in dependency order (topological). Simulated."""
        mission = self.missions[mission_id]
        mission.status = MissionStatus.RUNNING

        order = self._topo_sort(mission)
        for node_id in order:
            node = mission.nodes[node_id]
            node.status = "running"

            # Simulate execution
            success = random.random() > 0.08  # 92% success rate
            latency = random.uniform(50, 800)
            cost = random.uniform(0.005, 0.05)
            zpe = random.uniform(0.4, 0.95)

            node.latency_ms = round(latency, 1)
            node.qb_cost = round(cost, 4)
            node.zpe_score = round(zpe, 4)
            mission.spent_qb += cost

            if success:
                node.status = "completed"
                node.result = {"output": f"Simulated result for {node.label}", "zpe": zpe}
            else:
                node.status = "failed"
                node.result = {"error": "Simulated failure"}
                # Attempt adaptation
                adapted = self._adapt(mission, node)
                if not adapted:
                    mission.status = MissionStatus.FAILED
                    break

            # Record performance in lifecycle
            if node.assigned_agent_id:
                try:
                    self.lifecycle.record_mission_result(
                        node.assigned_agent_id,
                        success=success,
                        zpe_score=zpe,
                        qb_cost=cost,
                        latency_ms=latency,
                    )
                except KeyError:
                    pass

        if mission.status == MissionStatus.RUNNING:
            mission.status = MissionStatus.COMPLETED
            mission.completed_at = datetime.now(timezone.utc).isoformat()

        self._log_event(DeploymentEvent(
            mission_id=mission.mission_id,
            event_type="completion" if mission.status == MissionStatus.COMPLETED else "failure",
            details={
                "status": mission.status.value,
                "spent_qb": round(mission.spent_qb, 4),
                "nodes_completed": sum(1 for n in mission.nodes.values() if n.status == "completed"),
                "nodes_failed": sum(1 for n in mission.nodes.values() if n.status == "failed"),
            },
        ))

        return mission

    # ------------------------------------------------------------------
    # Dynamic adaptation
    # ------------------------------------------------------------------

    def _adapt(self, mission: MissionGraph, failed_node: MissionNode) -> bool:
        """Try to recover from a node failure."""
        mission.adaptation_count += 1
        if mission.adaptation_count > 5:
            return False  # too many retries

        mission.status = MissionStatus.ADAPTING

        # Strategy 1: reassign to a different agent
        candidates = self.lifecycle.list_agents(role=failed_node.required_role)
        for c in candidates:
            if c.agent_id != failed_node.assigned_agent_id and not c.frozen:
                failed_node.assigned_agent_id = c.agent_id
                failed_node.status = "pending"
                self._log_event(DeploymentEvent(
                    mission_id=mission.mission_id,
                    event_type="adaptation",
                    details={
                        "node": failed_node.node_id,
                        "strategy": "reassign_agent",
                        "new_agent": c.agent_id,
                    },
                ))
                mission.status = MissionStatus.RUNNING
                return True

        # Strategy 2: route to alternative runner
        alt_runner = self._pick_runner(failed_node)
        if alt_runner and alt_runner.runner_id != failed_node.assigned_runner_id:
            failed_node.assigned_runner_id = alt_runner.runner_id
            failed_node.status = "pending"
            self._log_event(DeploymentEvent(
                mission_id=mission.mission_id,
                event_type="adaptation",
                details={
                    "node": failed_node.node_id,
                    "strategy": "reassign_runner",
                    "new_runner": alt_runner.runner_id,
                },
            ))
            mission.status = MissionStatus.RUNNING
            return True

        return False

    # ------------------------------------------------------------------
    # MissionGraph builder
    # ------------------------------------------------------------------

    def create_mission(
        self,
        goal: str,
        domain: str = "",
        risk_tolerance: float = 0.5,
        budget_qb: float = 100.0,
        node_specs: Optional[List[Dict[str, Any]]] = None,
    ) -> MissionGraph:
        """
        Build a MissionGraph from a goal description.
        If no node_specs are provided, a standard pipeline is generated.
        """
        mission = MissionGraph(
            goal=goal,
            domain=domain,
            risk_tolerance=risk_tolerance,
            budget_qb=budget_qb,
        )

        if node_specs:
            for spec in node_specs:
                n = MissionNode(
                    node_id=spec.get("id", f"node-{uuid.uuid4().hex[:8]}"),
                    node_type=NodeType(spec.get("type", "agent")),
                    label=spec.get("label", ""),
                    required_role=spec.get("role", "executor"),
                    reasoning_style=spec.get("reasoning", "standard"),
                    risk_level=RiskLevel(spec.get("risk", "low")),
                    cost_weight=spec.get("cost_weight", 1.0),
                    domain=spec.get("domain", domain),
                    tools_needed=spec.get("tools", []),
                    depends_on=spec.get("depends_on", []),
                )
                mission.nodes[n.node_id] = n
        else:
            # Auto-generate standard pipeline nodes
            pipeline = (
                HIGH_RISK_PIPELINE
                if risk_tolerance < 0.3
                else STANDARD_PIPELINE
            )
            prev_id: Optional[str] = None
            for role in pipeline:
                n = MissionNode(
                    label=f"{role.capitalize()} – {goal[:40]}",
                    node_type=NodeType.AGENT,
                    required_role=role,
                    risk_level=RiskLevel.HIGH if role == "governor" else RiskLevel.MEDIUM,
                    domain=domain,
                    depends_on=[prev_id] if prev_id else [],
                )
                mission.nodes[n.node_id] = n
                prev_id = n.node_id

        self.missions[mission.mission_id] = mission
        return mission

    # ------------------------------------------------------------------
    # Full pipeline: create → select → assign → execute
    # ------------------------------------------------------------------

    def deploy_mission(
        self,
        goal: str,
        domain: str = "",
        risk_tolerance: float = 0.5,
        budget_qb: float = 100.0,
        node_specs: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """One-call convenience: build graph → pick team → assign → run."""
        mission = self.create_mission(goal, domain, risk_tolerance, budget_qb, node_specs)
        team = self.select_team(mission)
        mission = self.assign_nodes(mission, team)
        mission = self.execute_mission(mission.mission_id)

        return {
            "mission_id": mission.mission_id,
            "goal": mission.goal,
            "status": mission.status.value,
            "team": team.agents,
            "team_rationale": team.rationale,
            "risk_assessment": team.risk_assessment,
            "estimated_cost": team.total_estimated_cost,
            "actual_cost": round(mission.spent_qb, 4),
            "nodes": {
                nid: {
                    "label": n.label,
                    "type": n.node_type.value,
                    "role": n.required_role,
                    "agent": n.assigned_agent_id,
                    "runner": n.assigned_runner_id,
                    "status": n.status,
                    "zpe": n.zpe_score,
                    "cost": n.qb_cost,
                    "latency_ms": n.latency_ms,
                }
                for nid, n in mission.nodes.items()
            },
            "adaptations": mission.adaptation_count,
            "created_at": mission.created_at,
            "completed_at": mission.completed_at,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _topo_sort(self, mission: MissionGraph) -> List[str]:
        """Topological sort of mission nodes by depends_on."""
        visited: set = set()
        order: List[str] = []

        def visit(nid: str) -> None:
            if nid in visited:
                return
            visited.add(nid)
            node = mission.nodes.get(nid)
            if node:
                for dep in node.depends_on:
                    visit(dep)
            order.append(nid)

        for nid in mission.nodes:
            visit(nid)
        return order

    def _log_event(self, event: DeploymentEvent) -> None:
        self.event_log.append(event)

    # ------------------------------------------------------------------
    # Query / serialization
    # ------------------------------------------------------------------

    def get_mission(self, mission_id: str) -> Optional[MissionGraph]:
        return self.missions.get(mission_id)

    def list_missions(
        self, status: Optional[MissionStatus] = None
    ) -> List[MissionGraph]:
        missions = list(self.missions.values())
        if status:
            missions = [m for m in missions if m.status == status]
        return missions

    def get_deployment_stats(self) -> Dict[str, Any]:
        total = len(self.missions)
        completed = sum(1 for m in self.missions.values() if m.status == MissionStatus.COMPLETED)
        failed = sum(1 for m in self.missions.values() if m.status == MissionStatus.FAILED)
        total_cost = sum(m.spent_qb for m in self.missions.values())
        total_adaptations = sum(m.adaptation_count for m in self.missions.values())
        avg_cost = total_cost / max(total, 1)

        return {
            "total_missions": total,
            "completed": completed,
            "failed": failed,
            "running": total - completed - failed,
            "total_cost_qb": round(total_cost, 4),
            "avg_cost_qb": round(avg_cost, 4),
            "total_adaptations": total_adaptations,
            "runners": len(self.runners),
            "event_log_size": len(self.event_log),
        }

    def to_dict(self) -> Dict[str, Any]:
        """Full state export."""
        return {
            "stats": self.get_deployment_stats(),
            "missions": {
                mid: {
                    "mission_id": m.mission_id,
                    "goal": m.goal,
                    "domain": m.domain,
                    "status": m.status.value,
                    "budget_qb": m.budget_qb,
                    "spent_qb": round(m.spent_qb, 4),
                    "risk_tolerance": m.risk_tolerance,
                    "node_count": len(m.nodes),
                    "adaptation_count": m.adaptation_count,
                    "created_at": m.created_at,
                    "completed_at": m.completed_at,
                    "nodes": {
                        nid: {
                            "label": n.label,
                            "type": n.node_type.value,
                            "role": n.required_role,
                            "agent": n.assigned_agent_id,
                            "runner": n.assigned_runner_id,
                            "status": n.status,
                            "risk": n.risk_level.value,
                            "zpe": n.zpe_score,
                            "cost": n.qb_cost,
                            "latency_ms": n.latency_ms,
                        }
                        for nid, n in m.nodes.items()
                    },
                }
                for mid, m in self.missions.items()
            },
            "runners": {
                rid: {
                    "runner_id": r.runner_id,
                    "specialization": r.specialization,
                    "latency_avg_ms": r.latency_avg_ms,
                    "cost_per_call": r.cost_per_call,
                    "tools": r.tools,
                    "safety_cleared": r.safety_cleared,
                    "load": r.current_load,
                    "max_concurrent": r.max_concurrent,
                }
                for rid, r in self.runners.items()
            },
            "recent_events": [
                {
                    "event_id": e.event_id,
                    "mission_id": e.mission_id,
                    "event_type": e.event_type,
                    "timestamp": e.timestamp,
                    "details": e.details,
                }
                for e in self.event_log[-30:]
            ],
        }
