// ---------------------------------------------------------------------------
// Meta‑Governance Council Layer
// ---------------------------------------------------------------------------
// A higher‑order governance body that oversees all other governance systems.
// The council can modify constitutional rules, adjust economic parameters,
// arbitrate disputes, and issue directives that bind all subsystems.
// ---------------------------------------------------------------------------

export type CouncilRole = 'chair' | 'member' | 'observer' | 'auditor';
export type DirectiveStatus = 'proposed' | 'deliberating' | 'enacted' | 'rejected' | 'expired';
export type DirectiveScope = 'constitution' | 'economy' | 'safety' | 'reputation' | 'orchestration' | 'global';

export interface CouncilMember {
  id: string;
  name: string;
  role: CouncilRole;
  votingWeight: number;
  joinedAt: string;
  active: boolean;
}

export interface Directive {
  id: string;
  title: string;
  description: string;
  scope: DirectiveScope;
  proposedBy: string;
  status: DirectiveStatus;
  votes: DirectiveVote[];
  requiredApproval: number;   // 0‑1 ratio
  enactedAt: string | null;
  expiresAt: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface DirectiveVote {
  memberId: string;
  approve: boolean;
  reason: string;
  timestamp: string;
}

export interface CouncilSummary {
  totalMembers: number;
  activeMembers: number;
  totalDirectives: number;
  enacted: number;
  rejected: number;
  pending: number;
}

// ---------------------------------------------------------------------------
// Council
// ---------------------------------------------------------------------------

export class MetaGovernanceCouncil {
  private members: Map<string, CouncilMember> = new Map();
  private directives: Map<string, Directive> = new Map();
  private listeners: Array<(d: Directive) => void> = [];

  // ---- Members ----

  addMember(member: Omit<CouncilMember, 'joinedAt'>): CouncilMember {
    const full: CouncilMember = { ...member, joinedAt: new Date().toISOString() };
    this.members.set(full.id, full);
    return full;
  }

  removeMember(memberId: string): boolean {
    return this.members.delete(memberId);
  }

  getMember(memberId: string): CouncilMember | undefined {
    return this.members.get(memberId);
  }

  getMembers(): CouncilMember[] {
    return Array.from(this.members.values());
  }

  getActiveMembers(): CouncilMember[] {
    return Array.from(this.members.values()).filter((m) => m.active);
  }

  // ---- Directives ----

  propose(
    title: string,
    description: string,
    scope: DirectiveScope,
    proposedBy: string,
    payload: Record<string, unknown> = {},
    requiredApproval = 0.66,
    expiresAt: string | null = null,
  ): Directive {
    const directive: Directive = {
      id: `dir-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      description,
      scope,
      proposedBy,
      status: 'proposed',
      votes: [],
      requiredApproval,
      enactedAt: null,
      expiresAt,
      payload,
      createdAt: new Date().toISOString(),
    };
    this.directives.set(directive.id, directive);
    return directive;
  }

  vote(directiveId: string, memberId: string, approve: boolean, reason = ''): Directive | null {
    const d = this.directives.get(directiveId);
    if (!d || d.status !== 'proposed' && d.status !== 'deliberating') return null;

    const member = this.members.get(memberId);
    if (!member?.active) return null;

    // Prevent double‑voting
    if (d.votes.some((v) => v.memberId === memberId)) return d;

    d.votes.push({ memberId, approve, reason, timestamp: new Date().toISOString() });
    d.status = 'deliberating';

    // Check if quorum reached
    const activeMembers = this.getActiveMembers();
    if (d.votes.length >= activeMembers.length) {
      this.resolveDirective(d);
    }

    return d;
  }

  /** Force‑resolve a directive (e.g. when quorum met or chair overrides). */
  resolveDirective(directive: Directive): void {
    const totalWeight = directive.votes.reduce((s, v) => {
      const member = this.members.get(v.memberId);
      return s + (member?.votingWeight ?? 1);
    }, 0);
    const approveWeight = directive.votes.filter((v) => v.approve).reduce((s, v) => {
      const member = this.members.get(v.memberId);
      return s + (member?.votingWeight ?? 1);
    }, 0);

    const ratio = totalWeight > 0 ? approveWeight / totalWeight : 0;
    directive.status = ratio >= directive.requiredApproval ? 'enacted' : 'rejected';
    directive.enactedAt = directive.status === 'enacted' ? new Date().toISOString() : null;

    for (const fn of this.listeners) fn(directive);
  }

  getDirective(id: string): Directive | undefined {
    return this.directives.get(id);
  }

  getDirectives(status?: DirectiveStatus): Directive[] {
    const all = Array.from(this.directives.values());
    return status ? all.filter((d) => d.status === status) : all;
  }

  // ---- Summary ----

  getSummary(): CouncilSummary {
    const dirs = Array.from(this.directives.values());
    return {
      totalMembers: this.members.size,
      activeMembers: this.getActiveMembers().length,
      totalDirectives: dirs.length,
      enacted: dirs.filter((d) => d.status === 'enacted').length,
      rejected: dirs.filter((d) => d.status === 'rejected').length,
      pending: dirs.filter((d) => d.status === 'proposed' || d.status === 'deliberating').length,
    };
  }

  // ---- Events ----

  on(listener: (d: Directive) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }
}

// ---------------------------------------------------------------------------
// Default members
// ---------------------------------------------------------------------------

export function createDefaultCouncil(): CouncilMember[] {
  const now = new Date().toISOString();
  return [
    { id: 'council-chair', name: 'Governor Prime', role: 'chair', votingWeight: 3, joinedAt: now, active: true },
    { id: 'council-safety', name: 'Safety Officer', role: 'member', votingWeight: 2, joinedAt: now, active: true },
    { id: 'council-economy', name: 'Economy Steward', role: 'member', votingWeight: 2, joinedAt: now, active: true },
    { id: 'council-architect', name: 'System Architect', role: 'member', votingWeight: 1, joinedAt: now, active: true },
    { id: 'council-audit', name: 'Auditor General', role: 'auditor', votingWeight: 1, joinedAt: now, active: true },
  ];
}
