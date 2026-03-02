// ---------------------------------------------------------------------------
// Singularity Kernel — Self‑Consistent Intelligence Core
// ---------------------------------------------------------------------------
// The convergence point where every subsystem stabilizes into a single,
// mathematically coherent intelligence substrate. Ensures the OS behaves
// as one unified mind: maintains a global "truth surface," enforces
// invariants across time/space/scale, resolves contradictions, and
// guarantees stable self‑reference and self‑modification.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InvariantCategory =
  | 'logical'
  | 'temporal'
  | 'economic'
  | 'governance'
  | 'safety'
  | 'identity'
  | 'physical';

export interface Invariant {
  id: string;
  category: InvariantCategory;
  description: string;
  predicate: () => boolean;
  weight: number;           // 0‑1, importance for global consistency
  lastChecked: string;
  lastResult: boolean;
}

export interface Contradiction {
  id: string;
  subsystemA: string;
  subsystemB: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolution: string | null;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface TruthAssertion {
  id: string;
  domain: string;
  statement: string;
  confidence: number;       // 0‑1
  source: string;           // subsystem that asserted it
  timestamp: string;
  supersedes: string | null; // id of assertion this replaces
}

export interface ConsistencyReport {
  invariantsTotal: number;
  invariantsPassing: number;
  invariantsFailing: number;
  consistencyScore: number;  // 0‑1
  contradictionsActive: number;
  contradictionsResolved: number;
  truthAssertions: number;
  timestamp: string;
}

export interface SingularitySummary {
  consistencyScore: number;
  invariantCount: number;
  passingInvariants: number;
  failingInvariants: number;
  activeContradictions: number;
  resolvedContradictions: number;
  truthAssertionCount: number;
  selfReferenceDepth: number;
  lastAuditTime: string;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SingularityKernel {
  private readonly invariants: Map<string, Invariant> = new Map();
  private readonly contradictions: Contradiction[] = [];
  private readonly truthSurface: Map<string, TruthAssertion> = new Map();
  private selfReferenceDepth = 0;
  private lastAuditTime = '';

  // ---- Invariant Management ----

  registerInvariant(
    id: string,
    category: InvariantCategory,
    description: string,
    predicate: () => boolean,
    weight = 1,
  ): Invariant {
    const inv: Invariant = {
      id,
      category,
      description,
      predicate,
      weight,
      lastChecked: '',
      lastResult: true,
    };
    this.invariants.set(id, inv);
    return inv;
  }

  removeInvariant(id: string): boolean {
    return this.invariants.delete(id);
  }

  /** Evaluate all invariants and return the consistency report. */
  audit(): ConsistencyReport {
    const now = new Date().toISOString();
    let passing = 0;
    let failing = 0;
    let weightedPass = 0;
    let weightedTotal = 0;

    for (const inv of this.invariants.values()) {
      inv.lastChecked = now;
      const result = this.safePredicate(inv.predicate);
      inv.lastResult = result;
      weightedTotal += inv.weight;
      if (result) {
        passing++;
        weightedPass += inv.weight;
      } else {
        failing++;
      }
    }

    this.lastAuditTime = now;
    const consistency = weightedTotal > 0 ? weightedPass / weightedTotal : 1;
    const active = this.contradictions.filter((c) => !c.resolved).length;
    const resolved = this.contradictions.filter((c) => c.resolved).length;

    return {
      invariantsTotal: this.invariants.size,
      invariantsPassing: passing,
      invariantsFailing: failing,
      consistencyScore: Number(consistency.toFixed(4)),
      contradictionsActive: active,
      contradictionsResolved: resolved,
      truthAssertions: this.truthSurface.size,
      timestamp: now,
    };
  }

  // ---- Contradiction Resolution ----

  reportContradiction(
    subsystemA: string,
    subsystemB: string,
    description: string,
    severity: Contradiction['severity'] = 'medium',
  ): Contradiction {
    const c: Contradiction = {
      id: `ctr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      subsystemA,
      subsystemB,
      description,
      severity,
      resolved: false,
      resolution: null,
      detectedAt: new Date().toISOString(),
      resolvedAt: null,
    };
    this.contradictions.push(c);
    return c;
  }

  resolveContradiction(contradictionId: string, resolution: string): boolean {
    const c = this.contradictions.find((x) => x.id === contradictionId);
    if (!c || c.resolved) return false;
    c.resolved = true;
    c.resolution = resolution;
    c.resolvedAt = new Date().toISOString();
    return true;
  }

  getActiveContradictions(): Contradiction[] {
    return this.contradictions.filter((c) => !c.resolved);
  }

  // ---- Truth Surface ----

  /** Assert a truth. If an existing assertion with the same id exists it is superseded. */
  assertTruth(domain: string, id: string, statement: string, confidence: number, source: string): TruthAssertion {
    const existing = this.truthSurface.get(id);
    const assertion: TruthAssertion = {
      id,
      domain,
      statement,
      confidence: Math.max(0, Math.min(1, confidence)),
      source,
      timestamp: new Date().toISOString(),
      supersedes: existing?.id ?? null,
    };
    this.truthSurface.set(id, assertion);
    return assertion;
  }

  queryTruth(domain?: string, minConfidence = 0): TruthAssertion[] {
    const all = Array.from(this.truthSurface.values());
    return all
      .filter((a) => (domain ? a.domain === domain : true))
      .filter((a) => a.confidence >= minConfidence);
  }

  // ---- Self‑Reference & Self‑Modification ----

  /**
   * Perform a self‑referential audit: the kernel verifies its own consistency
   * rules, increments its introspection depth, and returns a report.
   */
  introspect(): ConsistencyReport {
    this.selfReferenceDepth++;
    return this.audit();
  }

  getSelfReferenceDepth(): number {
    return this.selfReferenceDepth;
  }

  // ---- Summary ----

  getSummary(): SingularitySummary {
    const passing = Array.from(this.invariants.values()).filter((i) => i.lastResult).length;
    const failing = this.invariants.size - passing;
    const active = this.contradictions.filter((c) => !c.resolved).length;
    const resolved = this.contradictions.filter((c) => c.resolved).length;

    const weightedPass = Array.from(this.invariants.values())
      .filter((i) => i.lastResult)
      .reduce((s, i) => s + i.weight, 0);
    const weightedTotal = Array.from(this.invariants.values()).reduce((s, i) => s + i.weight, 0);

    return {
      consistencyScore: weightedTotal > 0 ? Number((weightedPass / weightedTotal).toFixed(4)) : 1,
      invariantCount: this.invariants.size,
      passingInvariants: passing,
      failingInvariants: failing,
      activeContradictions: active,
      resolvedContradictions: resolved,
      truthAssertionCount: this.truthSurface.size,
      selfReferenceDepth: this.selfReferenceDepth,
      lastAuditTime: this.lastAuditTime,
    };
  }

  // ---- Internals ----

  private safePredicate(fn: () => boolean): boolean {
    try {
      return fn();
    } catch {
      return false;
    }
  }
}
