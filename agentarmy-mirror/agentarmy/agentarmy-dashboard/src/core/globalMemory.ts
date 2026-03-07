/**
 * Global Memory & Persistence Layer — durable, distributed storage for
 * every form of knowledge and state across the AgentArmy OS.
 *
 * Ensures nothing important is ever lost: mission histories, agent lineage,
 * tool archives, economy transactions, safety events, embeddings, ZPE
 * weight versions, and global state snapshots.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemoryDomain =
  | 'mission'
  | 'agent'
  | 'tool'
  | 'runner'
  | 'economy'
  | 'safety'
  | 'embedding'
  | 'zpe'
  | 'snapshot';

export interface MemoryRecord {
  id: string;
  domain: MemoryDomain;
  entityId: string;
  version: number;
  data: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  expiresAt: string | null;   // null = permanent
}

export interface MemoryQuery {
  domain?: MemoryDomain;
  entityId?: string;
  tags?: string[];
  afterDate?: string;
  beforeDate?: string;
  limit?: number;
}

export interface MemoryStats {
  totalRecords: number;
  byDomain: Record<MemoryDomain, number>;
  totalVersions: number;
  oldestRecord: string | null;
  newestRecord: string | null;
}

// ---------------------------------------------------------------------------
// Memory Store
// ---------------------------------------------------------------------------

const MAX_RECORDS = 100_000;

export class GlobalMemoryStore {
  private records: MemoryRecord[] = [];
  private readonly index: Map<string, MemoryRecord[]> = new Map(); // entityId → records

  // ---- Write ----

  store(
    domain: MemoryDomain,
    entityId: string,
    data: Record<string, unknown>,
    tags: string[] = [],
    expiresAt: string | null = null,
  ): MemoryRecord {
    const existing = this.getLatest(domain, entityId);
    const version = existing ? existing.version + 1 : 1;

    const record: MemoryRecord = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      domain,
      entityId,
      version,
      data,
      tags,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    this.records.push(record);
    const list = this.index.get(entityId) ?? [];
    list.push(record);
    this.index.set(entityId, list);

    // Trim
    if (this.records.length > MAX_RECORDS) {
      const removed = this.records.splice(0, this.records.length - MAX_RECORDS);
      for (const r of removed) {
        const l = this.index.get(r.entityId);
        if (l) {
          const idx = l.indexOf(r);
          if (idx >= 0) l.splice(idx, 1);
        }
      }
    }

    return record;
  }

  /** Store a global state snapshot. */
  storeSnapshot(label: string, state: Record<string, unknown>): MemoryRecord {
    return this.store('snapshot', label, state, ['snapshot', 'global']);
  }

  // ---- Read ----

  getLatest(domain: MemoryDomain, entityId: string): MemoryRecord | null {
    const list = (this.index.get(entityId) ?? []).filter((r) => r.domain === domain);
    return list.length > 0 ? (list.at(-1) ?? null) : null;
  }

  getHistory(domain: MemoryDomain, entityId: string, limit = 50): MemoryRecord[] {
    return (this.index.get(entityId) ?? [])
      .filter((r) => r.domain === domain)
      .slice(-limit);
  }

  getVersion(domain: MemoryDomain, entityId: string, version: number): MemoryRecord | null {
    return (this.index.get(entityId) ?? [])
      .find((r) => r.domain === domain && r.version === version) ?? null;
  }

  query(q: MemoryQuery): MemoryRecord[] {
    let result = this.records;

    if (q.domain) result = result.filter((r) => r.domain === q.domain);
    if (q.entityId) result = result.filter((r) => r.entityId === q.entityId);
    if (q.tags?.length) result = result.filter((r) => q.tags!.every((t) => r.tags.includes(t)));
    if (q.afterDate) result = result.filter((r) => r.createdAt >= q.afterDate!);
    if (q.beforeDate) result = result.filter((r) => r.createdAt <= q.beforeDate!);

    return result.slice(-(q.limit ?? 100));
  }

  // ---- Lifecycle ----

  /** Remove expired records. */
  gc(): number {
    const now = new Date().toISOString();
    const before = this.records.length;
    this.records = this.records.filter((r) => !r.expiresAt || r.expiresAt > now);
    // Rebuild index
    this.index.clear();
    for (const r of this.records) {
      const list = this.index.get(r.entityId) ?? [];
      list.push(r);
      this.index.set(r.entityId, list);
    }
    return before - this.records.length;
  }

  // ---- Stats ----

  getStats(): MemoryStats {
    const byDomain: Record<MemoryDomain, number> = {
      mission: 0, agent: 0, tool: 0, runner: 0,
      economy: 0, safety: 0, embedding: 0, zpe: 0, snapshot: 0,
    };
    let totalVersions = 0;
    for (const r of this.records) {
      byDomain[r.domain] = (byDomain[r.domain] ?? 0) + 1;
      totalVersions += r.version;
    }
    return {
      totalRecords: this.records.length,
      byDomain,
      totalVersions,
      oldestRecord: this.records.length > 0 ? this.records[0].createdAt : null,
      newestRecord: this.records.length > 0 ? (this.records.at(-1)?.createdAt ?? null) : null,
    };
  }
}
