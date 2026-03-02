// ---------------------------------------------------------------------------
// Infinite Evolution Boundary  (Layer 39)
// ---------------------------------------------------------------------------
// The boundary condition that allows AgentArmy to evolve indefinitely while
// remaining bounded, safe, coherent, and aligned.  Defines mathematical and
// constitutional limits of evolution: max self-modification rates, safe
// expansion thresholds, evolution rate limits, and irreversible-change
// safeguards.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type BoundaryCategory = 'modification' | 'expansion' | 'intelligence' | 'resource' | 'governance' | 'identity';
export type BoundaryStatus = 'within-limits' | 'approaching-limit' | 'at-limit' | 'breached';

export interface EvolutionBound {
  readonly id: string;
  readonly category: BoundaryCategory;
  readonly description: string;
  readonly metricName: string;
  readonly currentValue: number;
  readonly softLimit: number;
  readonly hardLimit: number;
  readonly status: BoundaryStatus;
  readonly breachCount: number;
  readonly lastUpdatedAt: string;
}

export interface EvolutionEvent {
  readonly id: string;
  readonly boundId: string;
  readonly previousValue: number;
  readonly newValue: number;
  readonly delta: number;
  readonly status: BoundaryStatus;
  readonly timestamp: string;
  readonly vetoed: boolean;
}

export interface VetoRecord {
  readonly id: string;
  readonly eventId: string;
  readonly reason: string;
  readonly issuedAt: string;
  readonly overridden: boolean;
}

export interface EvolutionBoundarySummary {
  readonly totalBounds: number;
  readonly withinLimits: number;
  readonly approachingLimit: number;
  readonly atLimit: number;
  readonly breached: number;
  readonly totalEvents: number;
  readonly totalVetoes: number;
  readonly overriddenVetoes: number;
  readonly safetyScore: number;           // 0 – 1
}

// ---- Helpers --------------------------------------------------------------

function computeStatus(value: number, soft: number, hard: number): BoundaryStatus {
  if (value >= hard) return 'breached';
  if (value >= soft) return 'at-limit';
  if (value >= soft * 0.8) return 'approaching-limit';
  return 'within-limits';
}

// ---- Layer ----------------------------------------------------------------

export class InfiniteEvolutionBoundary {
  private readonly bounds: EvolutionBound[] = [];
  private readonly events: EvolutionEvent[] = [];
  private readonly vetoes: VetoRecord[] = [];

  constructor() {
    // Default evolution boundaries
    const defaults: Array<[BoundaryCategory, string, string, number, number]> = [
      ['modification', 'Max self-modifications per epoch', 'mods_per_epoch', 100, 200],
      ['expansion', 'Max new domains per cycle', 'domains_per_cycle', 10, 25],
      ['intelligence', 'Max cognitive complexity growth rate', 'complexity_growth_rate', 0.5, 1.0],
      ['resource', 'Max compute utilisation ratio', 'compute_utilisation', 0.85, 0.95],
      ['governance', 'Max governance rule changes per epoch', 'governance_changes', 20, 50],
      ['identity', 'Max identity drift score', 'identity_drift', 0.1, 0.3],
    ];
    for (const [cat, desc, metric, soft, hard] of defaults) {
      this.bounds.push({
        id: `eb-${cat}`,
        category: cat,
        description: desc,
        metricName: metric,
        currentValue: 0,
        softLimit: soft,
        hardLimit: hard,
        status: 'within-limits',
        breachCount: 0,
        lastUpdatedAt: new Date().toISOString(),
      });
    }
  }

  // ---- Bound management ---------------------------------------------------

  addBound(category: BoundaryCategory, description: string, metricName: string, softLimit: number, hardLimit: number): EvolutionBound {
    const bound: EvolutionBound = {
      id: `eb-${Date.now().toString(36)}`,
      category,
      description,
      metricName,
      currentValue: 0,
      softLimit,
      hardLimit,
      status: 'within-limits',
      breachCount: 0,
      lastUpdatedAt: new Date().toISOString(),
    };
    this.bounds.push(bound);
    return bound;
  }

  /**
   * Record a new metric value.  Returns `true` if the update is allowed
   * (within hard limit).  Returns `false` and logs a veto if the hard
   * limit would be breached.
   */
  recordMetric(metricName: string, newValue: number): boolean {
    const idx = this.bounds.findIndex((b) => b.metricName === metricName);
    if (idx < 0) return true; // no bound → allowed

    const bound = this.bounds[idx];
    const status = computeStatus(newValue, bound.softLimit, bound.hardLimit);
    const breached = status === 'breached';

    const evt: EvolutionEvent = {
      id: `eevt-${Date.now().toString(36)}`,
      boundId: bound.id,
      previousValue: bound.currentValue,
      newValue,
      delta: newValue - bound.currentValue,
      status,
      timestamp: new Date().toISOString(),
      vetoed: breached,
    };
    this.events.push(evt);

    if (breached) {
      this.vetoes.push({
        id: `veto-${Date.now().toString(36)}`,
        eventId: evt.id,
        reason: `Hard limit breached for ${metricName}: ${newValue} > ${bound.hardLimit}`,
        issuedAt: new Date().toISOString(),
        overridden: false,
      });
      this.bounds[idx] = { ...bound, breachCount: bound.breachCount + 1, status, lastUpdatedAt: new Date().toISOString() };
      return false;
    }

    this.bounds[idx] = { ...bound, currentValue: newValue, status, lastUpdatedAt: new Date().toISOString() };
    return true;
  }

  overrideVeto(vetoId: string): boolean {
    const idx = this.vetoes.findIndex((v) => v.id === vetoId);
    if (idx < 0) return false;
    this.vetoes[idx] = { ...this.vetoes[idx], overridden: true };
    return true;
  }

  // ---- Query --------------------------------------------------------------

  getBounds(): readonly EvolutionBound[] { return this.bounds; }
  getBreachedBounds(): EvolutionBound[] { return this.bounds.filter((b) => b.status === 'breached'); }

  // ---- Summary ------------------------------------------------------------

  getSummary(): EvolutionBoundarySummary {
    const within = this.bounds.filter((b) => b.status === 'within-limits').length;
    const approaching = this.bounds.filter((b) => b.status === 'approaching-limit').length;
    const atLimit = this.bounds.filter((b) => b.status === 'at-limit').length;
    const breached = this.bounds.filter((b) => b.status === 'breached').length;

    // Safety score: 1.0 if all within limits, penalised by approaching/at/breached
    const penalty = (approaching * 0.05) + (atLimit * 0.15) + (breached * 0.4);
    const safety = Math.max(0, Math.min(1, 1 - penalty));

    return {
      totalBounds: this.bounds.length,
      withinLimits: within,
      approachingLimit: approaching,
      atLimit,
      breached,
      totalEvents: this.events.length,
      totalVetoes: this.vetoes.length,
      overriddenVetoes: this.vetoes.filter((v) => v.overridden).length,
      safetyScore: Number(safety.toFixed(3)),
    };
  }
}
