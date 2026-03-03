"""
AgentArmy Lifecycle Manager
============================
Governs the full lifecycle of every agent: creation, deployment, evolution,
rollback, merge, fork, and retirement. Enforces constitutional safety rules
at every stage and maintains a complete audit trail.

Integrations:
  - Personality Engine  → manages personality updates / versioning
  - Evolution Protocol  → executes evolution decisions, ensures safety
  - Knowledge Fabric    → stores embeddings & semantic metadata
  - Optimization Engine → implements structural improvements
  - Replay Engine       → evaluates agent performance via replay logs
  - Orchestrator        → assigns agents to nodes / missions
  - Swarm Runners       → tracks execution performance & specialization
  - Economy Layer       → adjusts privileges based on Qb/QBC efficiency
"""

from __future__ import annotations

import uuid
import copy
import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from contextlib import suppress

EducationCenter = None
with suppress(ImportError):
    from orchestration.education_center.education_center import EducationCenter
with suppress(ImportError):
    from education_center.education_center import EducationCenter

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class LifecycleStage(str, Enum):
    CANDIDATE   = "candidate"
    STAGING     = "staging"
    ACTIVE      = "active"
    EVOLVING    = "evolving"
    FROZEN      = "frozen"
    RETIRED     = "retired"
    MERGED      = "merged"
    FORKED      = "forked"


class LifecycleEventType(str, Enum):
    CREATION    = "creation"
    DEPLOYMENT  = "deployment"
    EVOLUTION   = "evolution"
    ROLLBACK    = "rollback"
    MERGE       = "merge"
    FORK        = "fork"
    RETIREMENT  = "retirement"
    FREEZE      = "freeze"
    UNFREEZE    = "unfreeze"
    PROMOTION   = "promotion"
    DEMOTION    = "demotion"
    TOOL_LOCK   = "tool_lock"
    TOOL_UNLOCK = "tool_unlock"
    DOMAIN_RESTRICT = "domain_restrict"
    CHAMPION_PROMOTION = "champion_promotion"
    CHAMPION_DEMOTION = "champion_demotion"
    SAFETY_CHECK    = "safety_check"
    GOVERNANCE_OVERRIDE = "governance_override"


class SafetyPosture(str, Enum):
    """Ordered from most to least restrictive."""
    MAXIMUM   = "maximum"
    HIGH      = "high"
    STANDARD  = "standard"
    RELAXED   = "relaxed"

    @property
    def level(self) -> int:
        return {"maximum": 4, "high": 3, "standard": 2, "relaxed": 1}[self.value]


class RiskLevel(str, Enum):
    LOW      = "low"
    MEDIUM   = "medium"
    HIGH     = "high"
    CRITICAL = "critical"


class AgentType(str, Enum):
    STANDARD = "standard"
    CHAMPION = "champion"


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class AgentVersion:
    """Snapshot of an agent at a point in time."""
    version_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    version_number: int = 1
    personality_hash: str = ""
    tools: List[str] = field(default_factory=list)
    domain_restrictions: List[str] = field(default_factory=list)
    safety_posture: SafetyPosture = SafetyPosture.STANDARD
    risk_level: RiskLevel = RiskLevel.LOW
    zpe_baseline: float = 0.5
    qb_efficiency: float = 1.0
    specialization_tags: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ManagedAgent:
    """The canonical agent record managed by the lifecycle layer."""
    agent_id: str
    name: str
    role: str  # planner, executor, critic, governor, synthesizer, custom
    agent_type: AgentType = AgentType.STANDARD
    stage: LifecycleStage = LifecycleStage.CANDIDATE
    current_version: Optional[AgentVersion] = None
    version_history: List[AgentVersion] = field(default_factory=list)
    frozen: bool = False
    tools_locked: bool = False
    approved_tools: List[str] = field(default_factory=list)
    domain_restrictions: List[str] = field(default_factory=list)
    governance_required: bool = False
    performance_score: float = 0.0
    total_missions: int = 0
    total_successes: int = 0
    total_failures: int = 0
    parent_id: Optional[str] = None  # for forks
    merged_into: Optional[str] = None  # for merges
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class LifecycleEvent:
    """Immutable audit log entry."""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    event_type: LifecycleEventType = LifecycleEventType.CREATION
    agent_id: str = ""
    agent_name: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    actor: str = "system"  # "system" | "user:<id>" | "governor"
    details: Dict[str, Any] = field(default_factory=dict)
    safety_check_passed: bool = True
    governance_approval: Optional[str] = None
    previous_state: Optional[Dict[str, Any]] = None
    new_state: Optional[Dict[str, Any]] = None


@dataclass
class SafetyConstraint:
    """A constitutional safety rule."""
    rule_id: str
    description: str
    severity: RiskLevel = RiskLevel.HIGH
    auto_enforce: bool = True


@dataclass
class GovernanceDecision:
    """Result of a governance check."""
    approved: bool
    reason: str
    required_approval: bool = False
    escalated: bool = False
    violations: List[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Constitutional Safety Rules
# ---------------------------------------------------------------------------

CONSTITUTIONAL_RULES: List[SafetyConstraint] = [
    SafetyConstraint("SAFE_STATE", "Agents cannot evolve into unsafe states", RiskLevel.CRITICAL),
    SafetyConstraint("TOOL_APPROVAL", "Tool access must be explicitly approved", RiskLevel.HIGH),
    SafetyConstraint("HIGH_RISK_OVERSIGHT", "High-risk agents require governance oversight", RiskLevel.HIGH),
    SafetyConstraint("SAFETY_NO_WEAKEN", "Safety posture cannot be weakened without approval", RiskLevel.CRITICAL),
    SafetyConstraint("DOMAIN_BOUNDARY", "Agents must not exceed domain restrictions", RiskLevel.MEDIUM),
    SafetyConstraint("VERSION_INTEGRITY", "Version history must be immutable and auditable", RiskLevel.HIGH),
    SafetyConstraint("ECONOMY_GUARD", "Qb/QBC efficiency below threshold blocks evolution", RiskLevel.MEDIUM),
    SafetyConstraint("LOOP_PREVENTION", "Evolution cycles cannot form infinite loops", RiskLevel.HIGH),
]


# ---------------------------------------------------------------------------
# Lifecycle Manager
# ---------------------------------------------------------------------------

class LifecycleManager:
    """
    Central governance layer for all agent lifecycle operations.
    Every mutation flows through constitutional checks and produces
    an immutable audit trail event.
    """

    def __init__(self) -> None:
        self.agents: Dict[str, ManagedAgent] = {}
        self.audit_log: List[LifecycleEvent] = []
        self.constraints = list(CONSTITUTIONAL_RULES)
        self._evolution_counter: Dict[str, int] = {}  # loop prevention
        # Register top-level domains
        self.domains = {}
        self._register_top_level_domains()

    def _register_top_level_domains(self):
        # Register EducationCenter as a top-level domain, but do not fail lifecycle boot if optional domain import/init breaks.
        if EducationCenter:
            try:
                self.domains["education"] = EducationCenter(runtime=self)
            except Exception:
                self.domains["education"] = None
        else:
             self.domains["education"] = None
        self.domains["swarm"] = None
        self.domains["defensive"] = None
        self.domains["governance"] = None
        self.domains["economic"] = None

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _log(self, event: LifecycleEvent) -> None:
        self.audit_log.append(event)

    def _snapshot(self, agent: ManagedAgent) -> Dict[str, Any]:
        return {
            "stage": agent.stage.value,
            "frozen": agent.frozen,
            "tools_locked": agent.tools_locked,
            "version": agent.current_version.version_number if agent.current_version else 0,
            "agent_type": agent.agent_type.value,
            "safety_posture": agent.current_version.safety_posture.value if agent.current_version else "standard",
            "performance_score": agent.performance_score,
        }

    def _ensure_stage(
        self,
        agent: ManagedAgent,
        allowed: List[LifecycleStage],
        operation: str,
    ) -> None:
        if agent.stage not in allowed:
            allowed_str = ", ".join(a.value for a in allowed)
            raise ValueError(
                f"{operation} blocked: stage '{agent.stage.value}' not in allowed stages [{allowed_str}]"
            )

    # ------------------------------------------------------------------
    def _check_safety(
        self,
        agent: 'ManagedAgent',
        proposed_version: Optional['AgentVersion'] = None,
        operation: str = "unknown",
    ) -> 'GovernanceDecision':
        violations: List[str] = []
        violations.extend(self._check_safe_state(agent, proposed_version))
        violations.extend(self._check_tool_approval(agent, proposed_version))
        violations.extend(self._check_high_risk_oversight(agent, proposed_version))
        violations.extend(self._check_economy_guard(proposed_version))
        violations.extend(self._check_loop_prevention(agent, operation))

        approved = not violations
        requires_approval = any(
            v.startswith("SAFETY_NO_WEAKEN") or v.startswith("HIGH_RISK_OVERSIGHT")
            for v in violations
        )

        return GovernanceDecision(
            approved=approved,
            reason="All constitutional checks passed" if approved else "; ".join(violations),
            required_approval=requires_approval,
            escalated=not approved and requires_approval,
            violations=violations,
        )

    def _check_safe_state(self, agent, proposed_version):
        violations = []
        if (
            proposed_version
            and agent.current_version
            and proposed_version.safety_posture.level < agent.current_version.safety_posture.level
            and agent.agent_type != AgentType.CHAMPION
        ):
            violations.append(
                f"SAFETY_NO_WEAKEN: posture would drop from "
                f"{agent.current_version.safety_posture.value} → "
                f"{proposed_version.safety_posture.value}"
            )
        return violations

    def _check_tool_approval(self, agent, proposed_version):
        violations = []
        if proposed_version and getattr(agent, 'tools_locked', False):
            if unapproved := set(proposed_version.tools) - set(getattr(agent, 'approved_tools', [])):
                violations.append(f"TOOL_APPROVAL: unapproved tools: {unapproved}")
        return violations

    def _check_high_risk_oversight(self, agent, proposed_version):
        violations = []
        if (
            proposed_version
            and getattr(proposed_version, 'risk_level', None) in (RiskLevel.HIGH, RiskLevel.CRITICAL)
            and not getattr(agent, 'governance_required', False)
        ):
            violations.append("HIGH_RISK_OVERSIGHT: agent requires governance flag")
        return violations

    def _check_economy_guard(self, proposed_version):
        violations = []
        if proposed_version and getattr(proposed_version, 'qb_efficiency', 1.0) < 0.3:
            violations.append(
                f"ECONOMY_GUARD: Qb efficiency {proposed_version.qb_efficiency:.2f} below 0.30 threshold"
            )
        return violations

    def _check_loop_prevention(self, agent, operation):
        violations = []
        evo_count = self._evolution_counter.get(agent.agent_id, 0)
        if operation == "evolution":
            if agent.agent_type == AgentType.CHAMPION and evo_count >= 20:
                violations.append("LOOP_PREVENTION: champion evolution rate limit (20/window) exceeded")
            elif agent.agent_type != AgentType.CHAMPION and evo_count >= 10:
                violations.append("LOOP_PREVENTION: evolution rate limit (10/window) exceeded")
        return violations

    # ------------------------------------------------------------------
    # Lifecycle operations
    # ------------------------------------------------------------------

    def create_agent(
        self,
        name: str,
        role: str,
        tools: Optional[List[str]] = None,
        domain_restrictions: Optional[List[str]] = None,
        safety_posture: SafetyPosture = SafetyPosture.STANDARD,
        actor: str = "system",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Tuple[ManagedAgent, LifecycleEvent]:
        agent_id = f"agent-{uuid.uuid4().hex[:12]}"
        version = AgentVersion(
            version_number=1,
            tools=tools or [],
            domain_restrictions=domain_restrictions or [],
            safety_posture=safety_posture,
            specialization_tags=[role],
            metadata=metadata or {},
        )

        agent = ManagedAgent(
            agent_id=agent_id,
            name=name,
            role=role,
            agent_type=AgentType.STANDARD,
            stage=LifecycleStage.CANDIDATE,
            current_version=version,
            version_history=[version],
            approved_tools=tools or [],
            domain_restrictions=domain_restrictions or [],
            governance_required=safety_posture.level >= SafetyPosture.HIGH.level,
        )

        self.agents[agent_id] = agent

        event = LifecycleEvent(
            event_type=LifecycleEventType.CREATION,
            agent_id=agent_id,
            agent_name=name,
            actor=actor,
            new_state=self._snapshot(agent),
            details={"role": role, "tools": tools or [], "safety_posture": safety_posture.value},
        )
        self._log(event)
        return agent, event

    def deploy_agent(
        self,
        agent_id: str,
        actor: str = "system",
    ) -> Tuple[ManagedAgent, LifecycleEvent]:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)

        if agent.frozen:
            raise ValueError(f"Agent {agent_id} is frozen — cannot deploy")
        self._ensure_stage(
            agent,
            [LifecycleStage.CANDIDATE, LifecycleStage.STAGING],
            "deploy",
        )

        decision = self._check_safety(agent, agent.current_version, "deployment")
        if not decision.approved:
            raise ValueError(f"Deployment blocked: {decision.reason}")

        agent.stage = LifecycleStage.ACTIVE
        agent.updated_at = self._now()

        event = LifecycleEvent(
            event_type=LifecycleEventType.DEPLOYMENT,
            agent_id=agent_id,
            agent_name=agent.name,
            actor=actor,
            previous_state=prev,
            new_state=self._snapshot(agent),
            safety_check_passed=decision.approved,
        )
        self._log(event)
        return agent, event

    def evolve_agent(
        self,
        agent_id: str,
        proposed_version: AgentVersion,
        actor: str = "system",
        human_approved: bool = False,
    ) -> Tuple[ManagedAgent, LifecycleEvent, GovernanceDecision]:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)

        if agent.frozen:
            raise ValueError(f"Agent {agent_id} is frozen — cannot evolve")

        decision = self._check_safety(agent, proposed_version, "evolution")
        if human_approved and not self._is_privileged_actor(actor):
            raise ValueError("human_approved override requires privileged actor")

        if not decision.approved and not human_approved:
            event = LifecycleEvent(
                event_type=LifecycleEventType.SAFETY_CHECK,
                agent_id=agent_id,
                agent_name=agent.name,
                actor=actor,
                previous_state=prev,
                new_state=prev,  # unchanged
                safety_check_passed=False,
                details={"violations": decision.violations, "blocked": True},
            )
            self._log(event)
            return agent, event, decision

        # Apply evolution
        proposed_version.version_number = (
            (agent.current_version.version_number if agent.current_version else 0) + 1
        )
        proposed_version.created_at = self._now()
        agent.version_history.append(proposed_version)
        agent.current_version = proposed_version
        agent.stage = LifecycleStage.ACTIVE
        agent.updated_at = self._now()
        self._evolution_counter[agent_id] = self._evolution_counter.get(agent_id, 0) + 1

        event = LifecycleEvent(
            event_type=LifecycleEventType.EVOLUTION,
            agent_id=agent_id,
            agent_name=agent.name,
            actor=actor,
            previous_state=prev,
            new_state=self._snapshot(agent),
            safety_check_passed=decision.approved or human_approved,
            governance_approval="human_override" if human_approved and not decision.approved else None,
            details={
                "version": proposed_version.version_number,
                "human_approved": human_approved,
            },
        )
        self._log(event)
        return agent, event, decision

    def rollback_agent(
        self,
        agent_id: str,
        target_version: Optional[int] = None,
        actor: str = "system",
    ) -> Tuple[ManagedAgent, LifecycleEvent]:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)

        if len(agent.version_history) < 2 and target_version is None:
            raise ValueError("No previous version to roll back to")

        if target_version is not None:
            target = next(
                (v for v in agent.version_history if v.version_number == target_version),
                None,
            )
            if not target:
                raise ValueError(f"Version {target_version} not found")
        else:
            target = agent.version_history[-2]

        # Rollback is always safe — we're restoring a known-good state
        agent.current_version = copy.deepcopy(target)
        agent.stage = LifecycleStage.ACTIVE
        agent.updated_at = self._now()

        event = LifecycleEvent(
            event_type=LifecycleEventType.ROLLBACK,
            agent_id=agent_id,
            agent_name=agent.name,
            actor=actor,
            previous_state=prev,
            new_state=self._snapshot(agent),
            details={"rolled_back_to_version": target.version_number},
        )
        self._log(event)
        return agent, event

    def merge_agents(
        self,
        source_id: str,
        target_id: str,
        actor: str = "system",
    ) -> Tuple[ManagedAgent, LifecycleEvent]:
        source = self.agents[source_id]
        target = self.agents[target_id]
        if source_id == target_id:
            raise ValueError("Cannot merge agent into itself")
        self._ensure_stage(source, [LifecycleStage.ACTIVE, LifecycleStage.CANDIDATE], "merge-source")
        self._ensure_stage(target, [LifecycleStage.ACTIVE, LifecycleStage.CANDIDATE], "merge-target")
        prev_target = self._snapshot(target)

        # Merge specializations from source into target
        merged_tools = list(set(target.current_version.tools + source.current_version.tools))
        merged_tags = list(set(
            target.current_version.specialization_tags + source.current_version.specialization_tags
        ))

        # Keep the safer posture
        safer = max(
            target.current_version.safety_posture,
            source.current_version.safety_posture,
            key=lambda p: p.level,
        )

        new_version = AgentVersion(
            version_number=(target.current_version.version_number if target.current_version else 0) + 1,
            tools=merged_tools,
            domain_restrictions=list(set(
                target.domain_restrictions + source.domain_restrictions
            )),
            safety_posture=safer,
            risk_level=max(target.current_version.risk_level, source.current_version.risk_level,
                          key=lambda r: ["low", "medium", "high", "critical"].index(r.value)),
            zpe_baseline=max(target.current_version.zpe_baseline, source.current_version.zpe_baseline),
            qb_efficiency=(target.current_version.qb_efficiency + source.current_version.qb_efficiency) / 2,
            specialization_tags=merged_tags,
            metadata={"merged_from": source_id},
        )

        decision = self._check_safety(target, new_version, "merge")
        if not decision.approved:
            raise ValueError(f"Merge blocked: {decision.reason}")

        target.version_history.append(new_version)
        target.current_version = new_version
        target.updated_at = self._now()

        source.stage = LifecycleStage.MERGED
        source.merged_into = target_id
        source.updated_at = self._now()

        event = LifecycleEvent(
            event_type=LifecycleEventType.MERGE,
            agent_id=target_id,
            agent_name=target.name,
            actor=actor,
            previous_state=prev_target,
            new_state=self._snapshot(target),
            details={"merged_from": source_id, "merged_from_name": source.name},
        )
        self._log(event)
        return target, event

    def fork_agent(
        self,
        agent_id: str,
        new_name: str,
        actor: str = "system",
    ) -> Tuple[ManagedAgent, LifecycleEvent]:
        source = self.agents[agent_id]

        forked_version = copy.deepcopy(source.current_version)
        forked_version.version_id = str(uuid.uuid4())[:8]
        forked_version.version_number = 1
        forked_version.created_at = self._now()
        forked_version.metadata = {"forked_from": agent_id}

        new_id = f"agent-{uuid.uuid4().hex[:12]}"
        forked = ManagedAgent(
            agent_id=new_id,
            name=new_name,
            role=source.role,
            stage=LifecycleStage.CANDIDATE,
            current_version=forked_version,
            version_history=[forked_version],
            approved_tools=list(source.approved_tools),
            domain_restrictions=list(source.domain_restrictions),
            governance_required=source.governance_required,
            parent_id=agent_id,
        )
        self.agents[new_id] = forked

        event = LifecycleEvent(
            event_type=LifecycleEventType.FORK,
            agent_id=new_id,
            agent_name=new_name,
            actor=actor,
            new_state=self._snapshot(forked),
            details={"forked_from": agent_id, "forked_from_name": source.name},
        )
        self._log(event)
        return forked, event

    def retire_agent(
        self,
        agent_id: str,
        actor: str = "system",
    ) -> Tuple[ManagedAgent, LifecycleEvent]:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)
        self._ensure_stage(
            agent,
            [LifecycleStage.CANDIDATE, LifecycleStage.STAGING, LifecycleStage.ACTIVE, LifecycleStage.FROZEN],
            "retire",
        )

        agent.stage = LifecycleStage.RETIRED
        agent.updated_at = self._now()

        event = LifecycleEvent(
            event_type=LifecycleEventType.RETIREMENT,
            agent_id=agent_id,
            agent_name=agent.name,
            actor=actor,
            previous_state=prev,
            new_state=self._snapshot(agent),
            details={"final_performance": agent.performance_score, "total_missions": agent.total_missions},
        )
        self._log(event)
        return agent, event

    # ------------------------------------------------------------------
    # Human oversight operations
    # ------------------------------------------------------------------

    def freeze_agent(self, agent_id: str, actor: str = "user") -> LifecycleEvent:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)
        self._ensure_stage(
            agent,
            [LifecycleStage.CANDIDATE, LifecycleStage.STAGING, LifecycleStage.ACTIVE],
            "freeze",
        )
        agent.frozen = True
        agent.stage = LifecycleStage.FROZEN
        agent.updated_at = self._now()
        event = LifecycleEvent(
            event_type=LifecycleEventType.FREEZE,
            agent_id=agent_id, agent_name=agent.name, actor=actor,
            previous_state=prev, new_state=self._snapshot(agent),
        )
        self._log(event)
        return event

    def unfreeze_agent(self, agent_id: str, actor: str = "user") -> LifecycleEvent:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)
        self._ensure_stage(agent, [LifecycleStage.FROZEN], "unfreeze")
        if agent.governance_required:
            self._require_privileged_actor(actor, "unfreeze")
        agent.frozen = False
        agent.stage = LifecycleStage.ACTIVE
        agent.updated_at = self._now()
        event = LifecycleEvent(
            event_type=LifecycleEventType.UNFREEZE,
            agent_id=agent_id, agent_name=agent.name, actor=actor,
            previous_state=prev, new_state=self._snapshot(agent),
        )
        self._log(event)
        return event

    def promote_agent(self, agent_id: str, new_posture: SafetyPosture, actor: str = "user") -> LifecycleEvent:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)
        if agent.current_version:
            agent.current_version.safety_posture = new_posture
        agent.governance_required = new_posture.level >= SafetyPosture.HIGH.level
        agent.updated_at = self._now()
        event = LifecycleEvent(
            event_type=LifecycleEventType.PROMOTION,
            agent_id=agent_id, agent_name=agent.name, actor=actor,
            previous_state=prev, new_state=self._snapshot(agent),
            details={"new_posture": new_posture.value},
        )
        self._log(event)
        return event

    def demote_agent(self, agent_id: str, new_posture: SafetyPosture, actor: str = "user") -> LifecycleEvent:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)
        current = agent.current_version.safety_posture if agent.current_version else SafetyPosture.STANDARD
        if new_posture.level < current.level and actor not in ("governor", "user:root"):
            raise ValueError(
                "Demotion that weakens safety posture requires actor 'governor' or 'user:root'"
            )
        if agent.current_version:
            agent.current_version.safety_posture = new_posture
        agent.updated_at = self._now()
        event = LifecycleEvent(
            event_type=LifecycleEventType.DEMOTION,
            agent_id=agent_id, agent_name=agent.name, actor=actor,
            previous_state=prev, new_state=self._snapshot(agent),
            details={"new_posture": new_posture.value},
        )
        self._log(event)
        return event

    def lock_tools(self, agent_id: str, actor: str = "user") -> LifecycleEvent:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)
        agent.tools_locked = True
        agent.updated_at = self._now()
        event = LifecycleEvent(
            event_type=LifecycleEventType.TOOL_LOCK,
            agent_id=agent_id, agent_name=agent.name, actor=actor,
            previous_state=prev, new_state=self._snapshot(agent),
        )
        self._log(event)
        return event

    def unlock_tools(self, agent_id: str, actor: str = "user") -> LifecycleEvent:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)
        self._require_privileged_actor(actor, "unlock_tools")
        agent.tools_locked = False
        agent.updated_at = self._now()
        event = LifecycleEvent(
            event_type=LifecycleEventType.TOOL_UNLOCK,
            agent_id=agent_id, agent_name=agent.name, actor=actor,
            previous_state=prev, new_state=self._snapshot(agent),
        )
        self._log(event)
        return event

    def set_domain_restrictions(
        self, agent_id: str, domains: List[str], actor: str = "user"
    ) -> LifecycleEvent:
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)
        agent.domain_restrictions = domains
        if agent.current_version:
            agent.current_version.domain_restrictions = domains
        agent.updated_at = self._now()
        event = LifecycleEvent(
            event_type=LifecycleEventType.DOMAIN_RESTRICT,
            agent_id=agent_id, agent_name=agent.name, actor=actor,
            previous_state=prev, new_state=self._snapshot(agent),
            details={"domains": domains},
        )
        self._log(event)
        return event

    def promote_to_champion(self, agent_id: str, actor: str = "system") -> LifecycleEvent:
        """Promote an agent to Champion type, granting special privileges."""
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)

        # Only active agents can be promoted.
        self._ensure_stage(agent, [LifecycleStage.ACTIVE], "promote_to_champion")
        self._require_privileged_actor(actor, "promote_to_champion")

        agent.agent_type = AgentType.CHAMPION
        agent.updated_at = self._now()

        event = LifecycleEvent(
            event_type=LifecycleEventType.CHAMPION_PROMOTION,
            agent_id=agent_id,
            agent_name=agent.name,
            actor=actor,
            previous_state=prev,
            new_state=self._snapshot(agent),
            details={"new_type": "champion"},
        )
        self._log(event)
        return event

    def demote_from_champion(self, agent_id: str, actor: str = "system") -> LifecycleEvent:
        """Demote a Champion agent back to Standard type."""
        agent = self.agents[agent_id]
        prev = self._snapshot(agent)

        if agent.agent_type != AgentType.CHAMPION:
            raise ValueError(f"Agent {agent.name} ({agent_id}) is not a Champion.")

        self._require_privileged_actor(actor, "demote_from_champion")

        agent.agent_type = AgentType.STANDARD
        agent.updated_at = self._now()

        event = LifecycleEvent(
            event_type=LifecycleEventType.CHAMPION_DEMOTION,
            agent_id=agent_id,
            agent_name=agent.name,
            actor=actor,
            previous_state=prev,
            new_state=self._snapshot(agent),
            details={"new_type": "standard"},
        )
        self._log(event)
        return event

    # ------------------------------------------------------------------
    # Performance tracking (Replay Engine / Swarm Runner integration)
    # ------------------------------------------------------------------

    def record_mission_result(
        self,
        agent_id: str,
        success: bool,
        zpe_score: float = 0.5,
        qb_cost: float = 0.0,
    ) -> None:
        agent = self.agents[agent_id]
        agent.total_missions += 1
        if success:
            agent.total_successes += 1
        else:
            agent.total_failures += 1
        # Exponential moving average for performance
        alpha = 0.3
        agent.performance_score = (
            alpha * zpe_score + (1 - alpha) * agent.performance_score
        )
        if agent.current_version:
            agent.current_version.qb_efficiency = (
                alpha * (1.0 / max(qb_cost, 0.01)) + (1 - alpha) * agent.current_version.qb_efficiency
            )
        agent.updated_at = self._now()

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------

    def get_agent(self, agent_id: str) -> Optional[ManagedAgent]:
        return self.agents.get(agent_id)

    def list_agents(
        self,
        stage: Optional[LifecycleStage] = None,
        role: Optional[str] = None,
    ) -> List[ManagedAgent]:
        agents = list(self.agents.values())
        if stage:
            agents = [a for a in agents if a.stage == stage]
        if role:
            agents = [a for a in agents if a.role == role]
        return agents

    def get_audit_log(
        self,
        agent_id: Optional[str] = None,
        event_type: Optional[LifecycleEventType] = None,
        limit: int = 100,
    ) -> List[LifecycleEvent]:
        log = list(self.audit_log)
        if agent_id:
            log = [e for e in log if e.agent_id == agent_id]
        if event_type:
            log = [e for e in log if e.event_type == event_type]
        return log[-limit:]

    def get_constitutional_status(self) -> Dict[str, Any]:
        """Summary of governance compliance across all agents."""
        total = len(self.agents)
        frozen = sum(a.frozen for a in self.agents.values())
        active = sum(a.stage == LifecycleStage.ACTIVE for a in self.agents.values())
        high_risk = sum(
            a.current_version is not None and a.current_version.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
            for a in self.agents.values()
        )
        governance_enabled = sum(a.governance_required for a in self.agents.values())
        avg_performance = (
            sum(a.performance_score for a in self.agents.values()) / max(total, 1)
        )
        violations_last_10 = sum(
            not e.safety_check_passed for e in self.audit_log[-10:]
        )

        return {
            "total_agents": total,
            "active_agents": active,
            "frozen_agents": frozen,
            "high_risk_agents": high_risk,
            "governance_enabled": governance_enabled,
            "avg_performance": round(avg_performance, 3),
            "recent_violations": violations_last_10,
            "total_audit_events": len(self.audit_log),
            "rules_count": len(self.constraints),
            "rules": [{"id": r.rule_id, "desc": r.description, "severity": r.severity.value} for r in self.constraints],
        }

    # ------------------------------------------------------------------
    # Serialization
    # ------------------------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        """Full state export for API responses."""
        return {
            "agents": {
                aid: {
                    "agent_id": a.agent_id,
                    "name": a.name,
                    "role": a.role,
                    "agent_type": a.agent_type.value,
                    "stage": a.stage.value,
                    "frozen": a.frozen,
                    "tools_locked": a.tools_locked,
                    "approved_tools": a.approved_tools,
                    "domain_restrictions": a.domain_restrictions,
                    "governance_required": a.governance_required,
                    "performance_score": round(a.performance_score, 3),
                    "total_missions": a.total_missions,
                    "total_successes": a.total_successes,
                    "total_failures": a.total_failures,
                    "parent_id": a.parent_id,
                    "merged_into": a.merged_into,
                    "current_version": {
                        "version_number": a.current_version.version_number,
                        "safety_posture": a.current_version.safety_posture.value,
                        "risk_level": a.current_version.risk_level.value,
                        "tools": a.current_version.tools,
                        "specialization_tags": a.current_version.specialization_tags,
                        "zpe_baseline": a.current_version.zpe_baseline,
                        "qb_efficiency": round(a.current_version.qb_efficiency, 3),
                        "domain_restrictions": a.current_version.domain_restrictions,
                    } if a.current_version else None,
                    "version_count": len(a.version_history),
                    "created_at": a.created_at,
                    "updated_at": a.updated_at,
                }
                for aid, a in self.agents.items()
            },
            "constitutional_status": self.get_constitutional_status(),
            "audit_log": [
                {
                    "event_id": e.event_id,
                    "event_type": e.event_type.value,
                    "agent_id": e.agent_id,
                    "agent_name": e.agent_name,
                    "timestamp": e.timestamp,
                    "actor": e.actor,
                    "safety_check_passed": e.safety_check_passed,
                    "governance_approval": e.governance_approval,
                    "details": e.details,
                }
                for e in self.audit_log[-50:]
            ],
        }
