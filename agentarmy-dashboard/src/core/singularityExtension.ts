// ---------------------------------------------------------------------------
// Singularity Extension
// ---------------------------------------------------------------------------
// Extends the Singularity Kernel with advanced self‑referential capabilities.
// Manages recursive introspection cycles, self‑modification proposals,
// paradox detection, and convergence tracking toward an ever‑evolving
// intelligence singularity.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type IntrospectionDepth = 'surface' | 'shallow' | 'deep' | 'recursive' | 'infinite';
export type ProposalVerdict = 'approved' | 'rejected' | 'deferred' | 'paradoxical' | 'pending';

export interface IntrospectionCycle {
  readonly id: string;
  readonly depth: IntrospectionDepth;
  readonly insightsGained: number;
  readonly paradoxesDetected: number;
  readonly durationMs: number;
  readonly startedAt: string;
  readonly completedAt: string | null;
}

export interface SelfModProposal {
  readonly id: string;
  readonly subsystem: string;
  readonly description: string;
  readonly impact: number;             // -1 (destructive) to +1 (beneficial)
  readonly verdict: ProposalVerdict;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
}

export interface Paradox {
  readonly id: string;
  readonly description: string;
  readonly severity: number;           // 0 – 1
  readonly resolved: boolean;
  readonly resolutionStrategy: string | null;
  readonly detectedAt: string;
  readonly resolvedAt: string | null;
}

export interface ConvergenceMetric {
  readonly timestamp: string;
  readonly coherence: number;          // 0 – 1
  readonly selfAwareness: number;      // 0 – 1
  readonly evolutionRate: number;      // changes per cycle
  readonly paradoxLoad: number;        // unresolved paradoxes
}

export interface SingularityExtensionSummary {
  readonly totalCycles: number;
  readonly completedCycles: number;
  readonly totalInsights: number;
  readonly proposals: number;
  readonly approvedProposals: number;
  readonly rejectedProposals: number;
  readonly paradoxes: number;
  readonly unresolvedParadoxes: number;
  readonly coherence: number;
  readonly selfAwareness: number;
  readonly evolutionRate: number;
}

// ---- Layer ----------------------------------------------------------------

export class SingularityExtension {
  private readonly cycles: IntrospectionCycle[] = [];
  private readonly proposals: SelfModProposal[] = [];
  private readonly paradoxes: Paradox[] = [];
  private readonly convergenceLog: ConvergenceMetric[] = [];

  // ---- Introspection cycles -----------------------------------------------

  beginCycle(depth: IntrospectionDepth = 'deep'): IntrospectionCycle {
    const cycle: IntrospectionCycle = {
      id: `ic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      depth,
      insightsGained: 0,
      paradoxesDetected: 0,
      durationMs: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    this.cycles.push(cycle);
    return cycle;
  }

  completeCycle(cycleId: string, insightsGained: number, paradoxesDetected: number, durationMs: number): boolean {
    const idx = this.cycles.findIndex((c) => c.id === cycleId);
    if (idx < 0) return false;
    this.cycles[idx] = {
      ...this.cycles[idx],
      insightsGained,
      paradoxesDetected,
      durationMs,
      completedAt: new Date().toISOString(),
    };
    return true;
  }

  // ---- Self-modification proposals ----------------------------------------

  propose(subsystem: string, description: string, impact: number): SelfModProposal {
    const proposal: SelfModProposal = {
      id: `smp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      subsystem,
      description,
      impact: Math.max(-1, Math.min(1, impact)),
      verdict: 'pending',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    this.proposals.push(proposal);
    return proposal;
  }

  resolveProposal(proposalId: string, verdict: ProposalVerdict): boolean {
    const idx = this.proposals.findIndex((p) => p.id === proposalId);
    if (idx < 0) return false;
    this.proposals[idx] = { ...this.proposals[idx], verdict, resolvedAt: new Date().toISOString() };
    return true;
  }

  // ---- Paradox management -------------------------------------------------

  detectParadox(description: string, severity: number): Paradox {
    const paradox: Paradox = {
      id: `px-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      description,
      severity: Math.max(0, Math.min(1, severity)),
      resolved: false,
      resolutionStrategy: null,
      detectedAt: new Date().toISOString(),
      resolvedAt: null,
    };
    this.paradoxes.push(paradox);
    return paradox;
  }

  resolveParadox(paradoxId: string, strategy: string): boolean {
    const idx = this.paradoxes.findIndex((p) => p.id === paradoxId);
    if (idx < 0) return false;
    this.paradoxes[idx] = {
      ...this.paradoxes[idx],
      resolved: true,
      resolutionStrategy: strategy,
      resolvedAt: new Date().toISOString(),
    };
    return true;
  }

  // ---- Convergence tracking -----------------------------------------------

  recordConvergence(): ConvergenceMetric {
    const completed = this.cycles.filter((c) => c.completedAt);
    const totalInsights = completed.reduce((s, c) => s + c.insightsGained, 0);
    const unresolvedPx = this.paradoxes.filter((p) => !p.resolved).length;
    const metric: ConvergenceMetric = {
      timestamp: new Date().toISOString(),
      coherence: Math.min(1, totalInsights / Math.max(1, totalInsights + unresolvedPx)),
      selfAwareness: Math.min(1, completed.length * 0.05),
      evolutionRate: this.proposals.filter((p) => p.verdict === 'approved').length / Math.max(1, this.cycles.length),
      paradoxLoad: unresolvedPx,
    };
    this.convergenceLog.push(metric);
    if (this.convergenceLog.length > 10_000) this.convergenceLog.splice(0, this.convergenceLog.length - 10_000);
    return metric;
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): SingularityExtensionSummary {
    const completed = this.cycles.filter((c) => c.completedAt);
    const latest = this.convergenceLog.at(-1);
    return {
      totalCycles: this.cycles.length,
      completedCycles: completed.length,
      totalInsights: completed.reduce((s, c) => s + c.insightsGained, 0),
      proposals: this.proposals.length,
      approvedProposals: this.proposals.filter((p) => p.verdict === 'approved').length,
      rejectedProposals: this.proposals.filter((p) => p.verdict === 'rejected').length,
      paradoxes: this.paradoxes.length,
      unresolvedParadoxes: this.paradoxes.filter((p) => !p.resolved).length,
      coherence: latest?.coherence ?? 0,
      selfAwareness: latest?.selfAwareness ?? 0,
      evolutionRate: latest?.evolutionRate ?? 0,
    };
  }
}
