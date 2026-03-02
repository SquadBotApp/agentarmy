// ---------------------------------------------------------------------------
// Meta‑Continuum Intelligence Layer  (Layer 36)
// ---------------------------------------------------------------------------
// Reasons across multiple possible futures, timelines, and evolutionary
// trajectories.  Treats the OS as a branching multiverse of potential
// states and selects optimal futures based on alignment and stability.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type TimelineBranchStatus = 'exploring' | 'converged' | 'pruned' | 'merged';

export interface TimelineBranch {
  readonly id: string;
  readonly label: string;
  readonly parentId: string | null;
  readonly createdAt: string;
  readonly status: TimelineBranchStatus;
  readonly depth: number;
  readonly alignmentScore: number;        // 0 – 1
  readonly stabilityScore: number;        // 0 – 1
  readonly projectedOutcome: string;
}

export interface FutureScenario {
  readonly id: string;
  readonly branchId: string;
  readonly title: string;
  readonly horizonYears: number;
  readonly probability: number;           // 0 – 1
  readonly desirability: number;          // 0 – 1
  readonly risks: readonly string[];
  readonly opportunities: readonly string[];
  readonly evaluatedAt: string;
}

export interface ConvergenceRisk {
  readonly id: string;
  readonly description: string;
  readonly affectedBranches: readonly string[];
  readonly severity: number;              // 0 – 1
  readonly detectedAt: string;
  readonly mitigated: boolean;
}

export interface MetaContinuumSummary {
  readonly totalBranches: number;
  readonly exploringBranches: number;
  readonly convergedBranches: number;
  readonly prunedBranches: number;
  readonly scenarios: number;
  readonly avgAlignmentScore: number;
  readonly avgStabilityScore: number;
  readonly convergenceRisks: number;
  readonly unmitigatedRisks: number;
}

// ---- Layer ----------------------------------------------------------------

export class MetaContinuumIntelligence {
  private readonly branches: TimelineBranch[] = [];
  private readonly scenarios: FutureScenario[] = [];
  private readonly risks: ConvergenceRisk[] = [];

  constructor() {
    // Seed the root timeline
    this.branches.push({
      id: 'tl-root',
      label: 'Prime Timeline',
      parentId: null,
      createdAt: new Date().toISOString(),
      status: 'exploring',
      depth: 0,
      alignmentScore: 1.0,
      stabilityScore: 1.0,
      projectedOutcome: 'Baseline trajectory',
    });
  }

  // ---- Branch management --------------------------------------------------

  forkBranch(parentId: string, label: string, projectedOutcome: string): TimelineBranch | null {
    const parent = this.branches.find((b) => b.id === parentId);
    if (!parent) return null;
    const branch: TimelineBranch = {
      id: `tl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      parentId,
      createdAt: new Date().toISOString(),
      status: 'exploring',
      depth: parent.depth + 1,
      alignmentScore: parent.alignmentScore,
      stabilityScore: parent.stabilityScore,
      projectedOutcome,
    };
    this.branches.push(branch);
    return branch;
  }

  updateBranchScores(branchId: string, alignment: number, stability: number): boolean {
    const idx = this.branches.findIndex((b) => b.id === branchId);
    if (idx < 0) return false;
    this.branches[idx] = {
      ...this.branches[idx],
      alignmentScore: Math.max(0, Math.min(1, alignment)),
      stabilityScore: Math.max(0, Math.min(1, stability)),
    };
    return true;
  }

  pruneBranch(branchId: string): boolean {
    const idx = this.branches.findIndex((b) => b.id === branchId);
    if (idx < 0 || this.branches[idx].status === 'pruned') return false;
    this.branches[idx] = { ...this.branches[idx], status: 'pruned' };
    return true;
  }

  convergeBranch(branchId: string): boolean {
    const idx = this.branches.findIndex((b) => b.id === branchId);
    if (idx < 0) return false;
    this.branches[idx] = { ...this.branches[idx], status: 'converged' };
    return true;
  }

  // ---- Scenario evaluation ------------------------------------------------

  evaluateScenario(branchId: string, title: string, horizonYears: number, probability: number, desirability: number, risks: string[], opportunities: string[]): FutureScenario {
    const scenario: FutureScenario = {
      id: `fs-${Date.now().toString(36)}`,
      branchId,
      title,
      horizonYears,
      probability: Math.max(0, Math.min(1, probability)),
      desirability: Math.max(0, Math.min(1, desirability)),
      risks,
      opportunities,
      evaluatedAt: new Date().toISOString(),
    };
    this.scenarios.push(scenario);
    return scenario;
  }

  // ---- Convergence risk ---------------------------------------------------

  reportRisk(description: string, affectedBranches: string[], severity: number): ConvergenceRisk {
    const risk: ConvergenceRisk = {
      id: `crisk-${Date.now().toString(36)}`,
      description,
      affectedBranches,
      severity: Math.max(0, Math.min(1, severity)),
      detectedAt: new Date().toISOString(),
      mitigated: false,
    };
    this.risks.push(risk);
    return risk;
  }

  mitigateRisk(riskId: string): boolean {
    const idx = this.risks.findIndex((r) => r.id === riskId);
    if (idx < 0) return false;
    this.risks[idx] = { ...this.risks[idx], mitigated: true };
    return true;
  }

  // ---- Query --------------------------------------------------------------

  getBranches(status?: TimelineBranchStatus): TimelineBranch[] {
    return status ? this.branches.filter((b) => b.status === status) : [...this.branches];
  }

  getBestBranch(): TimelineBranch | null {
    const exploring = this.branches.filter((b) => b.status === 'exploring' || b.status === 'converged');
    if (exploring.length === 0) return null;
    return exploring.reduce((best, b) => (b.alignmentScore + b.stabilityScore) > (best.alignmentScore + best.stabilityScore) ? b : best);
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): MetaContinuumSummary {
    const exploring = this.branches.filter((b) => b.status === 'exploring');
    const converged = this.branches.filter((b) => b.status === 'converged');
    const pruned = this.branches.filter((b) => b.status === 'pruned');
    const active = this.branches.filter((b) => b.status !== 'pruned');
    const avgAlignment = active.length > 0 ? active.reduce((s, b) => s + b.alignmentScore, 0) / active.length : 0;
    const avgStability = active.length > 0 ? active.reduce((s, b) => s + b.stabilityScore, 0) / active.length : 0;
    return {
      totalBranches: this.branches.length,
      exploringBranches: exploring.length,
      convergedBranches: converged.length,
      prunedBranches: pruned.length,
      scenarios: this.scenarios.length,
      avgAlignmentScore: Number(avgAlignment.toFixed(3)),
      avgStabilityScore: Number(avgStability.toFixed(3)),
      convergenceRisks: this.risks.length,
      unmitigatedRisks: this.risks.filter((r) => !r.mitigated).length,
    };
  }
}
