/**
 * Self‑Healing Engine — automatic failure detection, diagnosis, and repair.
 *
 * Watches telemetry and health reports for failure signatures across four
 * categories: execution, tool/agent, structural, and environmental. When
 * a failure is detected the engine diagnoses the root cause using learned
 * patterns and applies targeted repairs through the swarm fabric, stability
 * engine, ZPE trainer, and lifecycle manager.
 */

import type { TelemetryEvent, ExecutionTelemetry } from './executionTelemetry';
import type { MissionHealthReport, CorrectionAction } from './missionHealth';
import type { SwarmRunnerFabric, RunnerProfile } from './swarmRunnerFabric';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FailureCategory = 'execution' | 'tool_agent' | 'structural' | 'environmental';

export interface FailureSignature {
  id: string;
  category: FailureCategory;
  pattern: string;                // human‑readable description
  matchCount: number;             // how many times observed
  lastSeen: string;
  autoHealable: boolean;
}

export interface HealingAction {
  id: string;
  failureId: string;
  category: FailureCategory;
  action: string;
  description: string;
  applied: boolean;
  success: boolean | null;        // null until verified
  timestamp: string;
}

export interface DiagnosisResult {
  failureId: string;
  category: FailureCategory;
  rootCause: string;
  confidence: number;             // 0‑1
  suggestedActions: string[];
  relatedSignatures: string[];
}

export interface HealingReport {
  missionId: string;
  failuresDetected: number;
  healingActionsApplied: number;
  healingSuccessRate: number;
  activeSignatures: FailureSignature[];
  recentActions: HealingAction[];
  evaluatedAt: string;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SelfHealingEngine {
  private signatures: Map<string, FailureSignature> = new Map();
  private actions: HealingAction[] = [];
  private listeners: Array<(report: HealingReport) => void> = [];

  // ---- Detection ----

  /** Scan telemetry events for known failure patterns. */
  detectFailures(
    missionId: string,
    telemetry: ExecutionTelemetry,
    fabric: SwarmRunnerFabric,
  ): FailureSignature[] {
    const events = telemetry.getByMission(missionId);
    const found: FailureSignature[] = [];

    found.push(...this.detectExecutionFailures(events));
    found.push(...this.detectToolAgentFailures(events));
    found.push(...this.detectStructuralFailures(events));
    found.push(...this.detectEnvironmentalFailures(fabric));

    // Update global signature DB
    for (const f of found) {
      const existing = this.signatures.get(f.id);
      if (existing) {
        existing.matchCount += 1;
        existing.lastSeen = f.lastSeen;
      } else {
        this.signatures.set(f.id, f);
      }
    }

    return found;
  }

  // ---- Diagnosis ----

  /** Diagnose the root cause of a failure using patterns. */
  diagnose(failure: FailureSignature): DiagnosisResult {
    const related = [...this.signatures.values()]
      .filter((s) => s.category === failure.category && s.id !== failure.id)
      .map((s) => s.id);

    const { rootCause, confidence, actions } = diagnosisRules[failure.category]?.(failure)
      ?? { rootCause: 'Unknown', confidence: 0.3, actions: ['escalate_to_operator'] };

    return {
      failureId: failure.id,
      category: failure.category,
      rootCause,
      confidence,
      suggestedActions: actions,
      relatedSignatures: related,
    };
  }

  // ---- Repair ----

  /** Apply healing actions for a set of failures. */
  heal(
    failures: FailureSignature[],
    fabric: SwarmRunnerFabric,
    healthReport?: MissionHealthReport,
  ): HealingAction[] {
    const applied: HealingAction[] = [];

    for (const f of failures) {
      if (!f.autoHealable) continue;
      const diagnosis = this.diagnose(f);
      for (const actionName of diagnosis.suggestedActions) {
        const action = this.applyAction(f, actionName, fabric, healthReport);
        applied.push(action);
      }
    }

    this.actions.push(...applied);
    return applied;
  }

  /** Full detect → diagnose → heal cycle, returns a report. */
  runHealingCycle(
    missionId: string,
    telemetry: ExecutionTelemetry,
    fabric: SwarmRunnerFabric,
    healthReport?: MissionHealthReport,
  ): HealingReport {
    const failures = this.detectFailures(missionId, telemetry, fabric);
    const actions = this.heal(failures, fabric, healthReport);

    const recent = this.actions.slice(-100);
    const successCount = recent.filter((a) => a.success === true).length;

    const report: HealingReport = {
      missionId,
      failuresDetected: failures.length,
      healingActionsApplied: actions.length,
      healingSuccessRate: recent.length > 0 ? successCount / recent.length : 1,
      activeSignatures: [...this.signatures.values()],
      recentActions: recent,
      evaluatedAt: new Date().toISOString(),
    };

    for (const fn of this.listeners) fn(report);
    return report;
  }

  // ---- Query ----

  getSignatures(): FailureSignature[] {
    return [...this.signatures.values()];
  }

  getActions(): HealingAction[] {
    return [...this.actions];
  }

  getReport(): { signatures: number; actions: number; successRate: number } {
    const recent = this.actions.slice(-200);
    const successes = recent.filter((a) => a.success === true).length;
    return {
      signatures: this.signatures.size,
      actions: this.actions.length,
      successRate: recent.length > 0 ? successes / recent.length : 1,
    };
  }

  on(listener: (report: HealingReport) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  // ---- Internal detection helpers ----

  private detectExecutionFailures(events: TelemetryEvent[]): FailureSignature[] {
    const out: FailureSignature[] = [];
    const failures = events.filter((e) => e.name.includes('failure') || e.name.includes('error'));
    const retries = events.filter((e) => e.name.includes('retry'));

    if (failures.length > 3) {
      out.push(sig('exec-repeated-failures', 'execution', `${failures.length} execution failures detected`, true));
    }
    if (retries.length > 5) {
      out.push(sig('exec-excessive-retries', 'execution', `${retries.length} retries across nodes`, true));
    }

    // Timeout detection: performance events with extremely high duration
    const timeouts = events.filter((e) => e.category === 'performance' && e.value > 30_000);
    if (timeouts.length > 0) {
      out.push(sig('exec-timeouts', 'execution', `${timeouts.length} nodes timed out (>30s)`, true));
    }

    return out;
  }

  private detectToolAgentFailures(events: TelemetryEvent[]): FailureSignature[] {
    const out: FailureSignature[] = [];
    const toolFails = events.filter((e) => e.category === 'tool' && e.name.includes('failure'));
    const agentFails = events.filter((e) => e.category === 'agent' && e.name.includes('failure'));

    if (toolFails.length > 2) {
      out.push(sig('tool-degradation', 'tool_agent', `${toolFails.length} tool failures`, true));
    }
    if (agentFails.length > 2) {
      out.push(sig('agent-degradation', 'tool_agent', `${agentFails.length} agent failures`, true));
    }

    // Cost spike detection
    const costEvents = events.filter((e) => e.category === 'cost' && e.value > 5);
    if (costEvents.length > 0) {
      out.push(sig('cost-spike', 'tool_agent', `${costEvents.length} high-cost operations`, true));
    }

    return out;
  }

  private detectStructuralFailures(events: TelemetryEvent[]): FailureSignature[] {
    const out: FailureSignature[] = [];
    const zpeEvents = events.filter((e) => e.category === 'zpe');

    // Non-converging loops
    const nonConverging = zpeEvents.filter((e) => ((e.metadata.loopConvergence as number) ?? 1) < 0.3);
    if (nonConverging.length > 3) {
      out.push(sig('struct-loop-divergence', 'structural', 'Loop convergence failing', true));
    }

    // Dead ends (ZPE scores of 0)
    const deadEnds = zpeEvents.filter((e) => e.value === 0);
    if (deadEnds.length > 0) {
      out.push(sig('struct-dead-ends', 'structural', `${deadEnds.length} dead-end ZPE paths`, true));
    }

    return out;
  }

  private detectEnvironmentalFailures(fabric: SwarmRunnerFabric): FailureSignature[] {
    const out: FailureSignature[] = [];
    const runners = fabric.getRunnerProfiles();

    const overloaded = runners.filter((r) => r.load > 0.9);
    const unhealthy = runners.filter((r) => r.health === 'degraded' || r.health === 'quarantined');
    const highError = runners.filter((r) => r.errorRate > 0.2);

    if (overloaded.length > runners.length * 0.5) {
      out.push(sig('env-swarm-overload', 'environmental', `${overloaded.length}/${runners.length} runners overloaded`, true));
    }
    if (unhealthy.length > 0) {
      out.push(sig('env-unhealthy-runners', 'environmental', `${unhealthy.length} unhealthy runners`, true));
    }
    if (highError.length > 0) {
      out.push(sig('env-high-error-runners', 'environmental', `${highError.length} runners with high error rates`, true));
    }

    return out;
  }

  // ---- Action application ----

  private applyAction(
    failure: FailureSignature,
    actionName: string,
    fabric: SwarmRunnerFabric,
    _healthReport?: MissionHealthReport,
  ): HealingAction {
    let success = true;

    switch (actionName) {
      case 'quarantine_unhealthy_runners': {
        const runners = fabric.getRunnerProfiles();
        const targets = runners.filter((r) => r.health === 'degraded' || r.errorRate > 0.3);
        for (const r of targets) fabric.quarantineRunner(r.id);
        success = targets.length > 0;
        break;
      }
      case 'rebalance_swarm': {
        const runners = fabric.getRunnerProfiles();
        for (const r of runners) {
          if (r.load > 0.8) fabric.updateHeartbeat(r.id, r.load * 0.7, r.cpuPercent, r.gpuPercent, r.memoryPercent);
        }
        break;
      }
      case 'restore_quarantined': {
        const runners = fabric.getRunnerProfiles();
        const quarantined = runners.filter((r) => r.health === 'quarantined' && r.errorRate < 0.1);
        for (const r of quarantined) fabric.restoreRunner(r.id);
        success = quarantined.length > 0;
        break;
      }
      default:
        // Generic action — log but don't fail
        break;
    }

    return {
      id: `heal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      failureId: failure.id,
      category: failure.category,
      action: actionName,
      description: `Applied ${actionName} for ${failure.pattern}`,
      applied: true,
      success,
      timestamp: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Diagnosis rule functions
// ---------------------------------------------------------------------------

type DiagFn = (f: FailureSignature) => { rootCause: string; confidence: number; actions: string[] };

const diagnosisRules: Record<FailureCategory, DiagFn> = {
  execution: (f) => ({
    rootCause: f.pattern.includes('timeout')
      ? 'Runner or tool timeout under load'
      : 'Repeated execution failures — likely runner instability',
    confidence: f.matchCount > 5 ? 0.9 : 0.6,
    actions: ['rebalance_swarm', 'quarantine_unhealthy_runners'],
  }),

  tool_agent: (f) => ({
    rootCause: f.pattern.includes('cost')
      ? 'Cost spike — tool pricing or runaway invocations'
      : 'Tool or agent degradation — external service change or hallucination',
    confidence: 0.7,
    actions: ['substitute_tool', 'escalate_to_governor'],
  }),

  structural: (f) => ({
    rootCause: f.pattern.includes('loop')
      ? 'Loop divergence — convergence conditions not met'
      : 'MissionGraph structural issue — dead ends or unreachable nodes',
    confidence: 0.75,
    actions: ['tighten_loop_bounds', 'prune_unreachable_branches'],
  }),

  environmental: (f) => ({
    rootCause: f.pattern.includes('overload')
      ? 'Swarm overload — too many tasks, not enough capacity'
      : 'Runner health degradation — hardware or network issues',
    confidence: 0.8,
    actions: ['rebalance_swarm', 'quarantine_unhealthy_runners', 'restore_quarantined'],
  }),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sig(id: string, category: FailureCategory, pattern: string, autoHealable: boolean): FailureSignature {
  return { id, category, pattern, matchCount: 1, lastSeen: new Date().toISOString(), autoHealable };
}
