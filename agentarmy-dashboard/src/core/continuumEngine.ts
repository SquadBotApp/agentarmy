// ---------------------------------------------------------------------------
// Continuum Engine — Epoch‑Scale Persistence and Evolution  (Layer 31)
// ---------------------------------------------------------------------------
// Ensures AgentArmy persists, adapts, and evolves across decades,
// technological shifts, and civilizational transitions.  Manages knowledge
// migration, constitutional continuity, and long‑arc mission commitments.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type EpochPhase = 'stable' | 'transitioning' | 'migrating' | 'evolving' | 'degraded';
export type SubstrateKind = 'classical' | 'quantum' | 'neuromorphic' | 'hybrid' | 'distributed' | 'unknown';

export interface EpochRecord {
  readonly id: string;
  readonly label: string;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly phase: EpochPhase;
  readonly substrate: SubstrateKind;
  readonly knowledgeItems: number;
  readonly migratedFrom: string | null;
  readonly constitutionVersion: string;
}

export interface MigrationPlan {
  readonly id: string;
  readonly fromEpoch: string;
  readonly toEpoch: string;
  readonly status: 'planned' | 'in-progress' | 'completed' | 'failed';
  readonly estimatedDurationMs: number;
  readonly itemsTotal: number;
  readonly itemsMigrated: number;
  readonly createdAt: string;
  readonly completedAt: string | null;
}

export interface LongArcCommitment {
  readonly id: string;
  readonly missionId: string;
  readonly description: string;
  readonly horizonYears: number;
  readonly createdEpoch: string;
  readonly status: 'active' | 'fulfilled' | 'abandoned' | 'suspended';
  readonly checkpoints: readonly CommitmentCheckpoint[];
}

export interface CommitmentCheckpoint {
  readonly epoch: string;
  readonly timestamp: string;
  readonly progressPct: number;
  readonly notes: string;
}

export interface ContinuumSummary {
  readonly currentEpoch: string;
  readonly totalEpochs: number;
  readonly phase: EpochPhase;
  readonly activeMigrations: number;
  readonly completedMigrations: number;
  readonly longArcCommitments: number;
  readonly activeCommitments: number;
  readonly constitutionVersion: string;
  readonly uptimeEpochMs: number;
}

// ---- Engine ---------------------------------------------------------------

export class ContinuumEngine {
  private readonly epochs: EpochRecord[] = [];
  private readonly migrations: MigrationPlan[] = [];
  private readonly commitments: LongArcCommitment[] = [];
  private constitutionVersion = '1.0.0';

  constructor() {
    this.epochs.push({
      id: 'epoch-0',
      label: 'Genesis',
      startedAt: new Date().toISOString(),
      endedAt: null,
      phase: 'stable',
      substrate: 'classical',
      knowledgeItems: 0,
      migratedFrom: null,
      constitutionVersion: this.constitutionVersion,
    });
  }

  // ---- Epoch management ---------------------------------------------------

  getCurrentEpoch(): EpochRecord {
    return this.epochs.at(-1)!;
  }

  beginEpochTransition(label: string, substrate: SubstrateKind): MigrationPlan {
    const current = this.getCurrentEpoch();
    const newEpochId = `epoch-${this.epochs.length}`;

    // Close current epoch
    const updated: EpochRecord = { ...current, endedAt: new Date().toISOString(), phase: 'transitioning' };
    this.epochs[this.epochs.length - 1] = updated;

    // Open new epoch
    this.epochs.push({
      id: newEpochId,
      label,
      startedAt: new Date().toISOString(),
      endedAt: null,
      phase: 'migrating',
      substrate,
      knowledgeItems: 0,
      migratedFrom: current.id,
      constitutionVersion: this.constitutionVersion,
    });

    const plan: MigrationPlan = {
      id: `mig-${Date.now().toString(36)}`,
      fromEpoch: current.id,
      toEpoch: newEpochId,
      status: 'in-progress',
      estimatedDurationMs: 60_000,
      itemsTotal: current.knowledgeItems,
      itemsMigrated: 0,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    this.migrations.push(plan);
    return plan;
  }

  completeMigration(migrationId: string): boolean {
    const idx = this.migrations.findIndex((m) => m.id === migrationId);
    if (idx < 0) return false;
    const m = this.migrations[idx];
    this.migrations[idx] = { ...m, status: 'completed', itemsMigrated: m.itemsTotal, completedAt: new Date().toISOString() };

    // Stabilise the current epoch
    const epochIdx = this.epochs.findIndex((e) => e.id === m.toEpoch);
    if (epochIdx >= 0) {
      this.epochs[epochIdx] = { ...this.epochs[epochIdx], phase: 'stable', knowledgeItems: m.itemsTotal };
    }
    return true;
  }

  // ---- Long‑arc commitments -----------------------------------------------

  registerCommitment(missionId: string, description: string, horizonYears: number): LongArcCommitment {
    const c: LongArcCommitment = {
      id: `lac-${Date.now().toString(36)}`,
      missionId,
      description,
      horizonYears,
      createdEpoch: this.getCurrentEpoch().id,
      status: 'active',
      checkpoints: [],
    };
    this.commitments.push(c);
    return c;
  }

  checkpoint(commitmentId: string, progressPct: number, notes: string): boolean {
    const idx = this.commitments.findIndex((c) => c.id === commitmentId);
    if (idx < 0) return false;
    const cp: CommitmentCheckpoint = {
      epoch: this.getCurrentEpoch().id,
      timestamp: new Date().toISOString(),
      progressPct: Math.max(0, Math.min(100, progressPct)),
      notes,
    };
    const c = this.commitments[idx];
    this.commitments[idx] = { ...c, checkpoints: [...c.checkpoints, cp] };
    return true;
  }

  // ---- Constitution -------------------------------------------------------

  upgradeConstitution(newVersion: string): void {
    this.constitutionVersion = newVersion;
    const idx = this.epochs.length - 1;
    this.epochs[idx] = { ...this.epochs[idx], constitutionVersion: newVersion };
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): ContinuumSummary {
    const current = this.getCurrentEpoch();
    return {
      currentEpoch: current.id,
      totalEpochs: this.epochs.length,
      phase: current.phase,
      activeMigrations: this.migrations.filter((m) => m.status === 'in-progress').length,
      completedMigrations: this.migrations.filter((m) => m.status === 'completed').length,
      longArcCommitments: this.commitments.length,
      activeCommitments: this.commitments.filter((c) => c.status === 'active').length,
      constitutionVersion: this.constitutionVersion,
      uptimeEpochMs: Date.now() - new Date(current.startedAt).getTime(),
    };
  }
}
