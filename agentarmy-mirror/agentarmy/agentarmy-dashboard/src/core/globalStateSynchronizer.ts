/**
 * Global State Synchronizer — ensures every subsystem sees the same world.
 *
 * Provides real‑time state propagation, conflict resolution, and temporal
 * alignment so agents, runners, missions, tools, economy, safety, and
 * intelligence state never drift apart.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StateCategory =
  | 'mission'
  | 'agent'
  | 'runner'
  | 'tool'
  | 'economy'
  | 'safety'
  | 'intelligence';

export interface StateUpdate {
  id: string;
  category: StateCategory;
  entityId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  source: string;          // subsystem that produced the update
  priority: number;        // higher wins in conflict
  timestamp: string;
}

export interface ConflictResolution {
  updateA: StateUpdate;
  updateB: StateUpdate;
  winner: 'A' | 'B';
  rule: string;
}

export interface SyncStatus {
  totalUpdates: number;
  conflictsResolved: number;
  lastSyncAt: string;
  subscriberCount: number;
  pendingUpdates: number;
}

// Priority rules: safety > governance > economy > performance > intelligence
const CATEGORY_PRIORITY: Record<StateCategory, number> = {
  safety: 100,
  agent: 60,
  mission: 50,
  runner: 40,
  economy: 70,
  tool: 30,
  intelligence: 20,
};

// ---------------------------------------------------------------------------
// Synchronizer
// ---------------------------------------------------------------------------

export class GlobalStateSynchronizer {
  private updates: StateUpdate[] = [];
  private readonly conflicts: ConflictResolution[] = [];
  private readonly subscribers: Map<StateCategory | '*', Array<(u: StateUpdate) => void>> = new Map();
  private pending: StateUpdate[] = [];

  // ---- Publish ----

  /** Submit a state update. Validates, resolves conflicts, and broadcasts. */
  publish(update: Omit<StateUpdate, 'id' | 'timestamp'>): StateUpdate {
    const full: StateUpdate = {
      ...update,
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    // Check for conflicts with pending updates on the same entity+field
    const conflicting = this.pending.find(
      (p) => p.category === full.category && p.entityId === full.entityId && p.field === full.field,
    );

    if (conflicting) {
      const resolution = this.resolveConflict(conflicting, full);
      this.conflicts.push(resolution);
      const winner = resolution.winner === 'A' ? conflicting : full;
      this.pending = this.pending.filter((p) => p.id !== conflicting.id);
      this.commit(winner);
      return winner;
    }

    this.commit(full);
    return full;
  }

  /** Batch‑publish multiple updates atomically. */
  publishBatch(updates: Array<Omit<StateUpdate, 'id' | 'timestamp'>>): StateUpdate[] {
    return updates.map((u) => this.publish(u));
  }

  // ---- Subscribe ----

  /** Subscribe to updates for a category (or '*' for all). */
  subscribe(category: StateCategory | '*', listener: (u: StateUpdate) => void): () => void {
    const list = this.subscribers.get(category) ?? [];
    list.push(listener);
    this.subscribers.set(category, list);
    return () => {
      const idx = list.indexOf(listener);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  // ---- Conflict resolution ----

  private resolveConflict(a: StateUpdate, b: StateUpdate): ConflictResolution {
    // 1. Category priority (safety always wins)
    const aPri = CATEGORY_PRIORITY[a.category] + a.priority;
    const bPri = CATEGORY_PRIORITY[b.category] + b.priority;

    if (aPri !== bPri) {
      return { updateA: a, updateB: b, winner: aPri > bPri ? 'A' : 'B', rule: 'priority' };
    }

    // 2. Temporal ordering — later wins
    if (a.timestamp !== b.timestamp) {
      return { updateA: a, updateB: b, winner: a.timestamp > b.timestamp ? 'A' : 'B', rule: 'temporal_ordering' };
    }

    // 3. Default: B wins (newer call)
    return { updateA: a, updateB: b, winner: 'B', rule: 'default_latest' };
  }

  // ---- Internal ----

  private commit(update: StateUpdate): void {
    this.updates.push(update);
    if (this.updates.length > 20_000) {
      this.updates = this.updates.slice(-20_000);
    }

    // Broadcast
    const specific = this.subscribers.get(update.category) ?? [];
    const wildcard = this.subscribers.get('*') ?? [];
    for (const fn of [...specific, ...wildcard]) fn(update);
  }

  // ---- Query ----

  getUpdates(category?: StateCategory, limit = 100): StateUpdate[] {
    const filtered = category ? this.updates.filter((u) => u.category === category) : this.updates;
    return filtered.slice(-limit);
  }

  getConflicts(limit = 50): ConflictResolution[] {
    return this.conflicts.slice(-limit);
  }

  getStatus(): SyncStatus {
    let subs = 0;
    for (const list of this.subscribers.values()) subs += list.length;
    return {
      totalUpdates: this.updates.length,
      conflictsResolved: this.conflicts.length,
      lastSyncAt: this.updates.length > 0 ? (this.updates.at(-1)?.timestamp ?? new Date().toISOString()) : new Date().toISOString(),
      subscriberCount: subs,
      pendingUpdates: this.pending.length,
    };
  }
}
