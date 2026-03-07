// ---------------------------------------------------------------------------
// Interoperability & External Systems Bridge
// ---------------------------------------------------------------------------
// Manages connections to external systems (APIs, webhooks, message queues,
// file systems). Provides a unified adapter pattern for ingress/egress data
// flowing between AgentArmy and the outside world.
// ---------------------------------------------------------------------------

export type AdapterKind = 'rest_api' | 'webhook' | 'message_queue' | 'file_system' | 'database' | 'custom';
export type AdapterStatus = 'connected' | 'disconnected' | 'degraded' | 'error';
export type DataDirection = 'inbound' | 'outbound' | 'bidirectional';

export interface ExternalAdapter {
  id: string;
  name: string;
  kind: AdapterKind;
  endpoint: string;
  direction: DataDirection;
  status: AdapterStatus;
  authMethod: string;
  retryPolicy: RetryPolicy;
  lastActivityAt: string | null;
  createdAt: string;
  metadata: Record<string, string>;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
}

export interface BridgeMessage {
  id: string;
  adapterId: string;
  direction: DataDirection;
  payload: unknown;
  status: 'pending' | 'sent' | 'received' | 'failed';
  attempt: number;
  error: string | null;
  timestamp: string;
}

export interface TransformRule {
  id: string;
  adapterId: string;
  direction: DataDirection;
  description: string;
  /** A simple field mapping: sourceField -> targetField */
  fieldMap: Record<string, string>;
}

export interface BridgeSummary {
  totalAdapters: number;
  connected: number;
  disconnected: number;
  errored: number;
  totalMessages: number;
  failedMessages: number;
  totalTransformRules: number;
}

// ---------------------------------------------------------------------------
// Bridge
// ---------------------------------------------------------------------------

export class InteroperabilityBridge {
  private readonly adapters: Map<string, ExternalAdapter> = new Map();
  private readonly messages: BridgeMessage[] = [];
  private readonly transforms: TransformRule[] = [];
  private listeners: Array<(msg: BridgeMessage) => void> = [];

  // ---- Adapters ----

  registerAdapter(adapter: Omit<ExternalAdapter, 'createdAt' | 'lastActivityAt'>): ExternalAdapter {
    const full: ExternalAdapter = {
      ...adapter,
      lastActivityAt: null,
      createdAt: new Date().toISOString(),
    };
    this.adapters.set(full.id, full);
    return full;
  }

  removeAdapter(adapterId: string): boolean {
    return this.adapters.delete(adapterId);
  }

  getAdapter(id: string): ExternalAdapter | undefined {
    return this.adapters.get(id);
  }

  getAdapters(): ExternalAdapter[] {
    return Array.from(this.adapters.values());
  }

  updateStatus(adapterId: string, status: AdapterStatus): void {
    const a = this.adapters.get(adapterId);
    if (a) a.status = status;
  }

  // ---- Messaging ----

  /** Send a message through an adapter (simulated). */
  send(adapterId: string, payload: unknown): BridgeMessage {
    const adapter = this.adapters.get(adapterId);
    const msg: BridgeMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      adapterId,
      direction: 'outbound',
      payload: this.applyTransform(adapterId, 'outbound', payload),
      status: adapter?.status === 'connected' ? 'sent' : 'failed',
      attempt: 1,
      error: adapter?.status === 'connected' ? null : `Adapter ${adapterId} not connected`,
      timestamp: new Date().toISOString(),
    };

    if (adapter) adapter.lastActivityAt = msg.timestamp;
    this.messages.push(msg);
    for (const fn of this.listeners) fn(msg);

    // Retry logic (simulated)
    if (msg.status === 'failed' && adapter) {
      this.retryMessage(msg, adapter);
    }

    return msg;
  }

  /** Receive a message from an adapter (simulated ingress). */
  receive(adapterId: string, payload: unknown): BridgeMessage {
    const adapter = this.adapters.get(adapterId);
    const msg: BridgeMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      adapterId,
      direction: 'inbound',
      payload: this.applyTransform(adapterId, 'inbound', payload),
      status: 'received',
      attempt: 1,
      error: null,
      timestamp: new Date().toISOString(),
    };

    if (adapter) adapter.lastActivityAt = msg.timestamp;
    this.messages.push(msg);
    for (const fn of this.listeners) fn(msg);
    return msg;
  }

  getMessages(adapterId?: string, limit = 100): BridgeMessage[] {
    const filtered = adapterId ? this.messages.filter((m) => m.adapterId === adapterId) : this.messages;
    return filtered.slice(-limit);
  }

  // ---- Transforms ----

  addTransformRule(rule: TransformRule): void {
    this.transforms.push(rule);
  }

  getTransformRules(adapterId?: string): TransformRule[] {
    return adapterId ? this.transforms.filter((t) => t.adapterId === adapterId) : [...this.transforms];
  }

  // ---- Summary ----

  getSummary(): BridgeSummary {
    const adapters = Array.from(this.adapters.values());
    return {
      totalAdapters: adapters.length,
      connected: adapters.filter((a) => a.status === 'connected').length,
      disconnected: adapters.filter((a) => a.status === 'disconnected').length,
      errored: adapters.filter((a) => a.status === 'error').length,
      totalMessages: this.messages.length,
      failedMessages: this.messages.filter((m) => m.status === 'failed').length,
      totalTransformRules: this.transforms.length,
    };
  }

  // ---- Events ----

  on(listener: (msg: BridgeMessage) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  // ---- Internals ----

  private retryMessage(msg: BridgeMessage, adapter: ExternalAdapter): void {
    const policy = adapter.retryPolicy;
    for (let attempt = 2; attempt <= policy.maxRetries + 1; attempt++) {
      // In a real system this would be async with backoff; here we simulate
      msg.attempt = attempt;
      if (adapter.status === 'connected') {
        msg.status = 'sent';
        msg.error = null;
        break;
      }
    }
  }

  private applyTransform(adapterId: string, direction: DataDirection, payload: unknown): unknown {
    const rules = this.transforms.filter(
      (t) => t.adapterId === adapterId && (t.direction === direction || t.direction === 'bidirectional'),
    );
    if (rules.length === 0 || typeof payload !== 'object' || payload === null) return payload;

    let result = { ...(payload as Record<string, unknown>) };
    for (const rule of rules) {
      const mapped: Record<string, unknown> = {};
      for (const [src, dest] of Object.entries(rule.fieldMap)) {
        if (src in result) {
          mapped[dest] = result[src];
        }
      }
      result = { ...result, ...mapped };
    }
    return result;
  }
}
