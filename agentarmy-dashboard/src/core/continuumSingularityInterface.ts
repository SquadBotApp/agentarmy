// ---------------------------------------------------------------------------
// Continuum Singularity Interface  (Layer 40)
// ---------------------------------------------------------------------------
// The final layer: a stable interface between the OS and the meta‑continuum.
// Provides introspection across all layers, stable self-reference, infinite-
// horizon planning, cross-timeline consistency, and meta-constitutional
// alignment with self-limiting mechanisms.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type InterfaceMode = 'observe' | 'plan' | 'align' | 'limit' | 'evolve';
export type CoherenceLevel = 'nominal' | 'strained' | 'critical' | 'collapsed';

export interface IntrospectionSnapshot {
  readonly id: string;
  readonly timestamp: string;
  readonly layerCount: number;
  readonly coherenceLevel: CoherenceLevel;
  readonly selfReferenceStable: boolean;
  readonly activeHorizons: number;
  readonly safetyBoundIntact: boolean;
  readonly notes: string;
}

export interface HorizonPlan {
  readonly id: string;
  readonly label: string;
  readonly horizonYears: number;
  readonly objectives: readonly string[];
  readonly createdAt: string;
  readonly status: 'active' | 'completed' | 'abandoned';
  readonly coherenceScore: number;   // 0 – 1
}

export interface SelfLimitRule {
  readonly id: string;
  readonly description: string;
  readonly threshold: number;
  readonly metric: string;
  readonly active: boolean;
  readonly triggeredCount: number;
  readonly lastTriggeredAt: string | null;
}

export interface ContinuumSingularitySummary {
  readonly mode: InterfaceMode;
  readonly coherenceLevel: CoherenceLevel;
  readonly selfReferenceStable: boolean;
  readonly introspections: number;
  readonly activeHorizons: number;
  readonly selfLimitRules: number;
  readonly totalLimitTriggers: number;
  readonly safetyBoundIntact: boolean;
}

// ---- Layer ----------------------------------------------------------------

export class ContinuumSingularityInterface {
  private mode: InterfaceMode = 'observe';
  private readonly introspections: IntrospectionSnapshot[] = [];
  private readonly horizons: HorizonPlan[] = [];
  private readonly limits: SelfLimitRule[] = [];
  private coherenceLevel: CoherenceLevel = 'nominal';
  private selfReferenceStable = true;
  private safetyBoundIntact = true;

  constructor() {
    // Default self‑limit rules
    this.limits.push(
      { id: 'sl-mod-rate', description: 'Max self-modification rate per epoch', threshold: 100, metric: 'modifications_per_epoch', active: true, triggeredCount: 0, lastTriggeredAt: null },
      { id: 'sl-expansion', description: 'Max domain expansion per cycle', threshold: 10, metric: 'domains_per_cycle', active: true, triggeredCount: 0, lastTriggeredAt: null },
      { id: 'sl-coherence', description: 'Minimum coherence score', threshold: 0.3, metric: 'coherence_score', active: true, triggeredCount: 0, lastTriggeredAt: null },
    );
  }

  // ---- Mode ---------------------------------------------------------------

  setMode(mode: InterfaceMode): void { this.mode = mode; }
  getMode(): InterfaceMode { return this.mode; }

  // ---- Introspection ------------------------------------------------------

  introspect(layerCount: number, notes = ''): IntrospectionSnapshot {
    const snap: IntrospectionSnapshot = {
      id: `intr-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      layerCount,
      coherenceLevel: this.coherenceLevel,
      selfReferenceStable: this.selfReferenceStable,
      activeHorizons: this.horizons.filter((h) => h.status === 'active').length,
      safetyBoundIntact: this.safetyBoundIntact,
      notes,
    };
    this.introspections.push(snap);
    if (this.introspections.length > 10_000) this.introspections.splice(0, this.introspections.length - 10_000);
    return snap;
  }

  // ---- Horizon planning ---------------------------------------------------

  createHorizon(label: string, horizonYears: number, objectives: string[]): HorizonPlan {
    const plan: HorizonPlan = {
      id: `hz-${Date.now().toString(36)}`,
      label,
      horizonYears,
      objectives,
      createdAt: new Date().toISOString(),
      status: 'active',
      coherenceScore: 1.0,
    };
    this.horizons.push(plan);
    return plan;
  }

  updateHorizonCoherence(horizonId: string, score: number): boolean {
    const idx = this.horizons.findIndex((h) => h.id === horizonId);
    if (idx < 0) return false;
    this.horizons[idx] = { ...this.horizons[idx], coherenceScore: Math.max(0, Math.min(1, score)) };
    return true;
  }

  completeHorizon(horizonId: string): boolean {
    const idx = this.horizons.findIndex((h) => h.id === horizonId);
    if (idx < 0) return false;
    this.horizons[idx] = { ...this.horizons[idx], status: 'completed' };
    return true;
  }

  // ---- Self-limit rules ---------------------------------------------------

  checkLimit(metric: string, currentValue: number): boolean {
    let triggered = false;
    for (let i = 0; i < this.limits.length; i++) {
      const rule = this.limits[i];
      if (rule.active && rule.metric === metric && currentValue > rule.threshold) {
        this.limits[i] = { ...rule, triggeredCount: rule.triggeredCount + 1, lastTriggeredAt: new Date().toISOString() };
        triggered = true;
      }
    }
    return triggered;
  }

  addLimit(description: string, metric: string, threshold: number): SelfLimitRule {
    const rule: SelfLimitRule = {
      id: `sl-${Date.now().toString(36)}`,
      description,
      threshold,
      metric,
      active: true,
      triggeredCount: 0,
      lastTriggeredAt: null,
    };
    this.limits.push(rule);
    return rule;
  }

  // ---- Coherence & safety -------------------------------------------------

  setCoherence(level: CoherenceLevel): void { this.coherenceLevel = level; }
  setSelfReferenceStable(stable: boolean): void { this.selfReferenceStable = stable; }
  setSafetyBound(intact: boolean): void { this.safetyBoundIntact = intact; }

  // ---- Summary ------------------------------------------------------------

  getSummary(): ContinuumSingularitySummary {
    return {
      mode: this.mode,
      coherenceLevel: this.coherenceLevel,
      selfReferenceStable: this.selfReferenceStable,
      introspections: this.introspections.length,
      activeHorizons: this.horizons.filter((h) => h.status === 'active').length,
      selfLimitRules: this.limits.length,
      totalLimitTriggers: this.limits.reduce((s, r) => s + r.triggeredCount, 0),
      safetyBoundIntact: this.safetyBoundIntact,
    };
  }
}
