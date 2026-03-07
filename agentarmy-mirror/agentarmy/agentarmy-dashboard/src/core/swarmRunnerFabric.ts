/**
 * Swarm Runner Fabric — distributed execution layer for AgentArmy.
 *
 * Runners execute tool calls, agent calls, logic nodes, event triggers,
 * economy nodes, and governance checks. The orchestrator assigns work to
 * runners based on specialization, cost, latency, safety, and mission context.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RunnerKind = 'local' | 'cloud' | 'edge' | 'gpu' | 'cpu' | 'safety' | 'economy' | 'governance';

export type RunnerHealth = 'healthy' | 'degraded' | 'quarantined' | 'offline';

export type ExecutionNodeKind =
  | 'tool_call'
  | 'agent_call'
  | 'logic'
  | 'event_trigger'
  | 'economy'
  | 'governance';

export interface RunnerProfile {
  id: string;
  kind: RunnerKind;
  region: string;
  specializations: string[];
  health: RunnerHealth;
  load: number;             // 0‑1 current utilisation
  maxConcurrent: number;
  latencyAvgMs: number;
  costPerCall: number;
  safetyCleared: boolean;
  cpuPercent: number;
  gpuPercent: number;
  memoryPercent: number;
  errorRate: number;        // 0‑1 rolling
  executedCount: number;
  lastHeartbeat: string;    // ISO timestamp
}

export interface ExecutionTask {
  id: string;
  missionId: string;
  nodeKind: ExecutionNodeKind;
  payload: Record<string, unknown>;
  priority: number;         // 0‑10
  safetyRequired: boolean;
  governanceRequired: boolean;
  budgetQb: number;
  constraints: RunnerConstraints;
}

export interface RunnerConstraints {
  maxLatencyMs?: number;
  maxCost?: number;
  requiredKinds?: RunnerKind[];
  requiredSpecializations?: string[];
  preferRegion?: string;
}

export interface ExecutionResult {
  taskId: string;
  runnerId: string;
  success: boolean;
  output: unknown;
  latencyMs: number;
  costQb: number;
  safetyFlags: string[];
  retries: number;
  error?: string;
  timestamp: string;
}

export interface FabricMetrics {
  totalRunners: number;
  healthyRunners: number;
  quarantinedRunners: number;
  avgLoad: number;
  totalExecuted: number;
  avgLatencyMs: number;
  avgCostQb: number;
  errorRate: number;
}

// ---------------------------------------------------------------------------
// Runner scoring & selection
// ---------------------------------------------------------------------------

/** Check hard constraints — returns true if the runner is disqualified. */
function isRunnerDisqualified(runner: RunnerProfile, task: ExecutionTask): boolean {
  if (runner.health === 'quarantined' || runner.health === 'offline') return true;
  if (runner.load >= 1) return true;
  const c = task.constraints;
  if (c.requiredKinds?.length && !c.requiredKinds.includes(runner.kind)) return true;
  if (c.requiredSpecializations?.length) {
    const hasAll = c.requiredSpecializations.every((s) => runner.specializations.includes(s));
    if (!hasAll) return true;
  }
  if (c.maxLatencyMs && runner.latencyAvgMs > c.maxLatencyMs) return true;
  if (c.maxCost && runner.costPerCall > c.maxCost) return true;
  if (task.safetyRequired && !runner.safetyCleared) return true;
  return false;
}

/**
 * Score a runner for a given task — lower is better.
 *
 * Factors: latency (40%), cost (30%), load (15%), error‑rate (15%).
 * Bonuses for matching specialization and region.
 */
export function scoreRunner(runner: RunnerProfile, task: ExecutionTask): number {
  if (isRunnerDisqualified(runner, task)) return Infinity;

  const c = task.constraints;

  // weighted scoring
  let score = 0;
  score += runner.latencyAvgMs * 0.4;
  score += runner.costPerCall * 1000 * 0.3;
  score += runner.load * 100 * 0.15;
  score += runner.errorRate * 1000 * 0.15;

  // bonuses
  if (c.preferRegion && runner.region === c.preferRegion) score *= 0.85;
  const specOverlap = runner.specializations.filter((s) =>
    (c.requiredSpecializations ?? []).includes(s),
  ).length;
  if (specOverlap > 0) score *= Math.max(0.6, 1 - specOverlap * 0.1);

  return score;
}

/** Pick the best runner from the pool for a given task. */
export function selectRunner(runners: RunnerProfile[], task: ExecutionTask): RunnerProfile | null {
  const scored = runners
    .map((r) => ({ runner: r, score: scoreRunner(r, task) }))
    .filter((s) => Number.isFinite(s.score))
    .sort((a, b) => a.score - b.score);
  return scored.length > 0 ? scored[0].runner : null;
}

// ---------------------------------------------------------------------------
// Fabric class — in‑memory runtime
// ---------------------------------------------------------------------------

export class SwarmRunnerFabric {
  runners: Map<string, RunnerProfile> = new Map();
  results: ExecutionResult[] = [];
  private listeners: Array<(ev: FabricEvent) => void> = [];

  // ---- Runner registry ----

  registerRunner(profile: RunnerProfile): void {
    this.runners.set(profile.id, profile);
    this.emit({ type: 'runner_registered', runnerId: profile.id, ts: now() });
  }

  removeRunner(runnerId: string): void {
    this.runners.delete(runnerId);
    this.emit({ type: 'runner_removed', runnerId, ts: now() });
  }

  quarantineRunner(runnerId: string): void {
    const r = this.runners.get(runnerId);
    if (r) {
      r.health = 'quarantined';
      this.emit({ type: 'runner_quarantined', runnerId, ts: now() });
    }
  }

  restoreRunner(runnerId: string): void {
    const r = this.runners.get(runnerId);
    if (r?.health === 'quarantined') {
      r.health = 'healthy';
      this.emit({ type: 'runner_restored', runnerId, ts: now() });
    }
  }

  updateHeartbeat(runnerId: string, load: number, cpu: number, gpu: number, mem: number): void {
    const r = this.runners.get(runnerId);
    if (!r) return;
    r.load = clamp01(load);
    r.cpuPercent = clamp01(cpu);
    r.gpuPercent = clamp01(gpu);
    r.memoryPercent = clamp01(mem);
    r.lastHeartbeat = now();
    if (r.health === 'quarantined') return;
    r.health = load > 0.95 || cpu > 0.95 ? 'degraded' : 'healthy';
  }

  // ---- Execution ----

  /** Execute a task on the best available runner (simulation). */
  execute(task: ExecutionTask): ExecutionResult {
    const pool = [...this.runners.values()];
    const runner = selectRunner(pool, task);

    if (!runner) {
      const result: ExecutionResult = {
        taskId: task.id,
        runnerId: 'none',
        success: false,
        output: null,
        latencyMs: 0,
        costQb: 0,
        safetyFlags: [],
        retries: 0,
        error: 'No eligible runner available',
        timestamp: now(),
      };
      this.results.push(result);
      this.emit({ type: 'execution_failed', taskId: task.id, runnerId: 'none', ts: now() });
      return result;
    }

    // Simulate execution
    const latency = runner.latencyAvgMs * (0.8 + Math.random() * 0.4);
    const success = Math.random() > runner.errorRate;
    const safetyFlags: string[] = [];
    if (task.safetyRequired && Math.random() < 0.05) safetyFlags.push('content_review_needed');

    // Update runner state
    runner.load = clamp01(runner.load + 1 / runner.maxConcurrent);
    runner.executedCount += 1;

    const result: ExecutionResult = {
      taskId: task.id,
      runnerId: runner.id,
      success,
      output: success ? { status: 'completed' } : null,
      latencyMs: Math.round(latency),
      costQb: runner.costPerCall,
      safetyFlags,
      retries: 0,
      error: success ? undefined : 'Runner execution failed',
      timestamp: now(),
    };

    this.results.push(result);
    this.emit({
      type: success ? 'execution_completed' : 'execution_failed',
      taskId: task.id,
      runnerId: runner.id,
      latencyMs: result.latencyMs,
      ts: now(),
    });

    return result;
  }

  /** Retry an execution on a fallback runner, excluding previous runner. */
  retryOnFallback(task: ExecutionTask, excludeRunnerIds: string[]): ExecutionResult {
    const pool = [...this.runners.values()].filter((r) => !excludeRunnerIds.includes(r.id));
    const runner = selectRunner(pool, task);

    if (!runner) {
      return {
        taskId: task.id,
        runnerId: 'none',
        success: false,
        output: null,
        latencyMs: 0,
        costQb: 0,
        safetyFlags: [],
        retries: excludeRunnerIds.length,
        error: 'No fallback runner available',
        timestamp: now(),
      };
    }

    const result = this.execute({ ...task, constraints: { ...task.constraints, requiredKinds: [runner.kind] } });
    result.retries = excludeRunnerIds.length;
    return result;
  }

  // ---- Metrics ----

  getMetrics(): FabricMetrics {
    const all = [...this.runners.values()];
    const healthy = all.filter((r) => r.health === 'healthy');
    const quarantined = all.filter((r) => r.health === 'quarantined');
    const loads = all.map((r) => r.load);
    const avgLoad = loads.length > 0 ? loads.reduce((a, b) => a + b, 0) / loads.length : 0;

    const recent = this.results.slice(-1000);
    const avgLatency = recent.length > 0
      ? recent.reduce((s, r) => s + r.latencyMs, 0) / recent.length
      : 0;
    const avgCost = recent.length > 0
      ? recent.reduce((s, r) => s + r.costQb, 0) / recent.length
      : 0;
    const errors = recent.filter((r) => !r.success).length;

    return {
      totalRunners: all.length,
      healthyRunners: healthy.length,
      quarantinedRunners: quarantined.length,
      avgLoad,
      totalExecuted: this.results.length,
      avgLatencyMs: Math.round(avgLatency),
      avgCostQb: Number(avgCost.toFixed(4)),
      errorRate: recent.length > 0 ? errors / recent.length : 0,
    };
  }

  getRunnerProfiles(): RunnerProfile[] {
    return [...this.runners.values()];
  }

  // ---- Events ----

  on(listener: (ev: FabricEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(ev: FabricEvent): void {
    for (const fn of this.listeners) fn(ev);
  }
}

// ---------------------------------------------------------------------------
// Fabric event type
// ---------------------------------------------------------------------------

export interface FabricEvent {
  type: string;
  runnerId?: string;
  taskId?: string;
  latencyMs?: number;
  ts: string;
}

// ---------------------------------------------------------------------------
// Default runner profiles (bootstrap)
// ---------------------------------------------------------------------------

export function createDefaultRunners(): RunnerProfile[] {
  return [
    makeRunner('runner-local-1', 'local', 'local', ['file_access', 'privacy'], 12, 0.001, true),
    makeRunner('runner-cloud-1', 'cloud', 'us-east-1', ['heavy_compute', 'large_models'], 85, 0.015, true),
    makeRunner('runner-cloud-2', 'cloud', 'eu-west-1', ['heavy_compute', 'concurrency'], 110, 0.012, true),
    makeRunner('runner-edge-1', 'edge', 'us-west-2', ['realtime', 'low_latency'], 8, 0.008, true),
    makeRunner('runner-gpu-1', 'gpu', 'us-east-1', ['image_gen', 'video_gen', 'ml_inference'], 200, 0.05, true),
    makeRunner('runner-cpu-1', 'cpu', 'us-east-1', ['logic', 'batch', 'data_processing'], 20, 0.003, true),
    makeRunner('runner-safety-1', 'safety', 'us-east-1', ['content_classification', 'redaction'], 15, 0.004, true),
    makeRunner('runner-economy-1', 'economy', 'us-east-1', ['qb_accounting', 'rewards'], 10, 0.002, true),
    makeRunner('runner-governance-1', 'governance', 'us-east-1', ['approval', 'audit', 'escalation'], 25, 0.006, true),
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRunner(
  id: string,
  kind: RunnerKind,
  region: string,
  specs: string[],
  latency: number,
  cost: number,
  safetyCleared: boolean,
): RunnerProfile {
  return {
    id,
    kind,
    region,
    specializations: specs,
    health: 'healthy',
    load: Math.random() * 0.4,
    maxConcurrent: getMaxConcurrent(kind),
    latencyAvgMs: latency,
    costPerCall: cost,
    safetyCleared,
    cpuPercent: Math.random() * 0.3,
    gpuPercent: kind === 'gpu' ? Math.random() * 0.5 : 0,
    memoryPercent: Math.random() * 0.4,
    errorRate: Math.random() * 0.05,
    executedCount: 0,
    lastHeartbeat: now(),
  };
}

function getMaxConcurrent(kind: string): number {
  if (kind === 'gpu') return 4;
  if (kind === 'local') return 2;
  return 8;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function now(): string {
  return new Date().toISOString();
}
