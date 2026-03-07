/**
 * Federated Intelligence Mesh — distributed learning without sharing raw data.
 *
 * Nodes exchange gradient-level or pattern-level insights while keeping
 * mission/tool/agent data fully local. Supports contribution scoring,
 * aggregation rounds, and privacy budgets.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FederatedDomain =
  | 'tool_selection'
  | 'agent_assignment'
  | 'zpe_weight'
  | 'mission_planning'
  | 'safety_pattern'
  | 'economy_pricing';

export interface FederatedNode {
  nodeId: string;
  tenantId: string;
  region: string;
  online: boolean;
  lastSyncAt: string | null;
  contributionScore: number;   // 0‑1
  privacyBudgetRemaining: number;
}

export interface GradientUpdate {
  id: string;
  nodeId: string;
  domain: FederatedDomain;
  weights: number[];           // abstract gradient vector
  sampleCount: number;
  round: number;
  submittedAt: string;
}

export interface AggregatedModel {
  domain: FederatedDomain;
  weights: number[];
  round: number;
  participantCount: number;
  aggregatedAt: string;
}

export interface FederatedRound {
  roundId: number;
  domain: FederatedDomain;
  status: 'collecting' | 'aggregating' | 'distributed' | 'failed';
  participants: string[];      // nodeIds
  updates: GradientUpdate[];
  result: AggregatedModel | null;
  startedAt: string;
  completedAt: string | null;
}

export interface FederatedSummary {
  totalNodes: number;
  onlineNodes: number;
  roundsCompleted: number;
  domainRounds: Record<FederatedDomain, number>;
  avgContributionScore: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class FederatedIntelligenceMesh {
  private readonly nodes: Map<string, FederatedNode> = new Map();
  private readonly rounds: FederatedRound[] = [];
  private readonly models: Map<FederatedDomain, AggregatedModel> = new Map();
  private nextRoundId = 1;

  // ---- Node management ----

  registerNode(node: FederatedNode): void {
    this.nodes.set(node.nodeId, node);
  }

  getNode(nodeId: string): FederatedNode | undefined {
    return this.nodes.get(nodeId);
  }

  listNodes(): FederatedNode[] {
    return Array.from(this.nodes.values());
  }

  setNodeOnline(nodeId: string, online: boolean): void {
    const n = this.nodes.get(nodeId);
    if (n) n.online = online;
  }

  // ---- Federated learning rounds ----

  /** Start a new collection round for a given domain. */
  startRound(domain: FederatedDomain): FederatedRound {
    const round: FederatedRound = {
      roundId: this.nextRoundId++,
      domain,
      status: 'collecting',
      participants: [],
      updates: [],
      result: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    this.rounds.push(round);
    return round;
  }

  /** Submit a gradient update from a node for an active round. */
  submitUpdate(roundId: number, update: GradientUpdate): boolean {
    const round = this.rounds.find((r) => r.roundId === roundId);
    if (round?.status !== 'collecting') return false;

    const node = this.nodes.get(update.nodeId);
    if (!node?.online) return false;
    if (node.privacyBudgetRemaining <= 0) return false;

    node.privacyBudgetRemaining = Math.max(0, node.privacyBudgetRemaining - 1);
    round.updates.push(update);
    if (!round.participants.includes(update.nodeId)) round.participants.push(update.nodeId);
    return true;
  }

  /** Aggregate updates and produce a new model version. */
  aggregate(roundId: number): AggregatedModel | null {
    const round = this.rounds.find((r) => r.roundId === roundId);
    if (!round || round.updates.length === 0) return null;

    round.status = 'aggregating';

    // Simple federated averaging
    const dim = round.updates[0].weights.length;
    const totalSamples = round.updates.reduce((s, u) => s + u.sampleCount, 0);
    const averaged = new Array(dim).fill(0);
    for (const u of round.updates) {
      const w = u.sampleCount / totalSamples;
      for (let i = 0; i < dim; i++) {
        averaged[i] += u.weights[i] * w;
      }
    }

    const model: AggregatedModel = {
      domain: round.domain,
      weights: averaged.map((v) => Number(v.toFixed(6))),
      round: round.roundId,
      participantCount: round.participants.length,
      aggregatedAt: new Date().toISOString(),
    };

    round.result = model;
    round.status = 'distributed';
    round.completedAt = new Date().toISOString();
    this.models.set(round.domain, model);

    // Credit participating nodes
    for (const nid of round.participants) {
      const node = this.nodes.get(nid);
      if (node) node.contributionScore = Math.min(1, node.contributionScore + 0.02);
    }

    return model;
  }

  // ---- Query ----

  getModel(domain: FederatedDomain): AggregatedModel | undefined {
    return this.models.get(domain);
  }

  getRound(roundId: number): FederatedRound | undefined {
    return this.rounds.find((r) => r.roundId === roundId);
  }

  getActiveRounds(): FederatedRound[] {
    return this.rounds.filter((r) => r.status === 'collecting');
  }

  getSummary(): FederatedSummary {
    const nodeArr = Array.from(this.nodes.values());
    const domainRounds: Record<string, number> = {};
    for (const r of this.rounds) {
      if (r.status === 'distributed') {
        domainRounds[r.domain] = (domainRounds[r.domain] || 0) + 1;
      }
    }
    return {
      totalNodes: nodeArr.length,
      onlineNodes: nodeArr.filter((n) => n.online).length,
      roundsCompleted: this.rounds.filter((r) => r.status === 'distributed').length,
      domainRounds: domainRounds as Record<FederatedDomain, number>,
      avgContributionScore: nodeArr.length > 0
        ? Number((nodeArr.reduce((s, n) => s + n.contributionScore, 0) / nodeArr.length).toFixed(3))
        : 0,
    };
  }
}
