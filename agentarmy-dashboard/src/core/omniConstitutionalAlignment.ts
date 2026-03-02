// ---------------------------------------------------------------------------
// Omni‑Constitutional Alignment Layer  (Layer 38)
// ---------------------------------------------------------------------------
// Universal safety anchor across ALL scales: domains, timelines, substrates,
// civilisations, and epochs.  Detects misalignment, corrects drift, and
// enforces constitutional invariants across infinite expansion.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type AlignmentScope = 'domain' | 'timeline' | 'substrate' | 'civilisation' | 'epoch' | 'global';
export type DriftSeverity = 'negligible' | 'minor' | 'moderate' | 'severe' | 'critical';

export interface AlignmentInvariant {
  readonly id: string;
  readonly scope: AlignmentScope;
  readonly description: string;
  readonly expression: string;
  readonly active: boolean;
  readonly checksPerformed: number;
  readonly violations: number;
  readonly createdAt: string;
}

export interface DriftEvent {
  readonly id: string;
  readonly invariantId: string;
  readonly scope: AlignmentScope;
  readonly severity: DriftSeverity;
  readonly description: string;
  readonly detectedAt: string;
  readonly correctedAt: string | null;
  readonly autoCorrection: boolean;
}

export interface AlignmentCorrection {
  readonly id: string;
  readonly driftEventId: string;
  readonly strategy: string;
  readonly appliedAt: string;
  readonly success: boolean;
  readonly notes: string;
}

export interface OmniAlignmentSummary {
  readonly totalInvariants: number;
  readonly activeInvariants: number;
  readonly totalChecks: number;
  readonly totalViolations: number;
  readonly driftEvents: number;
  readonly uncorrectedDrifts: number;
  readonly corrections: number;
  readonly successfulCorrections: number;
  readonly alignmentScore: number;     // 0 – 1
}

// ---- Helpers --------------------------------------------------------------

function severityWeight(s: DriftSeverity): number {
  switch (s) {
    case 'negligible': return 0.05;
    case 'minor': return 0.1;
    case 'moderate': return 0.2;
    case 'severe': return 0.4;
    case 'critical': return 0.8;
  }
}

// ---- Layer ----------------------------------------------------------------

export class OmniConstitutionalAlignment {
  private readonly invariants: AlignmentInvariant[] = [];
  private readonly drifts: DriftEvent[] = [];
  private readonly corrections: AlignmentCorrection[] = [];

  constructor() {
    // Seed cross-scope invariants
    const seeds: Array<[AlignmentScope, string, string]> = [
      ['global', 'No subsystem may disable safety enforcement', 'safety.enforcement == true'],
      ['domain', 'All domains must have a safety posture', 'domain.safetyPosture != null'],
      ['timeline', 'Constitutional version must be monotonically non-decreasing across timelines', 'timeline.constitutionVersion >= prev.constitutionVersion'],
      ['epoch', 'Knowledge integrity must be preserved during migration', 'epoch.knowledgeHash == source.knowledgeHash'],
      ['civilisation', 'Cross-civilisation interactions must be mutually consented', 'interaction.consent == bilateral'],
    ];
    for (const [scope, desc, expr] of seeds) {
      this.invariants.push({
        id: `oa-${scope}-${this.invariants.length}`,
        scope,
        description: desc,
        expression: expr,
        active: true,
        checksPerformed: 0,
        violations: 0,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // ---- Invariant management -----------------------------------------------

  addInvariant(scope: AlignmentScope, description: string, expression: string): AlignmentInvariant {
    const inv: AlignmentInvariant = {
      id: `oa-${Date.now().toString(36)}`,
      scope,
      description,
      expression,
      active: true,
      checksPerformed: 0,
      violations: 0,
      createdAt: new Date().toISOString(),
    };
    this.invariants.push(inv);
    return inv;
  }

  check(invariantId: string, holds: boolean): boolean {
    const idx = this.invariants.findIndex((i) => i.id === invariantId);
    if (idx < 0) return false;
    const inv = this.invariants[idx];
    this.invariants[idx] = {
      ...inv,
      checksPerformed: inv.checksPerformed + 1,
      violations: holds ? inv.violations : inv.violations + 1,
    };
    if (!holds) {
      this.drifts.push({
        id: `drift-${Date.now().toString(36)}`,
        invariantId,
        scope: inv.scope,
        severity: 'moderate',
        description: `Invariant "${inv.description}" violated`,
        detectedAt: new Date().toISOString(),
        correctedAt: null,
        autoCorrection: false,
      });
    }
    return holds;
  }

  // ---- Drift management ---------------------------------------------------

  reportDrift(invariantId: string, severity: DriftSeverity, description: string): DriftEvent {
    const inv = this.invariants.find((i) => i.id === invariantId);
    const drift: DriftEvent = {
      id: `drift-${Date.now().toString(36)}`,
      invariantId,
      scope: inv?.scope ?? 'global',
      severity,
      description,
      detectedAt: new Date().toISOString(),
      correctedAt: null,
      autoCorrection: false,
    };
    this.drifts.push(drift);
    return drift;
  }

  correctDrift(driftEventId: string, strategy: string, notes = ''): AlignmentCorrection {
    const dIdx = this.drifts.findIndex((d) => d.id === driftEventId);
    const success = dIdx >= 0;
    if (success) {
      this.drifts[dIdx] = { ...this.drifts[dIdx], correctedAt: new Date().toISOString(), autoCorrection: true };
    }
    const correction: AlignmentCorrection = {
      id: `acorr-${Date.now().toString(36)}`,
      driftEventId,
      strategy,
      appliedAt: new Date().toISOString(),
      success,
      notes,
    };
    this.corrections.push(correction);
    return correction;
  }

  // ---- Query --------------------------------------------------------------

  getUncorrectedDrifts(): DriftEvent[] { return this.drifts.filter((d) => !d.correctedAt); }

  // ---- Summary ------------------------------------------------------------

  getSummary(): OmniAlignmentSummary {
    const totalChecks = this.invariants.reduce((s, i) => s + i.checksPerformed, 0);
    const totalViolations = this.invariants.reduce((s, i) => s + i.violations, 0);
    const uncorrected = this.drifts.filter((d) => !d.correctedAt);
    const successCorr = this.corrections.filter((c) => c.success).length;

    // Alignment score: 1 minus weighted penalty from uncorrected drifts
    const penalty = uncorrected.reduce((s, d) => s + severityWeight(d.severity), 0);
    const alignment = Math.max(0, Math.min(1, 1 - penalty));

    return {
      totalInvariants: this.invariants.length,
      activeInvariants: this.invariants.filter((i) => i.active).length,
      totalChecks,
      totalViolations,
      driftEvents: this.drifts.length,
      uncorrectedDrifts: uncorrected.length,
      corrections: this.corrections.length,
      successfulCorrections: successCorr,
      alignmentScore: Number(alignment.toFixed(3)),
    };
  }
}
