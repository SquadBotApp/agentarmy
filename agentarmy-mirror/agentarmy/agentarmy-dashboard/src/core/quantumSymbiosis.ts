// ---------------------------------------------------------------------------
// Quantum Symbiosis Layer
// ---------------------------------------------------------------------------
// Manages the symbiotic co‑evolution of quantum and classical processing
// pipelines.  Tracks entanglement pairs, measures coherence across hybrid
// execution, and orchestrates cooperative quantum–classical optimisation
// where each substrate amplifies the other's strengths.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type EntanglementStatus = 'forming' | 'stable' | 'decoherent' | 'collapsed';
export type SymbiosisMode = 'classical-lead' | 'quantum-lead' | 'balanced' | 'adaptive';

export interface EntanglementPair {
  readonly id: string;
  readonly classicalNodeId: string;
  readonly quantumNodeId: string;
  readonly fidelity: number;          // 0 – 1
  readonly status: EntanglementStatus;
  readonly createdAt: string;
  readonly lastMeasuredAt: string;
}

export interface SymbioticCycle {
  readonly id: string;
  readonly missionId: string;
  readonly mode: SymbiosisMode;
  readonly classicalSteps: number;
  readonly quantumSteps: number;
  readonly speedupFactor: number;
  readonly fidelityAvg: number;
  readonly startedAt: string;
  readonly completedAt: string | null;
}

export interface CoherenceMetric {
  readonly timestamp: string;
  readonly globalFidelity: number;     // 0 – 1
  readonly activePairs: number;
  readonly decoherenceRate: number;    // per second
}

export interface QuantumSymbiosisSummary {
  readonly totalPairs: number;
  readonly stablePairs: number;
  readonly decoherentPairs: number;
  readonly activeCycles: number;
  readonly completedCycles: number;
  readonly avgSpeedupFactor: number;
  readonly globalFidelity: number;
  readonly mode: SymbiosisMode;
}

// ---- Layer ----------------------------------------------------------------

export class QuantumSymbiosis {
  private readonly pairs: EntanglementPair[] = [];
  private readonly cycles: SymbioticCycle[] = [];
  private readonly coherenceLog: CoherenceMetric[] = [];
  private mode: SymbiosisMode = 'adaptive';

  // ---- Entanglement -------------------------------------------------------

  createPair(classicalNodeId: string, quantumNodeId: string): EntanglementPair {
    const pair: EntanglementPair = {
      id: `ep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      classicalNodeId,
      quantumNodeId,
      fidelity: 0.95 + Math.random() * 0.05,
      status: 'forming',
      createdAt: new Date().toISOString(),
      lastMeasuredAt: new Date().toISOString(),
    };
    this.pairs.push(pair);
    return pair;
  }

  stabilisePair(pairId: string): boolean {
    const idx = this.pairs.findIndex((p) => p.id === pairId);
    if (idx < 0) return false;
    this.pairs[idx] = { ...this.pairs[idx], status: 'stable', lastMeasuredAt: new Date().toISOString() };
    return true;
  }

  decoherePair(pairId: string): boolean {
    const idx = this.pairs.findIndex((p) => p.id === pairId);
    if (idx < 0) return false;
    this.pairs[idx] = { ...this.pairs[idx], status: 'decoherent', fidelity: 0, lastMeasuredAt: new Date().toISOString() };
    return true;
  }

  measureFidelity(pairId: string, fidelity: number): boolean {
    const idx = this.pairs.findIndex((p) => p.id === pairId);
    if (idx < 0) return false;
    const clamped = Math.max(0, Math.min(1, fidelity));
    let status: EntanglementStatus = 'collapsed';
    if (clamped > 0.5) status = 'stable';
    else if (clamped > 0) status = 'decoherent';
    this.pairs[idx] = { ...this.pairs[idx], fidelity: clamped, status, lastMeasuredAt: new Date().toISOString() };
    return true;
  }

  // ---- Symbiotic cycles ---------------------------------------------------

  startCycle(missionId: string): SymbioticCycle {
    const cycle: SymbioticCycle = {
      id: `sc-${Date.now().toString(36)}`,
      missionId,
      mode: this.mode,
      classicalSteps: 0,
      quantumSteps: 0,
      speedupFactor: 1,
      fidelityAvg: this.computeGlobalFidelity(),
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    this.cycles.push(cycle);
    return cycle;
  }

  completeCycle(cycleId: string, classicalSteps: number, quantumSteps: number, speedup: number): boolean {
    const idx = this.cycles.findIndex((c) => c.id === cycleId);
    if (idx < 0) return false;
    this.cycles[idx] = {
      ...this.cycles[idx],
      classicalSteps,
      quantumSteps,
      speedupFactor: speedup,
      completedAt: new Date().toISOString(),
    };
    return true;
  }

  // ---- Coherence ----------------------------------------------------------

  recordCoherence(): CoherenceMetric {
    const metric: CoherenceMetric = {
      timestamp: new Date().toISOString(),
      globalFidelity: this.computeGlobalFidelity(),
      activePairs: this.pairs.filter((p) => p.status === 'stable').length,
      decoherenceRate: this.pairs.filter((p) => p.status === 'decoherent').length / Math.max(1, this.pairs.length),
    };
    this.coherenceLog.push(metric);
    if (this.coherenceLog.length > 10_000) this.coherenceLog.splice(0, this.coherenceLog.length - 10_000);
    return metric;
  }

  // ---- Mode ---------------------------------------------------------------

  setMode(mode: SymbiosisMode): void { this.mode = mode; }
  getMode(): SymbiosisMode { return this.mode; }

  // ---- Internals ----------------------------------------------------------

  private computeGlobalFidelity(): number {
    const stable = this.pairs.filter((p) => p.status === 'stable' || p.status === 'forming');
    if (stable.length === 0) return 0;
    return Number((stable.reduce((s, p) => s + p.fidelity, 0) / stable.length).toFixed(3));
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): QuantumSymbiosisSummary {
    const completed = this.cycles.filter((c) => c.completedAt);
    const avgSpeedup = completed.length > 0
      ? completed.reduce((s, c) => s + c.speedupFactor, 0) / completed.length
      : 1;
    return {
      totalPairs: this.pairs.length,
      stablePairs: this.pairs.filter((p) => p.status === 'stable').length,
      decoherentPairs: this.pairs.filter((p) => p.status === 'decoherent' || p.status === 'collapsed').length,
      activeCycles: this.cycles.filter((c) => !c.completedAt).length,
      completedCycles: completed.length,
      avgSpeedupFactor: Number(avgSpeedup.toFixed(2)),
      globalFidelity: this.computeGlobalFidelity(),
      mode: this.mode,
    };
  }
}
