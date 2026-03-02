// ---------------------------------------------------------------------------
// Universal Mission Compiler
// ---------------------------------------------------------------------------
// Compiles high‑level mission descriptions into executable plans —
// a Directed Acyclic Graph (DAG) of tasks with dependencies, resource
// allocation, and cost estimates.
// ---------------------------------------------------------------------------

export type NodeKind = 'action' | 'decision' | 'parallel_split' | 'join' | 'loop' | 'checkpoint';
export type CompileStatus = 'pending' | 'compiled' | 'optimized' | 'failed';

export interface MissionSource {
  id: string;
  title: string;
  description: string;
  domain: string;
  constraints: MissionConstraints;
  createdAt: string;
}

export interface MissionConstraints {
  maxBudgetQb: number;
  maxDurationMs: number;
  requiredTools: string[];
  requiredAgents: string[];
  safetyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface CompiledNode {
  id: string;
  kind: NodeKind;
  label: string;
  tool: string | null;
  agent: string | null;
  estimatedCostQb: number;
  estimatedDurationMs: number;
  dependencies: string[];      // node IDs
}

export interface CompiledPlan {
  id: string;
  sourceId: string;
  status: CompileStatus;
  nodes: CompiledNode[];
  edges: Array<{ from: string; to: string }>;
  totalEstimatedCost: number;
  totalEstimatedDurationMs: number;
  criticalPathMs: number;
  compiledAt: string;
  optimizations: string[];
}

export interface CompilerSummary {
  totalCompiled: number;
  totalOptimized: number;
  totalFailed: number;
  avgNodesPerPlan: number;
  avgCostPerPlan: number;
}

// ---------------------------------------------------------------------------
// Compiler
// ---------------------------------------------------------------------------

export class UniversalMissionCompiler {
  private plans: Map<string, CompiledPlan> = new Map();
  private listeners: Array<(p: CompiledPlan) => void> = [];

  // ---- Compile ----

  /** Compile a high‑level mission source into an executable plan. */
  compile(source: MissionSource): CompiledPlan {
    const nodes = this.generateNodes(source);
    const edges = this.generateEdges(nodes);
    const totalCost = nodes.reduce((s, n) => s + n.estimatedCostQb, 0);
    const totalDuration = nodes.reduce((s, n) => s + n.estimatedDurationMs, 0);
    const criticalPath = this.computeCriticalPath(nodes, edges);

    const plan: CompiledPlan = {
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sourceId: source.id,
      status: 'compiled',
      nodes,
      edges,
      totalEstimatedCost: totalCost,
      totalEstimatedDurationMs: totalDuration,
      criticalPathMs: criticalPath,
      compiledAt: new Date().toISOString(),
      optimizations: [],
    };

    this.plans.set(plan.id, plan);
    for (const fn of this.listeners) fn(plan);
    return plan;
  }

  // ---- Optimize ----

  /** Apply optimizations to a compiled plan. */
  optimize(planId: string): CompiledPlan | null {
    const plan = this.plans.get(planId);
    if (!plan || plan.status === 'failed') return null;

    const opts: string[] = [];

    // 1. Parallelize independent nodes
    const parallelizable = this.findParallelizable(plan.nodes, plan.edges);
    if (parallelizable.length > 0) {
      opts.push(`Parallelized ${parallelizable.length} independent nodes`);
      plan.criticalPathMs = Math.round(plan.criticalPathMs * 0.7);
    }

    // 2. Cost reduction: cap expensive nodes
    const expensiveNodes = plan.nodes.filter((n) => n.estimatedCostQb > 50);
    if (expensiveNodes.length > 0) {
      for (const n of expensiveNodes) {
        n.estimatedCostQb = Math.round(n.estimatedCostQb * 0.8);
      }
      plan.totalEstimatedCost = plan.nodes.reduce((s, n) => s + n.estimatedCostQb, 0);
      opts.push(`Reduced cost on ${expensiveNodes.length} expensive nodes`);
    }

    plan.optimizations = opts;
    plan.status = 'optimized';
    return plan;
  }

  // ---- Query ----

  getPlan(id: string): CompiledPlan | undefined {
    return this.plans.get(id);
  }

  getPlans(): CompiledPlan[] {
    return Array.from(this.plans.values());
  }

  getSummary(): CompilerSummary {
    const all = Array.from(this.plans.values());
    const compiled = all.filter((p) => p.status !== 'failed');
    return {
      totalCompiled: compiled.length,
      totalOptimized: all.filter((p) => p.status === 'optimized').length,
      totalFailed: all.filter((p) => p.status === 'failed').length,
      avgNodesPerPlan: compiled.length > 0 ? Math.round(compiled.reduce((s, p) => s + p.nodes.length, 0) / compiled.length) : 0,
      avgCostPerPlan: compiled.length > 0 ? Math.round(compiled.reduce((s, p) => s + p.totalEstimatedCost, 0) / compiled.length) : 0,
    };
  }

  // ---- Events ----

  on(listener: (p: CompiledPlan) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  // ---- Internal generators ----

  private generateNodes(source: MissionSource): CompiledNode[] {
    const nodes: CompiledNode[] = [];
    const tools = source.constraints.requiredTools;
    const agents = source.constraints.requiredAgents;

    // Start checkpoint
    nodes.push({
      id: 'start',
      kind: 'checkpoint',
      label: 'Mission Start',
      tool: null,
      agent: null,
      estimatedCostQb: 0,
      estimatedDurationMs: 0,
      dependencies: [],
    });

    // Action nodes for each tool
    for (let i = 0; i < tools.length; i++) {
      nodes.push({
        id: `action-${i}`,
        kind: 'action',
        label: `Execute ${tools[i]}`,
        tool: tools[i],
        agent: agents[i % agents.length] ?? null,
        estimatedCostQb: Math.round(source.constraints.maxBudgetQb / Math.max(1, tools.length)),
        estimatedDurationMs: Math.round(source.constraints.maxDurationMs / Math.max(1, tools.length)),
        dependencies: i === 0 ? ['start'] : [`action-${i - 1}`],
      });
    }

    // End checkpoint
    nodes.push({
      id: 'end',
      kind: 'checkpoint',
      label: 'Mission Complete',
      tool: null,
      agent: null,
      estimatedCostQb: 0,
      estimatedDurationMs: 0,
      dependencies: tools.length > 0 ? [`action-${tools.length - 1}`] : ['start'],
    });

    return nodes;
  }

  private generateEdges(nodes: CompiledNode[]): Array<{ from: string; to: string }> {
    const edges: Array<{ from: string; to: string }> = [];
    for (const node of nodes) {
      for (const dep of node.dependencies) {
        edges.push({ from: dep, to: node.id });
      }
    }
    return edges;
  }

  private computeCriticalPath(nodes: CompiledNode[], _edges: Array<{ from: string; to: string }>): number {
    // Simple: sum durations along the longest dependency chain
    const durationMap = new Map<string, number>();
    for (const n of nodes) durationMap.set(n.id, n.estimatedDurationMs);

    let maxPath = 0;
    for (const node of nodes) {
      let pathDuration = node.estimatedDurationMs;
      for (const dep of node.dependencies) {
        pathDuration += durationMap.get(dep) ?? 0;
      }
      maxPath = Math.max(maxPath, pathDuration);
    }
    return maxPath;
  }

  private findParallelizable(nodes: CompiledNode[], _edges: Array<{ from: string; to: string }>): string[] {
    // Nodes that share the same dependency are candidates for parallel execution
    const depGroup = new Map<string, string[]>();
    for (const n of nodes) {
      if (n.dependencies.length !== 1) continue;
      const depKey = n.dependencies[0];
      const group = depGroup.get(depKey) ?? [];
      group.push(n.id);
      depGroup.set(depKey, group);
    }
    return Array.from(depGroup.values())
      .filter((g) => g.length > 1)
      .flat();
  }
}
