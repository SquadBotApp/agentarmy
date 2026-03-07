/**
 * Global Orchestration Kernel — the unified coordination core of AgentArmy.
 *
 * Binds every subsystem (swarm fabric, telemetry, health, self‑healing,
 * safety, economy, ZPE, evolution) into one continuously running,
 * self‑optimizing OS. Maintains global state, enforces system‑wide rules,
 * synchronises subsystems, and governs all mission/agent/runner lifecycles.
 */

import type {
  SwarmRunnerFabric,
  ExecutionTask,
  ExecutionResult,
  FabricMetrics,
} from './swarmRunnerFabric';
import type {
  ExecutionTelemetry,
  TelemetrySummary,
} from './executionTelemetry';
import type {
  MissionHealthEngine,
  MissionHealthReport,
} from './missionHealth';
import type {
  SelfHealingEngine,
  HealingReport,
} from './selfHealing';

// ---------------------------------------------------------------------------
// Global state types
// ---------------------------------------------------------------------------

export type SafetyPosture = 'relaxed' | 'normal' | 'strict' | 'lockdown';

export interface MissionState {
  missionId: string;
  status: 'planning' | 'running' | 'adapting' | 'completed' | 'failed' | 'aborted';
  nodeProgress: Record<string, string>;   // nodeId → status
  branchesTaken: string[];
  loopCounters: Record<string, number>;
  failures: number;
  retries: number;
  budgetQb: number;
  spentQb: number;
  safetyPosture: SafetyPosture;
  startedAt: string;
  updatedAt: string;
}

export interface AgentState {
  agentId: string;
  version: number;
  specializations: string[];
  safetyPosture: SafetyPosture;
  zpeBias: number;
  evolutionStatus: 'stable' | 'evolving' | 'forking' | 'retired';
  performanceScore: number;   // 0‑1
  toolAccess: string[];
}

export interface EconomyState {
  qbBalance: number;
  qbcStaked: number;
  spendRate: number;        // Qb/min
  rewardPending: number;
  dynamicPricingMultiplier: number;
  halvingCycle: number;
}

export interface IntelligenceState {
  embeddingCount: number;
  patternCount: number;
  lastUpdated: string;
  trendVectors: number;
  predictionAccuracy: number;
}

export interface GlobalState {
  missions: Map<string, MissionState>;
  agents: Map<string, AgentState>;
  economy: EconomyState;
  safetyPosture: SafetyPosture;
  intelligence: IntelligenceState;
  lastSyncAt: string;
}

// ---------------------------------------------------------------------------
// Global rules
// ---------------------------------------------------------------------------

export interface GlobalRule {
  id: string;
  category: 'safety' | 'economy' | 'performance' | 'structural';
  description: string;
  enforce: (state: GlobalState) => RuleViolation | null;
}

export interface RuleViolation {
  ruleId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  correctionHint: string;
}

// ---------------------------------------------------------------------------
// Kernel events
// ---------------------------------------------------------------------------

export type KernelEventType =
  | 'mission_started'
  | 'mission_completed'
  | 'mission_failed'
  | 'mission_adapted'
  | 'agent_evolved'
  | 'agent_retired'
  | 'safety_posture_changed'
  | 'economy_updated'
  | 'rule_violated'
  | 'healing_applied'
  | 'global_optimisation'
  | 'state_synced';

export interface KernelEvent {
  type: KernelEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Orchestration Kernel
// ---------------------------------------------------------------------------

export class GlobalOrchestrationKernel {
  // Global state
  state: GlobalState;

  // Sub‑system references (set via attach)
  private fabric: SwarmRunnerFabric | null = null;
  private telemetry: ExecutionTelemetry | null = null;
  private healthEngine: MissionHealthEngine | null = null;
  private healingEngine: SelfHealingEngine | null = null;

  // Rules
  private readonly rules: GlobalRule[] = [];

  // Event log + listeners
  private eventLog: KernelEvent[] = [];
  private listeners: Array<(ev: KernelEvent) => void> = [];

  constructor() {
    this.state = {
      missions: new Map(),
      agents: new Map(),
      economy: {
        qbBalance: 1000,
        qbcStaked: 0,
        spendRate: 0,
        rewardPending: 0,
        dynamicPricingMultiplier: 1,
        halvingCycle: 0,
      },
      safetyPosture: 'normal',
      intelligence: {
        embeddingCount: 0,
        patternCount: 0,
        lastUpdated: now(),
        trendVectors: 0,
        predictionAccuracy: 0,
      },
      lastSyncAt: now(),
    };

    this.registerDefaultRules();
  }

  // ---- Attach sub‑systems ----

  attachFabric(fabric: SwarmRunnerFabric): void { this.fabric = fabric; }
  attachTelemetry(telemetry: ExecutionTelemetry): void { this.telemetry = telemetry; }
  attachHealthEngine(engine: MissionHealthEngine): void { this.healthEngine = engine; }
  attachHealingEngine(engine: SelfHealingEngine): void { this.healingEngine = engine; }

  // ---- Mission lifecycle ----

  startMission(missionId: string, goal: string, budgetQb: number): MissionState {
    const mission: MissionState = {
      missionId,
      status: 'running',
      nodeProgress: {},
      branchesTaken: [],
      loopCounters: {},
      failures: 0,
      retries: 0,
      budgetQb,
      spentQb: 0,
      safetyPosture: this.state.safetyPosture,
      startedAt: now(),
      updatedAt: now(),
    };
    this.state.missions.set(missionId, mission);
    this.emit('mission_started', { missionId, goal, budgetQb });
    return mission;
  }

  completeMission(missionId: string, success: boolean): void {
    const m = this.state.missions.get(missionId);
    if (!m) return;
    m.status = success ? 'completed' : 'failed';
    m.updatedAt = now();
    this.emit(success ? 'mission_completed' : 'mission_failed', { missionId });
  }

  adaptMission(missionId: string, reason: string): void {
    const m = this.state.missions.get(missionId);
    if (!m) return;
    m.status = 'adapting';
    m.updatedAt = now();
    this.emit('mission_adapted', { missionId, reason });
  }

  // ---- Agent lifecycle ----

  registerAgent(agent: AgentState): void {
    this.state.agents.set(agent.agentId, agent);
  }

  evolveAgent(agentId: string, newVersion: number, newSpecs: string[]): void {
    const a = this.state.agents.get(agentId);
    if (!a) return;
    a.version = newVersion;
    a.specializations = newSpecs;
    a.evolutionStatus = 'evolving';
    this.emit('agent_evolved', { agentId, newVersion, newSpecs });
  }

  retireAgent(agentId: string): void {
    const a = this.state.agents.get(agentId);
    if (!a) return;
    a.evolutionStatus = 'retired';
    this.emit('agent_retired', { agentId });
  }

  // ---- Execution (delegate to fabric) ----

  executeTask(task: ExecutionTask): ExecutionResult | null {
    if (!this.fabric) return null;

    // Economy gate: check budget
    const mission = this.state.missions.get(task.missionId);
    if (mission && mission.spentQb + task.budgetQb > mission.budgetQb) {
      return {
        taskId: task.id,
        runnerId: 'kernel',
        success: false,
        output: null,
        latencyMs: 0,
        costQb: 0,
        safetyFlags: [],
        retries: 0,
        error: 'Budget exceeded',
        timestamp: now(),
      };
    }

    const result = this.fabric.execute(task);

    // Update mission economics
    if (mission) {
      mission.spentQb += result.costQb;
      mission.nodeProgress[task.id] = result.success ? 'completed' : 'failed';
      if (!result.success) mission.failures += 1;
      mission.updatedAt = now();
    }

    // Update global economy
    this.state.economy.qbBalance -= result.costQb;
    this.state.economy.spendRate = this.calculateSpendRate();

    return result;
  }

  // ---- Health & healing orchestration ----

  runHealthCheck(missionId: string): MissionHealthReport | null {
    if (!this.healthEngine || !this.telemetry) return null;
    return this.healthEngine.evaluate(missionId, this.telemetry);
  }

  runHealingCycle(missionId: string): HealingReport | null {
    if (!this.healingEngine || !this.telemetry || !this.fabric) return null;
    const healthReport = this.runHealthCheck(missionId);
    const report = this.healingEngine.runHealingCycle(missionId, this.telemetry, this.fabric, healthReport ?? undefined);
    if (report.healingActionsApplied > 0) {
      this.emit('healing_applied', { missionId, actionsApplied: report.healingActionsApplied });
    }
    return report;
  }

  // ---- Safety ----

  setSafetyPosture(posture: SafetyPosture): void {
    this.state.safetyPosture = posture;
    // Propagate to all running missions
    for (const m of this.state.missions.values()) {
      if (m.status === 'running' || m.status === 'adapting') {
        m.safetyPosture = posture;
      }
    }
    this.emit('safety_posture_changed', { posture });
  }

  // ---- Economy ----

  adjustEconomy(updates: Partial<EconomyState>): void {
    Object.assign(this.state.economy, updates);
    this.emit('economy_updated', updates);
  }

  // ---- Rule enforcement ----

  addRule(rule: GlobalRule): void {
    this.rules.push(rule);
  }

  enforceRules(): RuleViolation[] {
    const violations: RuleViolation[] = [];
    for (const rule of this.rules) {
      const v = rule.enforce(this.state);
      if (v) {
        violations.push(v);
        this.emit('rule_violated', { ruleId: v.ruleId, description: v.description, severity: v.severity });
      }
    }
    return violations;
  }

  // ---- Global optimisation tick ----

  /** Run one optimisation cycle: health + healing + rule enforcement + sync. */
  tick(): KernelTickResult {
    const violations = this.enforceRules();

    const healthReports: MissionHealthReport[] = [];
    const healingReports: HealingReport[] = [];

    for (const m of this.state.missions.values()) {
      if (m.status !== 'running' && m.status !== 'adapting') continue;
      const hr = this.runHealthCheck(m.missionId);
      if (hr) healthReports.push(hr);

      // Auto-heal if warnings or critical
      if (hr && hr.overallLevel !== 'stable') {
        const heal = this.runHealingCycle(m.missionId);
        if (heal) healingReports.push(heal);
      }
    }

    this.state.lastSyncAt = now();
    this.emit('state_synced', { missionsChecked: healthReports.length });

    return {
      violations,
      healthReports,
      healingReports,
      timestamp: now(),
    };
  }

  // ---- Metrics / summary ----

  getSummary(): KernelSummary {
    const missions = [...this.state.missions.values()];
    const agents = [...this.state.agents.values()];
    const fabricMetrics = this.fabric?.getMetrics() ?? null;
    const telemetrySummary = this.telemetry?.getSummary() ?? null;

    return {
      activeMissions: missions.filter((m) => m.status === 'running' || m.status === 'adapting').length,
      completedMissions: missions.filter((m) => m.status === 'completed').length,
      failedMissions: missions.filter((m) => m.status === 'failed').length,
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.evolutionStatus !== 'retired').length,
      safetyPosture: this.state.safetyPosture,
      economy: { ...this.state.economy },
      intelligence: { ...this.state.intelligence },
      fabricMetrics,
      telemetrySummary,
      eventLogSize: this.eventLog.length,
      lastSyncAt: this.state.lastSyncAt,
    };
  }

  getRecentEvents(limit = 50): KernelEvent[] {
    return this.eventLog.slice(-limit);
  }

  // ---- Event system ----

  on(listener: (ev: KernelEvent) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private emit(type: KernelEventType, payload: Record<string, unknown>): void {
    const ev: KernelEvent = { type, payload, timestamp: now() };
    this.eventLog.push(ev);
    if (this.eventLog.length > 5000) this.eventLog = this.eventLog.slice(-5000);
    for (const fn of this.listeners) fn(ev);
  }

  // ---- Private helpers ----

  private calculateSpendRate(): number {
    const missions = [...this.state.missions.values()].filter((m) => m.status === 'running');
    if (missions.length === 0) return 0;
    const totalSpent = missions.reduce((s, m) => s + m.spentQb, 0);
    const startTimes = missions.map((m) => new Date(m.startedAt).getTime());
    const oldest = new Date(Math.min(...startTimes)).toISOString();
    const elapsedMin = (Date.now() - new Date(oldest).getTime()) / 60_000;
    return elapsedMin > 0 ? totalSpent / elapsedMin : 0;
  }

  private registerDefaultRules(): void {
    this.addRule({
      id: 'safety-no-bypass',
      category: 'safety',
      description: 'No mission may run with safety posture below the global posture',
      enforce: (state) => {
        const global = postureSeverity(state.safetyPosture);
        for (const m of state.missions.values()) {
          if (m.status !== 'running') continue;
          if (postureSeverity(m.safetyPosture) < global) {
            return {
              ruleId: 'safety-no-bypass',
              description: `Mission ${m.missionId} has weaker safety posture than global`,
              severity: 'high',
              correctionHint: 'Upgrade mission safety posture',
            };
          }
        }
        return null;
      },
    });

    this.addRule({
      id: 'economy-no-overspend',
      category: 'economy',
      description: 'Global Qb balance may not go negative',
      enforce: (state) => {
        if (state.economy.qbBalance < 0) {
          return {
            ruleId: 'economy-no-overspend',
            description: `Global Qb balance is negative (${state.economy.qbBalance.toFixed(2)})`,
            severity: 'critical',
            correctionHint: 'Pause non-critical missions or inject Qb',
          };
        }
        return null;
      },
    });

    this.addRule({
      id: 'perf-loop-bound',
      category: 'performance',
      description: 'No mission may exceed 200 loop iterations',
      enforce: (state) => {
        for (const m of state.missions.values()) {
          for (const [nodeId, count] of Object.entries(m.loopCounters)) {
            if (count > 200) {
              return {
                ruleId: 'perf-loop-bound',
                description: `Mission ${m.missionId} node ${nodeId} exceeded 200 loops`,
                severity: 'high',
                correctionHint: 'Tighten loop bounds or abort node',
              };
            }
          }
        }
        return null;
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface KernelTickResult {
  violations: RuleViolation[];
  healthReports: MissionHealthReport[];
  healingReports: HealingReport[];
  timestamp: string;
}

export interface KernelSummary {
  activeMissions: number;
  completedMissions: number;
  failedMissions: number;
  totalAgents: number;
  activeAgents: number;
  safetyPosture: SafetyPosture;
  economy: EconomyState;
  intelligence: IntelligenceState;
  fabricMetrics: FabricMetrics | null;
  telemetrySummary: TelemetrySummary | null;
  eventLogSize: number;
  lastSyncAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

function postureSeverity(p: SafetyPosture): number {
  const map: Record<SafetyPosture, number> = { relaxed: 0, normal: 1, strict: 2, lockdown: 3 };
  return map[p] ?? 1;
}
