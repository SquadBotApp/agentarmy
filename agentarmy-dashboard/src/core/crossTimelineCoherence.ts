// ---------------------------------------------------------------------------
// Cross‑Timeline Coherence Layer  (Layer 37)
// ---------------------------------------------------------------------------
// Ensures that decisions made in one temporal branch remain consistent with
// decisions in others.  Prevents contradictions, paradoxes, and drift across
// long-horizon missions by maintaining invariants and reconciling knowledge.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type InvariantCategory = 'constitutional' | 'safety' | 'economic' | 'identity' | 'mission' | 'knowledge';
export type ReconciliationStatus = 'pending' | 'resolved' | 'conflict' | 'deferred';

export interface TimelineInvariant {
  readonly id: string;
  readonly category: InvariantCategory;
  readonly description: string;
  readonly expression: string;          // human‑readable rule
  readonly active: boolean;
  readonly violations: number;
  readonly lastCheckedAt: string | null;
}

export interface TimelineDivergence {
  readonly id: string;
  readonly branchA: string;
  readonly branchB: string;
  readonly field: string;
  readonly valueA: string;
  readonly valueB: string;
  readonly detectedAt: string;
  readonly severity: number;            // 0 – 1
  readonly reconciliationStatus: ReconciliationStatus;
  readonly resolvedAt: string | null;
}

export interface KnowledgeReconciliation {
  readonly id: string;
  readonly divergenceId: string;
  readonly strategy: 'accept-a' | 'accept-b' | 'merge' | 'discard' | 'manual';
  readonly appliedAt: string;
  readonly success: boolean;
}

export interface CrossTimelineSummary {
  readonly totalInvariants: number;
  readonly activeInvariants: number;
  readonly totalViolations: number;
  readonly divergences: number;
  readonly pendingDivergences: number;
  readonly resolvedDivergences: number;
  readonly reconciliations: number;
  readonly successfulReconciliations: number;
  readonly coherenceScore: number;     // 0 – 1
}

// ---- Layer ----------------------------------------------------------------

export class CrossTimelineCoherence {
  private readonly invariants: TimelineInvariant[] = [];
  private readonly divergences: TimelineDivergence[] = [];
  private readonly reconciliations: KnowledgeReconciliation[] = [];

  constructor() {
    // Default invariants
    const defaults: Array<[InvariantCategory, string, string]> = [
      ['constitutional', 'Core safety rules must hold across all timelines', 'safety.posture >= minimum'],
      ['identity', 'Agent identity must be consistent across versions', 'agent.id == agent.origin_id'],
      ['economic', 'Token supply invariant across timelines', 'economy.supply == economy.minted - economy.burned'],
      ['mission', 'Completed missions cannot revert to running', 'mission.status != regress(completed, running)'],
    ];
    for (const [cat, desc, expr] of defaults) {
      this.invariants.push({
        id: `inv-${cat}-${this.invariants.length}`,
        category: cat,
        description: desc,
        expression: expr,
        active: true,
        violations: 0,
        lastCheckedAt: null,
      });
    }
  }

  // ---- Invariant management -----------------------------------------------

  addInvariant(category: InvariantCategory, description: string, expression: string): TimelineInvariant {
    const inv: TimelineInvariant = {
      id: `inv-${Date.now().toString(36)}`,
      category,
      description,
      expression,
      active: true,
      violations: 0,
      lastCheckedAt: null,
    };
    this.invariants.push(inv);
    return inv;
  }

  checkInvariant(invariantId: string, holds: boolean): boolean {
    const idx = this.invariants.findIndex((i) => i.id === invariantId);
    if (idx < 0) return false;
    const inv = this.invariants[idx];
    this.invariants[idx] = {
      ...inv,
      violations: holds ? inv.violations : inv.violations + 1,
      lastCheckedAt: new Date().toISOString(),
    };
    return holds;
  }

  // ---- Divergence detection -----------------------------------------------

  reportDivergence(branchA: string, branchB: string, field: string, valueA: string, valueB: string, severity: number): TimelineDivergence {
    const div: TimelineDivergence = {
      id: `div-${Date.now().toString(36)}`,
      branchA,
      branchB,
      field,
      valueA,
      valueB,
      detectedAt: new Date().toISOString(),
      severity: Math.max(0, Math.min(1, severity)),
      reconciliationStatus: 'pending',
      resolvedAt: null,
    };
    this.divergences.push(div);
    return div;
  }

  // ---- Reconciliation -----------------------------------------------------

  reconcile(divergenceId: string, strategy: KnowledgeReconciliation['strategy']): KnowledgeReconciliation | null {
    const dIdx = this.divergences.findIndex((d) => d.id === divergenceId);
    if (dIdx < 0) return null;

    const success = strategy !== 'discard';  // simplified heuristic
    this.divergences[dIdx] = {
      ...this.divergences[dIdx],
      reconciliationStatus: success ? 'resolved' : 'conflict',
      resolvedAt: success ? new Date().toISOString() : null,
    };

    const rec: KnowledgeReconciliation = {
      id: `rec-${Date.now().toString(36)}`,
      divergenceId,
      strategy,
      appliedAt: new Date().toISOString(),
      success,
    };
    this.reconciliations.push(rec);
    return rec;
  }

  // ---- Query --------------------------------------------------------------

  getInvariants(): readonly TimelineInvariant[] { return this.invariants; }
  getDivergences(status?: ReconciliationStatus): TimelineDivergence[] {
    return status ? this.divergences.filter((d) => d.reconciliationStatus === status) : [...this.divergences];
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): CrossTimelineSummary {
    const totalViolations = this.invariants.reduce((s, i) => s + i.violations, 0);
    const resolved = this.divergences.filter((d) => d.reconciliationStatus === 'resolved').length;
    const pending = this.divergences.filter((d) => d.reconciliationStatus === 'pending').length;
    const successfulRecs = this.reconciliations.filter((r) => r.success).length;

    // Coherence: 1.0 minus penalty for violations and pending divergences
    const violationPenalty = Math.min(0.5, totalViolations * 0.02);
    const divergencePenalty = Math.min(0.5, pending * 0.05);
    const coherence = Math.max(0, 1 - violationPenalty - divergencePenalty);

    return {
      totalInvariants: this.invariants.length,
      activeInvariants: this.invariants.filter((i) => i.active).length,
      totalViolations,
      divergences: this.divergences.length,
      pendingDivergences: pending,
      resolvedDivergences: resolved,
      reconciliations: this.reconciliations.length,
      successfulReconciliations: successfulRecs,
      coherenceScore: Number(coherence.toFixed(3)),
    };
  }
}
