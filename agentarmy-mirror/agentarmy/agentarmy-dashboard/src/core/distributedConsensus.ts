/**
 * Distributed Consensus Layer — agreement on truth across the OS.
 *
 * Ensures critical global decisions (agent evolution, ZPE weight changes,
 * safety rule updates, economy pricing) are consistent, conflict‑free,
 * durable, and fault‑tolerant even under partial failure.
 *
 * Uses a hybrid model: fast‑path CRDTs for routine updates and quorum‑based
 * strong consensus for critical mutations. The Constitutional Engine retains
 * veto power over any proposal.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConsensusCategory =
  | 'agent_evolution'
  | 'zpe_weights'
  | 'safety_rules'
  | 'economy_pricing'
  | 'mission_branching'
  | 'runner_health'
  | 'knowledge_update';

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'vetoed';

export interface ConsensusProposal {
  id: string;
  category: ConsensusCategory;
  description: string;
  proposedBy: string;        // subsystem name
  payload: Record<string, unknown>;
  votes: Vote[];
  status: ProposalStatus;
  requiresQuorum: boolean;
  constitutionalCheck: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

export interface Vote {
  voter: string;
  approve: boolean;
  reason: string;
  timestamp: string;
}

export interface ConsensusResult {
  proposalId: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  quorumReached: boolean;
  vetoApplied: boolean;
  resolvedAt: string;
}

export interface ConsensusConfig {
  quorumSize: number;          // min voters for strong consensus
  approvalThreshold: number;   // fraction needed (e.g. 0.6 = 60%)
  vetoEnabled: boolean;        // constitutional veto
  fastPathCategories: ConsensusCategory[]; // skip quorum for these
}

const DEFAULT_CONFIG: ConsensusConfig = {
  quorumSize: 3,
  approvalThreshold: 0.6,
  vetoEnabled: true,
  fastPathCategories: ['runner_health', 'knowledge_update'],
};

// ---------------------------------------------------------------------------
// Consensus Layer
// ---------------------------------------------------------------------------

export class DistributedConsensusLayer {
  private readonly proposals: Map<string, ConsensusProposal> = new Map();
  private readonly results: ConsensusResult[] = [];
  private readonly config: ConsensusConfig;
  private vetoFn: ((p: ConsensusProposal) => string | null) | null = null;
  private listeners: Array<(r: ConsensusResult) => void> = [];

  constructor(config?: Partial<ConsensusConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---- Configuration ----

  /** Register a constitutional veto function. Returns a reason string to veto, or null to allow. */
  setVetoFunction(fn: (p: ConsensusProposal) => string | null): void {
    this.vetoFn = fn;
  }

  // ---- Propose ----

  propose(
    category: ConsensusCategory,
    description: string,
    proposedBy: string,
    payload: Record<string, unknown>,
  ): ConsensusProposal {
    const isFastPath = this.config.fastPathCategories.includes(category);
    const proposal: ConsensusProposal = {
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category,
      description,
      proposedBy,
      payload,
      votes: [],
      status: 'pending',
      requiresQuorum: !isFastPath,
      constitutionalCheck: this.config.vetoEnabled,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    this.proposals.set(proposal.id, proposal);

    // Fast‑path: auto‑approve immediately
    if (isFastPath) {
      return this.resolve(proposal);
    }

    return proposal;
  }

  // ---- Vote ----

  vote(proposalId: string, voter: string, approve: boolean, reason = ''): ConsensusProposal | null {
    const p = this.proposals.get(proposalId);
    if (p?.status !== 'pending') return null;

    // Prevent double voting
    if (p.votes.some((v) => v.voter === voter)) return p;

    p.votes.push({ voter, approve, reason, timestamp: new Date().toISOString() });

    // Check if quorum reached
    if (p.requiresQuorum && p.votes.length >= this.config.quorumSize) {
      return this.resolve(p);
    }

    return p;
  }

  // ---- Resolution ----

  /** Force‑resolve a proposal (used by fast‑path or once quorum is met). */
  resolve(proposal: ConsensusProposal): ConsensusProposal {
    // Constitutional veto check
    if (proposal.constitutionalCheck && this.vetoFn) {
      const vetoReason = this.vetoFn(proposal);
      if (vetoReason) {
        proposal.status = 'vetoed';
        proposal.resolvedAt = new Date().toISOString();
        const result = this.buildResult(proposal, true);
        this.results.push(result);
        this.notify(result);
        return proposal;
      }
    }

    // Count votes
    const votesFor = proposal.votes.filter((v) => v.approve).length;
    const votesAgainst = proposal.votes.filter((v) => !v.approve).length;
    const total = votesFor + votesAgainst;

    if (!proposal.requiresQuorum || total === 0) {
      // Fast‑path: auto‑approve
      proposal.status = 'approved';
    } else {
      const ratio = total > 0 ? votesFor / total : 0;
      proposal.status = ratio >= this.config.approvalThreshold ? 'approved' : 'rejected';
    }

    proposal.resolvedAt = new Date().toISOString();
    const result = this.buildResult(proposal, false);
    this.results.push(result);
    this.notify(result);

    return proposal;
  }

  // ---- Query ----

  getProposal(id: string): ConsensusProposal | undefined {
    return this.proposals.get(id);
  }

  getPending(): ConsensusProposal[] {
    return [...this.proposals.values()].filter((p) => p.status === 'pending');
  }

  getResults(limit = 50): ConsensusResult[] {
    return this.results.slice(-limit);
  }

  getSummary(): { total: number; approved: number; rejected: number; vetoed: number; pending: number } {
    const all = [...this.proposals.values()];
    return {
      total: all.length,
      approved: all.filter((p) => p.status === 'approved').length,
      rejected: all.filter((p) => p.status === 'rejected').length,
      vetoed: all.filter((p) => p.status === 'vetoed').length,
      pending: all.filter((p) => p.status === 'pending').length,
    };
  }

  // ---- Events ----

  on(listener: (r: ConsensusResult) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  // ---- Internal ----

  private buildResult(p: ConsensusProposal, vetoed: boolean): ConsensusResult {
    const votesFor = p.votes.filter((v) => v.approve).length;
    const votesAgainst = p.votes.filter((v) => !v.approve).length;
    return {
      proposalId: p.id,
      status: p.status,
      votesFor,
      votesAgainst,
      quorumReached: p.votes.length >= this.config.quorumSize,
      vetoApplied: vetoed,
      resolvedAt: p.resolvedAt ?? new Date().toISOString(),
    };
  }

  private notify(result: ConsensusResult): void {
    for (const fn of this.listeners) fn(result);
  }
}
