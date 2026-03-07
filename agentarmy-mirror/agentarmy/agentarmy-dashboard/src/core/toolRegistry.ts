/**
 * Tool Registry — global tool and capability catalog for the entire OS.
 *
 * Maintains a searchable registry of every tool available across all runners,
 * tenants, and domains. Tracks tool metadata, versioning, compatibility,
 * usage statistics, and deprecation lifecycle.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolStatus = 'active' | 'deprecated' | 'experimental' | 'disabled' | 'archived';

export type ToolCategory =
  | 'code'
  | 'data'
  | 'search'
  | 'communication'
  | 'analysis'
  | 'generation'
  | 'transformation'
  | 'safety'
  | 'governance'
  | 'infrastructure';

export interface ToolCapability {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface ToolEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  category: ToolCategory;
  status: ToolStatus;
  capabilities: ToolCapability[];
  compatibleRunners: string[];
  domains: string[];
  tags: string[];
  avgLatencyMs: number;
  avgCost: number;
  successRate: number;
  usageCount: number;
  registeredAt: string;
  updatedAt: string;
  deprecatedAt: string | null;
  owner: string;
}

export interface ToolDependency {
  toolId: string;
  dependsOn: string[];
  conflictsWith: string[];
}

export interface ToolSearchQuery {
  category?: ToolCategory;
  status?: ToolStatus;
  domain?: string;
  tags?: string[];
  minSuccessRate?: number;
  maxLatencyMs?: number;
  maxCost?: number;
  runnerId?: string;
  text?: string;
}

export interface ToolRegistrySummary {
  totalTools: number;
  activeTools: number;
  deprecatedTools: number;
  byCategory: Record<string, number>;
  avgSuccessRate: number;
  avgLatencyMs: number;
  topUsed: Array<{ id: string; name: string; usageCount: number }>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export class ToolRegistry {
  private readonly tools: Map<string, ToolEntry> = new Map();
  private readonly dependencies: Map<string, ToolDependency> = new Map();
  private listeners: Array<(event: string, tool: ToolEntry) => void> = [];

  // ---- Registration ----

  register(tool: ToolEntry): void {
    this.tools.set(tool.id, { ...tool, registeredAt: new Date().toISOString() });
    this.emit('registered', tool);
  }

  update(toolId: string, patch: Partial<ToolEntry>): ToolEntry | null {
    const existing = this.tools.get(toolId);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.tools.set(toolId, updated);
    this.emit('updated', updated);
    return updated;
  }

  deprecate(toolId: string): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) return false;
    tool.status = 'deprecated';
    tool.deprecatedAt = new Date().toISOString();
    this.emit('deprecated', tool);
    return true;
  }

  remove(toolId: string): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) return false;
    this.tools.delete(toolId);
    this.dependencies.delete(toolId);
    this.emit('removed', tool);
    return true;
  }

  get(toolId: string): ToolEntry | undefined {
    return this.tools.get(toolId);
  }

  // ---- Dependencies ----

  setDependencies(dep: ToolDependency): void {
    this.dependencies.set(dep.toolId, dep);
  }

  getDependencies(toolId: string): ToolDependency | undefined {
    return this.dependencies.get(toolId);
  }

  checkConflicts(toolIds: string[]): string[] {
    const conflicts: string[] = [];
    for (const id of toolIds) {
      const dep = this.dependencies.get(id);
      if (!dep) continue;
      for (const conflictId of dep.conflictsWith) {
        if (toolIds.includes(conflictId)) {
          conflicts.push(`${id} conflicts with ${conflictId}`);
        }
      }
    }
    return conflicts;
  }

  // ---- Search ----

  search(query: ToolSearchQuery): ToolEntry[] {
    let results = Array.from(this.tools.values());

    if (query.category) results = results.filter(t => t.category === query.category);
    if (query.status) results = results.filter(t => t.status === query.status);
    if (query.domain) results = results.filter(t => t.domains.includes(query.domain!));
    if (query.tags?.length) {
      results = results.filter(t => query.tags!.some(tag => t.tags.includes(tag)));
    }
    if (query.minSuccessRate != null) results = results.filter(t => t.successRate >= query.minSuccessRate!);
    if (query.maxLatencyMs != null) results = results.filter(t => t.avgLatencyMs <= query.maxLatencyMs!);
    if (query.maxCost != null) results = results.filter(t => t.avgCost <= query.maxCost!);
    if (query.runnerId) results = results.filter(t => t.compatibleRunners.includes(query.runnerId!));
    if (query.text) {
      const lower = query.text.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower),
      );
    }

    return results;
  }

  findByCapability(capabilityName: string): ToolEntry[] {
    return Array.from(this.tools.values()).filter(t =>
      t.capabilities.some(c => c.name === capabilityName),
    );
  }

  // ---- Statistics ----

  recordUsage(toolId: string, latencyMs: number, cost: number, success: boolean): void {
    const tool = this.tools.get(toolId);
    if (!tool) return;
    const prevTotal = tool.usageCount;
    tool.usageCount += 1;
    tool.avgLatencyMs = (tool.avgLatencyMs * prevTotal + latencyMs) / tool.usageCount;
    tool.avgCost = (tool.avgCost * prevTotal + cost) / tool.usageCount;
    tool.successRate = (tool.successRate * prevTotal + (success ? 1 : 0)) / tool.usageCount;
  }

  getSummary(): ToolRegistrySummary {
    const all = Array.from(this.tools.values());
    const byCategory: Record<string, number> = {};
    let totalSuccessRate = 0;
    let totalLatency = 0;

    for (const t of all) {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
      totalSuccessRate += t.successRate;
      totalLatency += t.avgLatencyMs;
    }

    const topUsed = [...all]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(t => ({ id: t.id, name: t.name, usageCount: t.usageCount }));

    return {
      totalTools: all.length,
      activeTools: all.filter(t => t.status === 'active').length,
      deprecatedTools: all.filter(t => t.status === 'deprecated').length,
      byCategory,
      avgSuccessRate: all.length ? totalSuccessRate / all.length : 0,
      avgLatencyMs: all.length ? totalLatency / all.length : 0,
      topUsed,
    };
  }

  // ---- Events ----

  onEvent(fn: (event: string, tool: ToolEntry) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private emit(event: string, tool: ToolEntry): void {
    for (const fn of this.listeners) fn(event, tool);
  }
}

// ---------------------------------------------------------------------------
// Bootstrap — default tools
// ---------------------------------------------------------------------------

export function createDefaultTools(): ToolEntry[] {
  const now = new Date().toISOString();
  const base = {
    version: '1.0.0',
    status: 'active' as ToolStatus,
    compatibleRunners: ['local-dev', 'cloud-primary'],
    domains: ['general'],
    tags: [],
    avgLatencyMs: 100,
    avgCost: 0.001,
    successRate: 0.95,
    usageCount: 0,
    registeredAt: now,
    updatedAt: now,
    deprecatedAt: null,
    owner: 'system',
  };

  return [
    { ...base, id: 'tool-code-exec', name: 'Code Executor', description: 'Execute sandboxed code snippets', category: 'code' as ToolCategory, capabilities: [{ name: 'execute_code', description: 'Run code in sandbox', inputSchema: {}, outputSchema: {} }] },
    { ...base, id: 'tool-web-search', name: 'Web Search', description: 'Search the web for information', category: 'search' as ToolCategory, capabilities: [{ name: 'web_search', description: 'Query search engine', inputSchema: {}, outputSchema: {} }] },
    { ...base, id: 'tool-data-transform', name: 'Data Transformer', description: 'Transform structured data', category: 'transformation' as ToolCategory, capabilities: [{ name: 'transform_data', description: 'Apply transformations', inputSchema: {}, outputSchema: {} }] },
    { ...base, id: 'tool-text-gen', name: 'Text Generator', description: 'Generate text content via LLM', category: 'generation' as ToolCategory, capabilities: [{ name: 'generate_text', description: 'Produce text', inputSchema: {}, outputSchema: {} }] },
    { ...base, id: 'tool-analysis', name: 'Data Analyzer', description: 'Statistical and semantic analysis', category: 'analysis' as ToolCategory, capabilities: [{ name: 'analyze_data', description: 'Run analysis', inputSchema: {}, outputSchema: {} }] },
    { ...base, id: 'tool-safety-scan', name: 'Safety Scanner', description: 'Content safety and policy check', category: 'safety' as ToolCategory, capabilities: [{ name: 'scan_safety', description: 'Check content safety', inputSchema: {}, outputSchema: {} }] },
  ];
}
