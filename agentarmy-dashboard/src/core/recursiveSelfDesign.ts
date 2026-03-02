// ---------------------------------------------------------------------------
// Recursive Self‑Design Layer
// ---------------------------------------------------------------------------
// Enables the system to inspect, propose, and apply modifications to its
// own architecture. Maintains a versioned design history, evaluates
// proposed redesigns, and enforces safety gates before any mutation.
// ---------------------------------------------------------------------------

export type DesignTarget = 'agent' | 'tool' | 'runner' | 'workflow' | 'policy' | 'architecture';
export type ProposalStatus = 'draft' | 'evaluating' | 'approved' | 'rejected' | 'applied' | 'rolled_back';

export interface DesignVersion {
  version: number;
  snapshot: Record<string, unknown>;
  description: string;
  createdAt: string;
}

export interface DesignProposal {
  id: string;
  target: DesignTarget;
  title: string;
  description: string;
  rationale: string;
  diff: DesignDiff;
  status: ProposalStatus;
  score: number;              // 0‑100 fitness score
  safetyCleared: boolean;
  createdAt: string;
  appliedAt: string | null;
}

export interface DesignDiff {
  added: Record<string, unknown>;
  removed: string[];
  modified: Record<string, { from: unknown; to: unknown }>;
}

export interface SafetyGate {
  id: string;
  name: string;
  description: string;
  check: (proposal: DesignProposal) => boolean;
}

export interface DesignSummary {
  currentVersion: number;
  totalVersions: number;
  totalProposals: number;
  applied: number;
  rejected: number;
  rolledBack: number;
  safetyGateCount: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class RecursiveSelfDesign {
  private versions: DesignVersion[] = [];
  private proposals: Map<string, DesignProposal> = new Map();
  private safetyGates: SafetyGate[] = [];
  private currentVersion = 0;
  private listeners: Array<(p: DesignProposal) => void> = [];

  constructor() {
    // Seed version 0
    this.versions.push({
      version: 0,
      snapshot: {},
      description: 'Initial system state',
      createdAt: new Date().toISOString(),
    });

    // Default safety gates
    this.addSafetyGate({
      id: 'gate-no-remove-safety',
      name: 'Preserve Safety Systems',
      description: 'Disallow removal of safety-related components',
      check: (p) => !p.diff.removed.some((r) => r.toLowerCase().includes('safety')),
    });
    this.addSafetyGate({
      id: 'gate-min-fitness',
      name: 'Minimum Fitness Score',
      description: 'Require fitness score >= 30',
      check: (p) => p.score >= 30,
    });
  }

  // ---- Versioning ----

  getVersion(): number {
    return this.currentVersion;
  }

  getVersionHistory(): DesignVersion[] {
    return [...this.versions];
  }

  /** Save a snapshot of the current state. */
  saveSnapshot(snapshot: Record<string, unknown>, description: string): DesignVersion {
    this.currentVersion += 1;
    const version: DesignVersion = {
      version: this.currentVersion,
      snapshot,
      description,
      createdAt: new Date().toISOString(),
    };
    this.versions.push(version);
    return version;
  }

  // ---- Proposals ----

  propose(
    target: DesignTarget,
    title: string,
    description: string,
    rationale: string,
    diff: DesignDiff,
    score = 50,
  ): DesignProposal {
    const proposal: DesignProposal = {
      id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      target,
      title,
      description,
      rationale,
      diff,
      status: 'draft',
      score,
      safetyCleared: false,
      createdAt: new Date().toISOString(),
      appliedAt: null,
    };
    this.proposals.set(proposal.id, proposal);
    return proposal;
  }

  /** Evaluate a proposal against all safety gates. */
  evaluate(proposalId: string): DesignProposal | null {
    const p = this.proposals.get(proposalId);
    if (!p) return null;

    p.status = 'evaluating';
    const passed = this.safetyGates.every((gate) => gate.check(p));
    p.safetyCleared = passed;
    p.status = passed ? 'approved' : 'rejected';

    for (const fn of this.listeners) fn(p);
    return p;
  }

  /** Apply an approved proposal (saves a new version). */
  apply(proposalId: string): DesignProposal | null {
    const p = this.proposals.get(proposalId);
    if (!p || p.status !== 'approved') return null;

    p.status = 'applied';
    p.appliedAt = new Date().toISOString();

    // Build new snapshot from diff
    const prevSnapshot = this.versions.at(-1)?.snapshot ?? {};
    const newSnapshot = { ...prevSnapshot, ...p.diff.added };
    for (const key of p.diff.removed) delete newSnapshot[key];
    for (const [key, change] of Object.entries(p.diff.modified)) {
      newSnapshot[key] = change.to;
    }

    this.saveSnapshot(newSnapshot, `Applied: ${p.title}`);
    for (const fn of this.listeners) fn(p);
    return p;
  }

  /** Roll back to a previous version. */
  rollback(toVersion: number): DesignVersion | null {
    const target = this.versions.find((v) => v.version === toVersion);
    if (!target) return null;

    this.currentVersion += 1;
    const rollbackVersion: DesignVersion = {
      version: this.currentVersion,
      snapshot: { ...target.snapshot },
      description: `Rollback to v${toVersion}`,
      createdAt: new Date().toISOString(),
    };
    this.versions.push(rollbackVersion);
    return rollbackVersion;
  }

  getProposal(id: string): DesignProposal | undefined {
    return this.proposals.get(id);
  }

  getProposals(status?: ProposalStatus): DesignProposal[] {
    const all = Array.from(this.proposals.values());
    return status ? all.filter((p) => p.status === status) : all;
  }

  // ---- Safety Gates ----

  addSafetyGate(gate: SafetyGate): void {
    this.safetyGates.push(gate);
  }

  getSafetyGates(): SafetyGate[] {
    return [...this.safetyGates];
  }

  // ---- Summary ----

  getSummary(): DesignSummary {
    const all = Array.from(this.proposals.values());
    return {
      currentVersion: this.currentVersion,
      totalVersions: this.versions.length,
      totalProposals: all.length,
      applied: all.filter((p) => p.status === 'applied').length,
      rejected: all.filter((p) => p.status === 'rejected').length,
      rolledBack: this.versions.filter((v) => v.description.startsWith('Rollback')).length,
      safetyGateCount: this.safetyGates.length,
    };
  }

  // ---- Events ----

  on(listener: (p: DesignProposal) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }
}
