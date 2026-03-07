/**
 * Inter-Agent Communication Protocol — universal agent messaging and negotiation.
 *
 * Defines message schemas, channels, negotiation primitives, and broadcast
 * mechanisms so every agent in the OS can communicate through a standardised
 * protocol regardless of implementation or location.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

export type MessageKind =
  | 'request'
  | 'response'
  | 'broadcast'
  | 'negotiation'
  | 'delegation'
  | 'status'
  | 'alert';

export interface AgentMessage {
  id: string;
  kind: MessageKind;
  from: string;           // agentId
  to: string | null;      // agentId or null for broadcast
  channel: string;
  priority: MessagePriority;
  subject: string;
  payload: Record<string, unknown>;
  correlationId: string | null;
  sentAt: string;
  ttlMs: number;          // max lifespan
}

export interface MessageChannel {
  channelId: string;
  name: string;
  description: string;
  subscribers: string[];
  createdAt: string;
}

export interface NegotiationSession {
  id: string;
  initiator: string;
  participants: string[];
  subject: string;
  status: 'open' | 'agreed' | 'failed' | 'expired';
  proposals: NegotiationProposal[];
  outcome: Record<string, unknown> | null;
  startedAt: string;
  closedAt: string | null;
}

export interface NegotiationProposal {
  proposerId: string;
  terms: Record<string, unknown>;
  votes: Record<string, 'accept' | 'reject' | 'abstain'>;
  proposedAt: string;
}

export interface ProtocolSummary {
  totalMessages: number;
  channels: number;
  activeNegotiations: number;
  completedNegotiations: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class InterAgentProtocol {
  private messages: AgentMessage[] = [];
  private readonly channels: Map<string, MessageChannel> = new Map();
  private readonly negotiations: Map<string, NegotiationSession> = new Map();
  private readonly listeners: Map<string, Array<(msg: AgentMessage) => void>> = new Map();

  // ---- Channels ----

  createChannel(channel: MessageChannel): void {
    this.channels.set(channel.channelId, channel);
  }

  subscribe(channelId: string, agentId: string): boolean {
    const ch = this.channels.get(channelId);
    if (!ch) return false;
    if (!ch.subscribers.includes(agentId)) ch.subscribers.push(agentId);
    return true;
  }

  unsubscribe(channelId: string, agentId: string): void {
    const ch = this.channels.get(channelId);
    if (ch) ch.subscribers = ch.subscribers.filter((s) => s !== agentId);
  }

  getChannel(channelId: string): MessageChannel | undefined {
    return this.channels.get(channelId);
  }

  listChannels(): MessageChannel[] {
    return Array.from(this.channels.values());
  }

  // ---- Messaging ----

  /** Send a direct or broadcast message. Returns the message id. */
  send(msg: Omit<AgentMessage, 'id' | 'sentAt'>): string {
    const full: AgentMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sentAt: new Date().toISOString(),
    };
    this.messages.push(full);

    // Deliver to channel listeners
    const chListeners = this.listeners.get(full.channel) ?? [];
    for (const fn of chListeners) fn(full);

    // Trim
    if (this.messages.length > 10000) this.messages = this.messages.slice(-10000);

    return full.id;
  }

  /** Listen for messages on a specific channel. */
  on(channelId: string, handler: (msg: AgentMessage) => void): () => void {
    const list = this.listeners.get(channelId) ?? [];
    list.push(handler);
    this.listeners.set(channelId, list);
    return () => {
      const arr = this.listeners.get(channelId);
      if (arr) this.listeners.set(channelId, arr.filter((h) => h !== handler));
    };
  }

  getMessages(channelId?: string, limit = 100): AgentMessage[] {
    const src = channelId ? this.messages.filter((m) => m.channel === channelId) : this.messages;
    return src.slice(-limit);
  }

  getMessagesFor(agentId: string, limit = 100): AgentMessage[] {
    return this.messages.filter((m) => m.to === agentId || m.to === null).slice(-limit);
  }

  // ---- Negotiation ----

  startNegotiation(initiator: string, participants: string[], subject: string): NegotiationSession {
    const session: NegotiationSession = {
      id: `neg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      initiator,
      participants: [initiator, ...participants],
      subject,
      status: 'open',
      proposals: [],
      outcome: null,
      startedAt: new Date().toISOString(),
      closedAt: null,
    };
    this.negotiations.set(session.id, session);
    return session;
  }

  propose(sessionId: string, proposerId: string, terms: Record<string, unknown>): boolean {
    const s = this.negotiations.get(sessionId);
    if (s?.status !== 'open') return false;
    s.proposals.push({
      proposerId,
      terms,
      votes: { [proposerId]: 'accept' },
      proposedAt: new Date().toISOString(),
    });
    return true;
  }

  voteOnProposal(sessionId: string, proposalIdx: number, agentId: string, vote: 'accept' | 'reject' | 'abstain'): boolean {
    const s = this.negotiations.get(sessionId);
    if (s?.status !== 'open') return false;
    const p = s.proposals[proposalIdx];
    if (!p) return false;
    p.votes[agentId] = vote;

    // Auto-resolve: if majority accept
    const total = s.participants.length;
    const accepts = Object.values(p.votes).filter((v) => v === 'accept').length;
    const rejects = Object.values(p.votes).filter((v) => v === 'reject').length;
    if (accepts > total / 2) {
      s.status = 'agreed';
      s.outcome = p.terms;
      s.closedAt = new Date().toISOString();
    } else if (rejects > total / 2 && s.proposals.every((pr) => Object.values(pr.votes).filter((v) => v === 'reject').length > total / 2)) {
      s.status = 'failed';
      s.closedAt = new Date().toISOString();
    }
    return true;
  }

  getNegotiation(sessionId: string): NegotiationSession | undefined {
    return this.negotiations.get(sessionId);
  }

  getActiveNegotiations(): NegotiationSession[] {
    return Array.from(this.negotiations.values()).filter((n) => n.status === 'open');
  }

  // ---- Summary ----

  getSummary(): ProtocolSummary {
    const negs = Array.from(this.negotiations.values());
    return {
      totalMessages: this.messages.length,
      channels: this.channels.size,
      activeNegotiations: negs.filter((n) => n.status === 'open').length,
      completedNegotiations: negs.filter((n) => n.status === 'agreed' || n.status === 'failed').length,
    };
  }
}
