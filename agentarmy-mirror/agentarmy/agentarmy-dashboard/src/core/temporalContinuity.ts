/**
 * Temporal Continuity Engine — memory across time for AgentArmy.
 *
 * Tracks how missions, agents, tools, runners, and economy patterns evolve
 * over hours, days, and months. Builds temporal models that enable predictive
 * routing, predictive safety, predictive economy, and predictive evolution.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimelineEntity = 'mission' | 'agent' | 'tool' | 'runner' | 'economy' | 'safety';

export interface TimelineEntry {
  id: string;
  entityType: TimelineEntity;
  entityId: string;
  metric: string;
  value: number;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export type TrendDirection = 'improving' | 'stable' | 'degrading' | 'volatile';

export interface TrendAnalysis {
  entityType: TimelineEntity;
  entityId: string;
  metric: string;
  direction: TrendDirection;
  slope: number;             // positive = improving for performance, negative = degrading
  confidence: number;        // 0‑1
  dataPoints: number;
  windowMs: number;
  predictedNextValue: number;
  anomalyDetected: boolean;
}

export interface TemporalPrediction {
  entityType: TimelineEntity;
  entityId: string;
  metric: string;
  predictedValue: number;
  confidence: number;
  horizonMs: number;
  basis: string;             // human description of why
}

export interface TemporalSnapshot {
  totalEntries: number;
  entityCounts: Record<TimelineEntity, number>;
  trendCount: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

const MAX_ENTRIES = 50_000;

export class TemporalContinuityEngine {
  private entries: TimelineEntry[] = [];
  private listeners: Array<(entry: TimelineEntry) => void> = [];

  // ---- Record ----

  record(entityType: TimelineEntity, entityId: string, metric: string, value: number, metadata: Record<string, unknown> = {}): TimelineEntry {
    const entry: TimelineEntry = {
      id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entityType,
      entityId,
      metric,
      value,
      metadata,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }
    for (const fn of this.listeners) fn(entry);
    return entry;
  }

  // Convenience recorders
  recordMission(missionId: string, metric: string, value: number, meta: Record<string, unknown> = {}): TimelineEntry {
    return this.record('mission', missionId, metric, value, meta);
  }

  recordAgent(agentId: string, metric: string, value: number, meta: Record<string, unknown> = {}): TimelineEntry {
    return this.record('agent', agentId, metric, value, meta);
  }

  recordTool(toolId: string, metric: string, value: number, meta: Record<string, unknown> = {}): TimelineEntry {
    return this.record('tool', toolId, metric, value, meta);
  }

  recordRunner(runnerId: string, metric: string, value: number, meta: Record<string, unknown> = {}): TimelineEntry {
    return this.record('runner', runnerId, metric, value, meta);
  }

  recordEconomy(metric: string, value: number, meta: Record<string, unknown> = {}): TimelineEntry {
    return this.record('economy', 'global', metric, value, meta);
  }

  recordSafety(metric: string, value: number, meta: Record<string, unknown> = {}): TimelineEntry {
    return this.record('safety', 'global', metric, value, meta);
  }

  // ---- Query ----

  getTimeline(entityType: TimelineEntity, entityId: string, metric?: string): TimelineEntry[] {
    return this.entries.filter(
      (e) => e.entityType === entityType && e.entityId === entityId && (!metric || e.metric === metric),
    );
  }

  getByMetric(metric: string, windowMs?: number): TimelineEntry[] {
    const cutoff = windowMs ? new Date(Date.now() - windowMs).toISOString() : '';
    return this.entries.filter((e) => e.metric === metric && e.timestamp >= cutoff);
  }

  getRecent(limit = 100): TimelineEntry[] {
    return this.entries.slice(-limit);
  }

  // ---- Trend analysis ----

  analyzeTrend(entityType: TimelineEntity, entityId: string, metric: string, windowMs = 3_600_000): TrendAnalysis {
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    const points = this.entries.filter(
      (e) => e.entityType === entityType && e.entityId === entityId && e.metric === metric && e.timestamp >= cutoff,
    );

    if (points.length < 2) {
      return {
        entityType, entityId, metric,
        direction: 'stable',
        slope: 0,
        confidence: 0,
        dataPoints: points.length,
        windowMs,
        predictedNextValue: points.length > 0 ? (points.at(-1)?.value ?? 0) : 0,
        anomalyDetected: false,
      };
    }

    // Simple linear regression
    const n = points.length;
    const xs = points.map((_, i) => i);
    const ys = points.map((p) => p.value);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const sumX2 = xs.reduce((s, x) => s + x * x, 0);

    const denom = n * sumX2 - sumX * sumX;
    const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const predictedNext = intercept + slope * n;

    // R² for confidence
    const meanY = sumY / n;
    const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
    const ssRes = ys.reduce((s, y, i) => s + (y - (intercept + slope * xs[i])) ** 2, 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    // Anomaly: if last value deviates >2 std from mean
    const std = Math.sqrt(ys.reduce((s, y) => s + (y - meanY) ** 2, 0) / n);
    const lastVal = ys[n - 1];
    const anomaly = std > 0 && Math.abs(lastVal - meanY) > 2 * std;

    let direction: TrendDirection;
    if (Math.abs(slope) < 0.001) direction = 'stable';
    else if (slope > 0) direction = 'improving';
    else direction = 'degrading';
    if (anomaly) direction = 'volatile';

    return {
      entityType, entityId, metric,
      direction,
      slope: Number(slope.toFixed(6)),
      confidence: Number(Math.max(0, r2).toFixed(3)),
      dataPoints: n,
      windowMs,
      predictedNextValue: Number(predictedNext.toFixed(4)),
      anomalyDetected: anomaly,
    };
  }

  /** Analyze all tracked entity/metric combos within a window. */
  analyzeAllTrends(windowMs = 3_600_000): TrendAnalysis[] {
    const keys = new Set<string>();
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    for (const e of this.entries) {
      if (e.timestamp >= cutoff) keys.add(`${e.entityType}|${e.entityId}|${e.metric}`);
    }
    return [...keys].map((k) => {
      const [entityType, entityId, metric] = k.split('|');
      return this.analyzeTrend(entityType as TimelineEntity, entityId, metric, windowMs);
    });
  }

  // ---- Predictions ----

  predict(entityType: TimelineEntity, entityId: string, metric: string, horizonMs = 300_000): TemporalPrediction {
    const trend = this.analyzeTrend(entityType, entityId, metric);
    const stepsAhead = horizonMs / Math.max(1, trend.windowMs / Math.max(1, trend.dataPoints));
    const predicted = trend.predictedNextValue + trend.slope * stepsAhead;

    return {
      entityType, entityId, metric,
      predictedValue: Number(predicted.toFixed(4)),
      confidence: trend.confidence * (trend.anomalyDetected ? 0.5 : 1),
      horizonMs,
      basis: `Linear trend over ${trend.dataPoints} points, slope=${trend.slope}, direction=${trend.direction}`,
    };
  }

  /** Flag entities whose predicted trajectory crosses a danger threshold. */
  predictiveAlerts(thresholds: Record<string, { max?: number; min?: number }>): TemporalPrediction[] {
    const alerts: TemporalPrediction[] = [];
    const trends = this.analyzeAllTrends();

    for (const trend of trends) {
      const th = thresholds[trend.metric];
      if (!th) continue;
      const pred = this.predict(trend.entityType, trend.entityId, trend.metric);
      if (th.max !== undefined && pred.predictedValue > th.max) alerts.push(pred);
      if (th.min !== undefined && pred.predictedValue < th.min) alerts.push(pred);
    }

    return alerts;
  }

  // ---- Snapshot ----

  getSnapshot(): TemporalSnapshot {
    const counts: Record<TimelineEntity, number> = { mission: 0, agent: 0, tool: 0, runner: 0, economy: 0, safety: 0 };
    for (const e of this.entries) counts[e.entityType] = (counts[e.entityType] ?? 0) + 1;

    return {
      totalEntries: this.entries.length,
      entityCounts: counts,
      trendCount: this.analyzeAllTrends().length,
      oldestEntry: this.entries.length > 0 ? this.entries[0].timestamp : null,
      newestEntry: this.entries.length > 0 ? (this.entries.at(-1)?.timestamp ?? null) : null,
    };
  }

  // ---- Events ----

  on(listener: (entry: TimelineEntry) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }
}
