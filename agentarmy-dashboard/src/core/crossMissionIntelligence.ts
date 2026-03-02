/**
 * Cross‑Mission Intelligence Layer — discovers patterns across all missions.
 *
 * The "collective intelligence" of AgentArmy. Learns common structures,
 * high-performing toolchains, recurring failures, domain best practices,
 * optimal branching patterns, cost curves, safety clusters, and agent
 * specialization trajectories from every mission ever run.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MissionPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;           // how many missions matched
  avgPerformance: number;      // 0‑1
  avgCost: number;
  avgSafetyScore: number;
  domains: string[];
  tags: string[];
  discoveredAt: string;
}

export interface ToolchainPattern {
  id: string;
  tools: string[];
  successRate: number;
  avgLatencyMs: number;
  avgCost: number;
  domains: string[];
  usageCount: number;
}

export interface FailurePattern {
  id: string;
  signature: string;
  frequency: number;
  domains: string[];
  commonCause: string;
  suggestedFix: string;
  lastSeen: string;
}

export interface DomainBestPractice {
  domain: string;
  recommendedTools: string[];
  recommendedAgents: string[];
  optimalBudgetRange: [number, number];
  safetyPosture: string;
  avgCompletionTimeMs: number;
  sampleSize: number;
}

export interface CrossMissionSummary {
  totalPatterns: number;
  totalToolchains: number;
  totalFailurePatterns: number;
  totalDomains: number;
  topPatterns: MissionPattern[];
  topToolchains: ToolchainPattern[];
  topFailures: FailurePattern[];
}

export interface MissionRecord {
  missionId: string;
  domain: string;
  tools: string[];
  agents: string[];
  success: boolean;
  durationMs: number;
  costQb: number;
  safetyScore: number;
  branchCount: number;
  loopCount: number;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Intelligence Engine
// ---------------------------------------------------------------------------

export class CrossMissionIntelligence {
  private static readonly MAX_RECORDS = 50000;

  private records: MissionRecord[] = [];
  private patterns: MissionPattern[] = [];
  private toolchains: ToolchainPattern[] = [];
  private failures: FailurePattern[] = [];

  /** Compute the arithmetic mean of a numeric property across records. */
  private static mean(recs: MissionRecord[], accessor: (r: MissionRecord) => number): number {
    const sum = recs.reduce((s, r) => s + accessor(r), 0);
    return sum / recs.length;
  }

  // ---- Ingest ----

  /** Record a completed mission for cross-mission learning. */
  ingest(record: MissionRecord): void {
    this.records.push(record);
    const max = CrossMissionIntelligence.MAX_RECORDS;
    if (this.records.length > max) {
      this.records = this.records.slice(-max);
    }
  }

  ingestBatch(records: MissionRecord[]): void {
    for (const r of records) this.ingest(r);
  }

  // ---- Analysis ----

  /** Re-analyze all records to discover/update patterns. */
  analyze(): CrossMissionSummary {
    this.discoverMissionPatterns();
    this.discoverToolchainPatterns();
    this.discoverFailurePatterns();

    return this.getSummary();
  }

  private discoverMissionPatterns(): void {
    // Group by domain and identify common structures
    const byDomain = new Map<string, MissionRecord[]>();
    for (const r of this.records) {
      if (!byDomain.has(r.domain)) byDomain.set(r.domain, []);
      byDomain.get(r.domain)!.push(r);
    }

    this.patterns = [];
    for (const [domain, recs] of Array.from(byDomain)) {
      if (recs.length <= 1) continue;
      const successes = recs.filter((r: MissionRecord) => r.success);
      const avgPerf = successes.length / recs.length;
      const avgCost = CrossMissionIntelligence.mean(recs, (r) => r.costQb);
      const avgSafety = CrossMissionIntelligence.mean(recs, (r) => r.safetyScore);

      this.patterns.push({
        id: `pat-${domain}-${Date.now()}`,
        name: `${domain} pattern`,
        description: `Common mission pattern in ${domain} domain`,
        frequency: recs.length,
        avgPerformance: Number(avgPerf.toFixed(3)),
        avgCost: Number(avgCost.toFixed(2)),
        avgSafetyScore: Number(avgSafety.toFixed(3)),
        domains: [domain],
        tags: Array.from(new Set(recs.flatMap((r: MissionRecord) => r.tags))).slice(0, 10),
        discoveredAt: new Date().toISOString(),
      });
    }

    this.patterns.sort((a, b) => Math.sign(b.frequency - a.frequency));
  }

  private discoverToolchainPatterns(): void {
    const chainMap = new Map<string, { tools: string[]; successes: number; total: number; latency: number; cost: number; domains: Set<string> }>();

    for (const r of this.records) {
      const key = [...r.tools].sort((a, b) => a.localeCompare(b)).join('|');
      if (!chainMap.has(key)) chainMap.set(key, { tools: r.tools, successes: 0, total: 0, latency: 0, cost: 0, domains: new Set() });
      const entry = chainMap.get(key)!;
      entry.total += 1;
      if (r.success) entry.successes += 1;
      entry.latency += r.durationMs;
      entry.cost += r.costQb;
      entry.domains.add(r.domain);
    }

    this.toolchains = [...chainMap.values()]
      .filter((e) => e.total > 1)
      .map((e) => ({
        id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tools: e.tools,
        successRate: Number((e.successes / e.total).toFixed(3)),
        avgLatencyMs: Math.round(e.latency / e.total),
        avgCost: Number((e.cost / e.total).toFixed(2)),
        domains: [...e.domains],
        usageCount: e.total,
      }))
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  private discoverFailurePatterns(): void {
    const failedRecords = this.records.filter((r) => !r.success);
    const sigMap = new Map<string, { count: number; domains: Set<string>; lastSeen: string }>();

    for (const r of failedRecords) {
      const sig = `${r.domain}:${r.tools.join(',')}`;
      const entry = sigMap.get(sig) ?? { count: 0, domains: new Set(), lastSeen: '' };
      entry.count += 1;
      entry.domains.add(r.domain);
      entry.lastSeen = new Date().toISOString();
      sigMap.set(sig, entry);
    }

    this.failures = [...sigMap.entries()]
      .filter(([, e]) => e.count >= 2)
      .map(([sig, e]) => ({
        id: `fail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        signature: sig,
        frequency: e.count,
        domains: [...e.domains],
        commonCause: 'Repeated failure with same tool combination',
        suggestedFix: 'Consider tool substitution or domain-specific safety review',
        lastSeen: e.lastSeen,
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  // ---- Queries ----

  getDomainBestPractices(domain: string): DomainBestPractice | null {
    const recs = this.records.filter((r) => r.domain === domain);
    if (recs.length < 3) return null;

    const successes = recs.filter((r) => r.success);
    const toolCounts = new Map<string, number>();
    const agentCounts = new Map<string, number>();
    for (const r of successes) {
      for (const t of r.tools) toolCounts.set(t, (toolCounts.get(t) ?? 0) + 1);
      for (const a of r.agents) agentCounts.set(a, (agentCounts.get(a) ?? 0) + 1);
    }

    const costs = recs.map((r) => r.costQb).sort((a, b) => a - b);
    const p25 = costs[Math.floor(costs.length * 0.25)] ?? 0;
    const p75 = costs[Math.floor(costs.length * 0.75)] ?? 100;

    return {
      domain,
      recommendedTools: [...toolCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t),
      recommendedAgents: [...agentCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a),
      optimalBudgetRange: [Number(p25.toFixed(2)), Number(p75.toFixed(2))],
      safetyPosture: 'normal',
      avgCompletionTimeMs: Math.round(recs.reduce((s, r) => s + r.durationMs, 0) / recs.length),
      sampleSize: recs.length,
    };
  }

  getRecommendedToolchain(domain: string): ToolchainPattern | null {
    const candidates = this.toolchains.filter((t) => t.domains.includes(domain));
    if (candidates.length === 0) return null;
    // Best = highest success rate, then lowest cost
    candidates.sort((a, b) => b.successRate - a.successRate || a.avgCost - b.avgCost);
    return candidates[0];
  }

  predictMissionSuccess(domain: string, tools: string[]): number {
    const similar = this.records.filter(
      (r) => r.domain === domain && tools.some((t) => r.tools.includes(t)),
    );
    if (similar.length === 0) return 0.5; // no data
    return similar.filter((r) => r.success).length / similar.length;
  }

  // ---- Summary ----

  getSummary(): CrossMissionSummary {
    return {
      totalPatterns: this.patterns.length,
      totalToolchains: this.toolchains.length,
      totalFailurePatterns: this.failures.length,
      totalDomains: new Set(this.records.map((r) => r.domain)).size,
      topPatterns: this.patterns.slice(0, 10),
      topToolchains: this.toolchains.slice(0, 10),
      topFailures: this.failures.slice(0, 10),
    };
  }

  getPatterns(): MissionPattern[] { return [...this.patterns]; }
  getToolchains(): ToolchainPattern[] { return [...this.toolchains]; }
  getFailures(): FailurePattern[] { return [...this.failures]; }
  getRecordCount(): number { return this.records.length; }
}
