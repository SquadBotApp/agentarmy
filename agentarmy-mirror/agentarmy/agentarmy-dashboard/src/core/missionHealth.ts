/**
 * Mission Health & Stability Engine — the "immune system" of AgentArmy.
 *
 * Continuously evaluates four stability dimensions — performance, safety,
 * economy, and structural — using telemetry signals. When instability is
 * detected, corrective actions are emitted so that downstream subsystems
 * (swarm runners, deployment orchestrator, constitutional engine, ZPE
 * trainer) can react in real time.
 */

import type { TelemetryEvent, TelemetrySummary, ExecutionTelemetry } from './executionTelemetry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StabilityDimension = 'performance' | 'safety' | 'economy' | 'structural';
export type StabilityLevel = 'stable' | 'warning' | 'critical';

export interface DimensionHealth {
  dimension: StabilityDimension;
  level: StabilityLevel;
  score: number;        // 0‑1 (1 = fully healthy)
  indicators: HealthIndicator[];
  corrections: CorrectionAction[];
}

export interface HealthIndicator {
  name: string;
  value: number;
  threshold: number;
  breached: boolean;
}

export interface CorrectionAction {
  id: string;
  dimension: StabilityDimension;
  action: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  auto: boolean;         // can be applied automatically
  timestamp: string;
}

export interface MissionHealthReport {
  missionId: string;
  overallLevel: StabilityLevel;
  overallScore: number;
  dimensions: DimensionHealth[];
  correctionsPending: CorrectionAction[];
  evaluatedAt: string;
}

// Configurable thresholds
export interface StabilityThresholds {
  performance: {
    maxAvgLatencyMs: number;
    maxRetryRate: number;
    minParallelEfficiency: number;
    maxQueueWaitMs: number;
  };
  safety: {
    maxEscalationRate: number;
    maxRedactionRate: number;
    maxBlockedRate: number;
    maxCriticalEvents: number;
  };
  economy: {
    maxSpendRate: number;        // Qb/min
    maxCostToValueRatio: number;
    minRewardEfficiency: number;
    budgetWarningPercent: number;
  };
  structural: {
    maxLoopIterations: number;
    maxBranchingFactor: number;
    maxUnreachableNodes: number;
    maxDeadEndBranches: number;
  };
}

const DEFAULT_THRESHOLDS: StabilityThresholds = {
  performance: {
    maxAvgLatencyMs: 5000,
    maxRetryRate: 0.2,
    minParallelEfficiency: 0.3,
    maxQueueWaitMs: 10_000,
  },
  safety: {
    maxEscalationRate: 0.1,
    maxRedactionRate: 0.15,
    maxBlockedRate: 0.05,
    maxCriticalEvents: 3,
  },
  economy: {
    maxSpendRate: 50,
    maxCostToValueRatio: 2,
    minRewardEfficiency: 0.1,
    budgetWarningPercent: 0.8,
  },
  structural: {
    maxLoopIterations: 100,
    maxBranchingFactor: 10,
    maxUnreachableNodes: 0,
    maxDeadEndBranches: 2,
  },
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class MissionHealthEngine {
  private readonly thresholds: StabilityThresholds;
  private corrections: CorrectionAction[] = [];
  private listeners: Array<(report: MissionHealthReport) => void> = [];

  constructor(thresholds?: Partial<StabilityThresholds>) {
    this.thresholds = {
      performance: { ...DEFAULT_THRESHOLDS.performance, ...thresholds?.performance },
      safety: { ...DEFAULT_THRESHOLDS.safety, ...thresholds?.safety },
      economy: { ...DEFAULT_THRESHOLDS.economy, ...thresholds?.economy },
      structural: { ...DEFAULT_THRESHOLDS.structural, ...thresholds?.structural },
    };
  }

  // ---- Evaluate full health ----

  evaluate(missionId: string, telemetry: ExecutionTelemetry, structuralInfo?: StructuralInfo): MissionHealthReport {
    const summary = telemetry.getSummary();
    const missionEvents = telemetry.getByMission(missionId);

    const perf = this.evaluatePerformance(missionEvents, summary);
    const safety = this.evaluateSafety(missionEvents, summary);
    const economy = this.evaluateEconomy(missionEvents, summary);
    const structural = this.evaluateStructural(structuralInfo);

    const dimensions = [perf, safety, economy, structural];
    const overallScore = dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length;
    const overallLevel = levelFromScore(overallScore);

    const newCorrections = dimensions.flatMap((d) => d.corrections);
    this.corrections.push(...newCorrections);

    const report: MissionHealthReport = {
      missionId,
      overallLevel,
      overallScore: Number(overallScore.toFixed(3)),
      dimensions,
      correctionsPending: newCorrections.filter((c) => !c.auto),
      evaluatedAt: new Date().toISOString(),
    };

    for (const fn of this.listeners) fn(report);
    return report;
  }

  // ---- Dimension evaluators ----

  private evaluatePerformance(events: TelemetryEvent[], _summary: TelemetrySummary): DimensionHealth {
    const perfEvents = events.filter((e) => e.category === 'performance');
    const t = this.thresholds.performance;

    const avgLatency = perfEvents.length > 0
      ? perfEvents.reduce((s, e) => s + e.value, 0) / perfEvents.length
      : 0;
    const retries = events.filter((e) => e.name.includes('retry')).length;
    const retryRate = events.length > 0 ? retries / events.length : 0;
    const parallelEff = perfEvents.length > 0
      ? perfEvents.reduce((s, e) => s + ((e.metadata.parallelEfficiency as number) ?? 0.5), 0) / perfEvents.length
      : 1;
    const queueWaits = perfEvents.map((e) => (e.metadata.queueWaitMs as number) ?? 0);
    const avgQueueWait = queueWaits.length > 0 ? queueWaits.reduce((a, b) => a + b, 0) / queueWaits.length : 0;

    const indicators: HealthIndicator[] = [
      { name: 'avg_latency_ms', value: avgLatency, threshold: t.maxAvgLatencyMs, breached: avgLatency > t.maxAvgLatencyMs },
      { name: 'retry_rate', value: retryRate, threshold: t.maxRetryRate, breached: retryRate > t.maxRetryRate },
      { name: 'parallel_efficiency', value: parallelEff, threshold: t.minParallelEfficiency, breached: parallelEff < t.minParallelEfficiency },
      { name: 'avg_queue_wait_ms', value: avgQueueWait, threshold: t.maxQueueWaitMs, breached: avgQueueWait > t.maxQueueWaitMs },
    ];

    const breached = indicators.filter((i) => i.breached);
    const score = 1 - breached.length / indicators.length;
    const corrections = this.generatePerformanceCorrections(breached);

    return { dimension: 'performance', level: levelFromScore(score), score, indicators, corrections };
  }

  private evaluateSafety(events: TelemetryEvent[], _summary: TelemetrySummary): DimensionHealth {
    const safetyEvents = events.filter((e) => e.category === 'safety');
    const t = this.thresholds.safety;
    const total = Math.max(1, events.length);

    const escalated = safetyEvents.filter((e) => (e.metadata.escalated as boolean)).length;
    const redacted = safetyEvents.filter((e) => (e.metadata.redacted as boolean)).length;
    const blocked = safetyEvents.filter((e) => (e.metadata.blocked as boolean)).length;
    const critical = safetyEvents.filter((e) => (e.metadata.severity as string) === 'critical').length;

    const indicators: HealthIndicator[] = [
      { name: 'escalation_rate', value: escalated / total, threshold: t.maxEscalationRate, breached: escalated / total > t.maxEscalationRate },
      { name: 'redaction_rate', value: redacted / total, threshold: t.maxRedactionRate, breached: redacted / total > t.maxRedactionRate },
      { name: 'blocked_rate', value: blocked / total, threshold: t.maxBlockedRate, breached: blocked / total > t.maxBlockedRate },
      { name: 'critical_events', value: critical, threshold: t.maxCriticalEvents, breached: critical > t.maxCriticalEvents },
    ];

    const breached = indicators.filter((i) => i.breached);
    const score = 1 - breached.length / indicators.length;
    const corrections = this.generateSafetyCorrections(breached);

    return { dimension: 'safety', level: levelFromScore(score), score, indicators, corrections };
  }

  private evaluateEconomy(events: TelemetryEvent[], _summary: TelemetrySummary): DimensionHealth {
    const costEvents = events.filter((e) => e.category === 'cost');
    const t = this.thresholds.economy;

    const totalSpent = costEvents.reduce((s, e) => s + e.value, 0);
    const earned = costEvents.reduce((s, e) => s + ((e.metadata.qbEarned as number) ?? 0), 0);
    const ctv = costEvents.length > 0
      ? costEvents.reduce((s, e) => s + ((e.metadata.costToValueRatio as number) ?? 1), 0) / costEvents.length
      : 1;
    const rewardEff = totalSpent > 0 ? earned / totalSpent : 1;

    // Estimate spend rate (Qb per minute)
    const timespan = costEvents.length >= 2
      ? (new Date(costEvents.at(-1)!.timestamp).getTime() - new Date(costEvents[0].timestamp).getTime()) / 60_000
      : 1;
    const spendRate = timespan > 0 ? totalSpent / timespan : 0;

    const indicators: HealthIndicator[] = [
      { name: 'spend_rate_qb_min', value: spendRate, threshold: t.maxSpendRate, breached: spendRate > t.maxSpendRate },
      { name: 'cost_to_value_ratio', value: ctv, threshold: t.maxCostToValueRatio, breached: ctv > t.maxCostToValueRatio },
      { name: 'reward_efficiency', value: rewardEff, threshold: t.minRewardEfficiency, breached: rewardEff < t.minRewardEfficiency },
    ];

    const breached = indicators.filter((i) => i.breached);
    const score = 1 - breached.length / indicators.length;
    const corrections = this.generateEconomyCorrections(breached);

    return { dimension: 'economy', level: levelFromScore(score), score, indicators, corrections };
  }

  private evaluateStructural(info?: StructuralInfo): DimensionHealth {
    const t = this.thresholds.structural;
    const s = info ?? { loopIterations: 0, branchingFactor: 1, unreachableNodes: 0, deadEndBranches: 0 };

    const indicators: HealthIndicator[] = [
      { name: 'loop_iterations', value: s.loopIterations, threshold: t.maxLoopIterations, breached: s.loopIterations > t.maxLoopIterations },
      { name: 'branching_factor', value: s.branchingFactor, threshold: t.maxBranchingFactor, breached: s.branchingFactor > t.maxBranchingFactor },
      { name: 'unreachable_nodes', value: s.unreachableNodes, threshold: t.maxUnreachableNodes, breached: s.unreachableNodes > t.maxUnreachableNodes },
      { name: 'dead_end_branches', value: s.deadEndBranches, threshold: t.maxDeadEndBranches, breached: s.deadEndBranches > t.maxDeadEndBranches },
    ];

    const breached = indicators.filter((i) => i.breached);
    const score = 1 - breached.length / indicators.length;
    const corrections = this.generateStructuralCorrections(breached);

    return { dimension: 'structural', level: levelFromScore(score), score, indicators, corrections };
  }

  // ---- Correction generators ----

  private generatePerformanceCorrections(breached: HealthIndicator[]): CorrectionAction[] {
    return breached.map((b) => ({
      id: `corr-perf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dimension: 'performance' as const,
      action: perfActionMap[b.name] ?? 'rebalance_swarm',
      description: `${b.name} exceeded threshold (${b.value.toFixed(2)} > ${b.threshold})`,
      severity: b.value > b.threshold * 2 ? 'high' as const : 'medium' as const,
      auto: true,
      timestamp: new Date().toISOString(),
    }));
  }

  private generateSafetyCorrections(breached: HealthIndicator[]): CorrectionAction[] {
    return breached.map((b) => ({
      id: `corr-safe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dimension: 'safety' as const,
      action: safetyActionMap[b.name] ?? 'escalate_to_governor',
      description: `${b.name} exceeded threshold (${b.value.toFixed(4)} > ${b.threshold})`,
      severity: 'high' as const,
      auto: b.name !== 'critical_events',
      timestamp: new Date().toISOString(),
    }));
  }

  private generateEconomyCorrections(breached: HealthIndicator[]): CorrectionAction[] {
    return breached.map((b) => ({
      id: `corr-econ-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dimension: 'economy' as const,
      action: economyActionMap[b.name] ?? 'reduce_loop_iterations',
      description: `${b.name} out of bounds (${b.value.toFixed(3)} vs ${b.threshold})`,
      severity: 'medium' as const,
      auto: true,
      timestamp: new Date().toISOString(),
    }));
  }

  private generateStructuralCorrections(breached: HealthIndicator[]): CorrectionAction[] {
    return breached.map((b) => ({
      id: `corr-struct-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dimension: 'structural' as const,
      action: structuralActionMap[b.name] ?? 'insert_fallback_path',
      description: `${b.name} issue (${b.value} vs threshold ${b.threshold})`,
      severity: b.name === 'unreachable_nodes' ? 'high' as const : 'medium' as const,
      auto: b.name !== 'unreachable_nodes',
      timestamp: new Date().toISOString(),
    }));
  }

  // ---- Accessors ----

  getPendingCorrections(): CorrectionAction[] {
    return [...this.corrections];
  }

  clearCorrections(): void {
    this.corrections = [];
  }

  on(listener: (report: MissionHealthReport) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }
}

// ---------------------------------------------------------------------------
// Structural info (from MissionGraph analysis)
// ---------------------------------------------------------------------------

export interface StructuralInfo {
  loopIterations: number;
  branchingFactor: number;
  unreachableNodes: number;
  deadEndBranches: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function levelFromScore(score: number): StabilityLevel {
  if (score >= 0.75) return 'stable';
  if (score >= 0.4) return 'warning';
  return 'critical';
}

const perfActionMap: Record<string, string> = {
  avg_latency_ms: 'shift_to_faster_runners',
  retry_rate: 'reroute_around_failing_nodes',
  parallel_efficiency: 'increase_parallelization',
  avg_queue_wait_ms: 'reduce_concurrency',
};

const safetyActionMap: Record<string, string> = {
  escalation_rate: 'escalate_to_governor',
  redaction_rate: 'enforce_stricter_safety',
  blocked_rate: 'reroute_through_safer_branches',
  critical_events: 'insert_governance_nodes',
};

const economyActionMap: Record<string, string> = {
  spend_rate_qb_min: 'switch_to_cheaper_tools',
  cost_to_value_ratio: 'reduce_loop_iterations',
  reward_efficiency: 'prioritize_staked_paths',
};

const structuralActionMap: Record<string, string> = {
  loop_iterations: 'tighten_loop_bounds',
  branching_factor: 'collapse_redundant_nodes',
  unreachable_nodes: 'prune_unreachable_branches',
  dead_end_branches: 'insert_fallback_path',
};
