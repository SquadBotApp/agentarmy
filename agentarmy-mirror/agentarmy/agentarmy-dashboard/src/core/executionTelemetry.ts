/**
 * Execution Telemetry Layer — the real‑time nervous system of AgentArmy.
 *
 * Collects structured signals from every execution step: performance, cost,
 * safety, ZPE routing, tool/agent behaviour, and runner health. Events are
 * normalised, enriched, stored, and streamed to downstream subsystems.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function severityToValue(severity: string): number {
  if (severity === 'critical') return 4;
  if (severity === 'high') return 3;
  if (severity === 'medium') return 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Telemetry event types
// ---------------------------------------------------------------------------

export type TelemetryCategory =
  | 'performance'
  | 'cost'
  | 'safety'
  | 'zpe'
  | 'tool'
  | 'agent'
  | 'runner'
  | 'governance';

export interface TelemetryEvent {
  id: string;
  missionId: string;
  nodeId?: string;
  runnerId?: string;
  category: TelemetryCategory;
  name: string;
  value: number;
  metadata: Record<string, unknown>;
  timestamp: string;
}

// Performance signals
export interface PerformanceSignal {
  nodeId: string;
  missionId: string;
  runnerId: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  queueWaitMs: number;
  cpuLoad: number;
  gpuLoad: number;
  memoryUsage: number;
  networkLatencyMs: number;
  parallelEfficiency: number;  // 0‑1
}

// Cost / economy signals
export interface CostSignal {
  missionId: string;
  nodeId: string;
  qbSpent: number;
  qbEarned: number;
  qbcStaked: number;
  costToValueRatio: number;
  dynamicPricingMultiplier: number;
}

// Safety / governance signals
export interface SafetySignal {
  missionId: string;
  nodeId: string;
  ruleTriggered: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  redacted: boolean;
  escalated: boolean;
  blocked: boolean;
  details: string;
}

// ZPE routing signals
export interface ZpeSignal {
  missionId: string;
  nodeId: string;
  zpeScore: number;
  alternativeScores: Array<{ path: string; score: number }>;
  chosenEdge: string;
  loopConvergence: number;  // 0‑1, 1 = converged
  riskDelta: number;
  costDelta: number;
}

// Tool / agent signals
export interface ToolAgentSignal {
  missionId: string;
  nodeId: string;
  entityType: 'tool' | 'agent';
  entityId: string;
  success: boolean;
  latencyMs: number;
  costQb: number;
  errorSignature?: string;
  reasoningQuality?: number;  // agent only, 0‑1
  specializationTag?: string;
}

// Runner signals
export interface RunnerSignal {
  runnerId: string;
  health: string;
  specialization: string[];
  failureRate: number;
  retryCount: number;
  loadDistribution: number;
  latencyTrend: 'improving' | 'stable' | 'degrading';
}

// ---------------------------------------------------------------------------
// Telemetry store — in‑memory ring buffer + event bus
// ---------------------------------------------------------------------------

export type TelemetryListener = (event: TelemetryEvent) => void;

const MAX_EVENTS = 10_000;

export class ExecutionTelemetry {
  private events: TelemetryEvent[] = [];
  private readonly listeners: Map<TelemetryCategory | '*', TelemetryListener[]> = new Map();

  // ---- Ingest ----

  recordPerformance(signal: PerformanceSignal): TelemetryEvent {
    return this.push({
      category: 'performance',
      name: 'node_execution',
      missionId: signal.missionId,
      nodeId: signal.nodeId,
      runnerId: signal.runnerId,
      value: signal.durationMs,
      metadata: {
        startMs: signal.startMs,
        endMs: signal.endMs,
        queueWaitMs: signal.queueWaitMs,
        cpuLoad: signal.cpuLoad,
        gpuLoad: signal.gpuLoad,
        memoryUsage: signal.memoryUsage,
        networkLatencyMs: signal.networkLatencyMs,
        parallelEfficiency: signal.parallelEfficiency,
      },
    });
  }

  recordCost(signal: CostSignal): TelemetryEvent {
    return this.push({
      category: 'cost',
      name: 'economy_event',
      missionId: signal.missionId,
      nodeId: signal.nodeId,
      value: signal.qbSpent,
      metadata: {
        qbEarned: signal.qbEarned,
        qbcStaked: signal.qbcStaked,
        costToValueRatio: signal.costToValueRatio,
        dynamicPricingMultiplier: signal.dynamicPricingMultiplier,
      },
    });
  }

  recordSafety(signal: SafetySignal): TelemetryEvent {
    return this.push({
      category: 'safety',
      name: signal.ruleTriggered,
      missionId: signal.missionId,
      nodeId: signal.nodeId,
      value: severityToValue(signal.severity),
      metadata: {
        severity: signal.severity,
        redacted: signal.redacted,
        escalated: signal.escalated,
        blocked: signal.blocked,
        details: signal.details,
      },
    });
  }

  recordZpe(signal: ZpeSignal): TelemetryEvent {
    return this.push({
      category: 'zpe',
      name: 'zpe_routing_decision',
      missionId: signal.missionId,
      nodeId: signal.nodeId,
      value: signal.zpeScore,
      metadata: {
        alternativeScores: signal.alternativeScores,
        chosenEdge: signal.chosenEdge,
        loopConvergence: signal.loopConvergence,
        riskDelta: signal.riskDelta,
        costDelta: signal.costDelta,
      },
    });
  }

  recordToolAgent(signal: ToolAgentSignal): TelemetryEvent {
    return this.push({
      category: signal.entityType === 'tool' ? 'tool' : 'agent',
      name: `${signal.entityType}_${signal.success ? 'success' : 'failure'}`,
      missionId: signal.missionId,
      nodeId: signal.nodeId,
      value: signal.latencyMs,
      metadata: {
        entityId: signal.entityId,
        success: signal.success,
        costQb: signal.costQb,
        errorSignature: signal.errorSignature,
        reasoningQuality: signal.reasoningQuality,
        specializationTag: signal.specializationTag,
      },
    });
  }

  recordRunner(signal: RunnerSignal): TelemetryEvent {
    return this.push({
      category: 'runner',
      name: 'runner_health',
      missionId: '',
      runnerId: signal.runnerId,
      value: signal.failureRate,
      metadata: {
        health: signal.health,
        specialization: signal.specialization,
        retryCount: signal.retryCount,
        loadDistribution: signal.loadDistribution,
        latencyTrend: signal.latencyTrend,
      },
    });
  }

  // ---- Query ----

  getAll(): readonly TelemetryEvent[] {
    return this.events;
  }

  getByMission(missionId: string): TelemetryEvent[] {
    return this.events.filter((e) => e.missionId === missionId);
  }

  getByCategory(category: TelemetryCategory): TelemetryEvent[] {
    return this.events.filter((e) => e.category === category);
  }

  getByRunner(runnerId: string): TelemetryEvent[] {
    return this.events.filter((e) => e.runnerId === runnerId);
  }

  /** Aggregate average value for a category over the last N events. */
  averageValue(category: TelemetryCategory, window = 100): number {
    const slice = this.getByCategory(category).slice(-window);
    if (slice.length === 0) return 0;
    return slice.reduce((s, e) => s + e.value, 0) / slice.length;
  }

  /** Count events matching a predicate within a time window (ms). */
  countRecent(predicate: (e: TelemetryEvent) => boolean, windowMs = 60_000): number {
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    return this.events.filter((e) => e.timestamp >= cutoff && predicate(e)).length;
  }

  // ---- Summary ----

  getSummary(): TelemetrySummary {
    const recent = this.events.slice(-1000);
    const byCategory = new Map<TelemetryCategory, number>();
    for (const e of recent) {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
    }

    return {
      totalEvents: this.events.length,
      recentWindow: recent.length,
      categoryBreakdown: Object.fromEntries(byCategory) as Record<TelemetryCategory, number>,
      avgPerformanceMs: this.averageValue('performance'),
      avgCostQb: this.averageValue('cost'),
      safetyEventCount: byCategory.get('safety') ?? 0,
      zpeAvgScore: this.averageValue('zpe'),
    };
  }

  // ---- Event bus ----

  on(category: TelemetryCategory | '*', listener: TelemetryListener): () => void {
    const list = this.listeners.get(category) ?? [];
    list.push(listener);
    this.listeners.set(category, list);
    return () => {
      const idx = list.indexOf(listener);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  // ---- Internals ----

  private push(partial: Omit<TelemetryEvent, 'id' | 'timestamp'>): TelemetryEvent {
    const event: TelemetryEvent = {
      ...partial,
      id: `tel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    // Ring buffer: trim oldest
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-MAX_EVENTS);
    }

    // Notify listeners
    const specific = this.listeners.get(event.category) ?? [];
    const wildcard = this.listeners.get('*') ?? [];
    for (const fn of [...specific, ...wildcard]) fn(event);

    return event;
  }
}

// ---------------------------------------------------------------------------
// Summary type
// ---------------------------------------------------------------------------

export interface TelemetrySummary {
  totalEvents: number;
  recentWindow: number;
  categoryBreakdown: Partial<Record<TelemetryCategory, number>>;
  avgPerformanceMs: number;
  avgCostQb: number;
  safetyEventCount: number;
  zpeAvgScore: number;
}
