// ---------------------------------------------------------------------------
// Substrate‑Agnostic Execution Layer  (Layer 33)
// ---------------------------------------------------------------------------
// Abstracts the underlying compute substrate so the OS can run on CPUs,
// GPUs, TPUs, neuromorphic chips, quantum accelerators, distributed swarms,
// or future architectures.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type SubstrateType =
  | 'cpu'
  | 'gpu'
  | 'tpu'
  | 'neuromorphic'
  | 'quantum'
  | 'fpga'
  | 'distributed-swarm'
  | 'hybrid'
  | 'unknown';

export type SubstrateHealth = 'healthy' | 'degraded' | 'offline' | 'migrating';

export interface SubstrateNode {
  readonly id: string;
  readonly type: SubstrateType;
  readonly label: string;
  readonly capacityUnits: number;      // abstract FLOPS-equivalent
  readonly usedUnits: number;
  readonly health: SubstrateHealth;
  readonly region: string;
  readonly registeredAt: string;
  readonly lastHeartbeat: string;
}

export interface SubstrateAllocation {
  readonly id: string;
  readonly missionId: string;
  readonly nodeId: string;
  readonly unitsAllocated: number;
  readonly allocatedAt: string;
  readonly releasedAt: string | null;
}

export interface MigrationEvent {
  readonly id: string;
  readonly missionId: string;
  readonly fromNode: string;
  readonly toNode: string;
  readonly reason: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly success: boolean | null;
}

export interface SubstrateExecutionSummary {
  readonly totalNodes: number;
  readonly byType: Record<SubstrateType, number>;
  readonly healthyNodes: number;
  readonly totalCapacity: number;
  readonly usedCapacity: number;
  readonly utilizationPct: number;
  readonly activeAllocations: number;
  readonly totalMigrations: number;
  readonly successfulMigrations: number;
}

// ---- Layer ----------------------------------------------------------------

export class SubstrateAgnosticExecution {
  private readonly nodes: SubstrateNode[] = [];
  private readonly allocations: SubstrateAllocation[] = [];
  private readonly migrationLog: MigrationEvent[] = [];

  // ---- Node management ----------------------------------------------------

  registerNode(type: SubstrateType, label: string, capacityUnits: number, region = 'default'): SubstrateNode {
    const node: SubstrateNode = {
      id: `sn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label,
      capacityUnits,
      usedUnits: 0,
      health: 'healthy',
      region,
      registeredAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
    };
    this.nodes.push(node);
    return node;
  }

  heartbeat(nodeId: string): boolean {
    const idx = this.nodes.findIndex((n) => n.id === nodeId);
    if (idx < 0) return false;
    this.nodes[idx] = { ...this.nodes[idx], lastHeartbeat: new Date().toISOString() };
    return true;
  }

  markNodeHealth(nodeId: string, health: SubstrateHealth): boolean {
    const idx = this.nodes.findIndex((n) => n.id === nodeId);
    if (idx < 0) return false;
    this.nodes[idx] = { ...this.nodes[idx], health };
    return true;
  }

  // ---- Allocation ---------------------------------------------------------

  allocate(missionId: string, units: number, preferredType?: SubstrateType): SubstrateAllocation | null {
    // Find best-fit node: prefer requested type, then most available capacity
    const candidates = this.nodes
      .filter((n) => n.health === 'healthy' && n.capacityUnits - n.usedUnits >= units)
      .sort((a, b) => {
        if (preferredType) {
          if (a.type === preferredType && b.type !== preferredType) return -1;
          if (b.type === preferredType && a.type !== preferredType) return 1;
        }
        return (b.capacityUnits - b.usedUnits) - (a.capacityUnits - a.usedUnits);
      });

    const node = candidates[0];
    if (!node) return null;

    const nIdx = this.nodes.indexOf(node);
    this.nodes[nIdx] = { ...node, usedUnits: node.usedUnits + units };

    const alloc: SubstrateAllocation = {
      id: `alloc-${Date.now().toString(36)}`,
      missionId,
      nodeId: node.id,
      unitsAllocated: units,
      allocatedAt: new Date().toISOString(),
      releasedAt: null,
    };
    this.allocations.push(alloc);
    return alloc;
  }

  release(allocationId: string): boolean {
    const idx = this.allocations.findIndex((a) => a.id === allocationId);
    if (idx < 0 || this.allocations[idx].releasedAt) return false;
    const alloc = this.allocations[idx];
    this.allocations[idx] = { ...alloc, releasedAt: new Date().toISOString() };

    const nIdx = this.nodes.findIndex((n) => n.id === alloc.nodeId);
    if (nIdx >= 0) {
      const node = this.nodes[nIdx];
      this.nodes[nIdx] = { ...node, usedUnits: Math.max(0, node.usedUnits - alloc.unitsAllocated) };
    }
    return true;
  }

  // ---- Migration ----------------------------------------------------------

  migrateMission(missionId: string, toNodeId: string, reason: string): MigrationEvent | null {
    const activeAlloc = this.allocations.find((a) => a.missionId === missionId && !a.releasedAt);
    if (!activeAlloc) return null;
    const toNode = this.nodes.find((n) => n.id === toNodeId);
    if (!toNode || toNode.health !== 'healthy') return null;

    const evt: MigrationEvent = {
      id: `mig-${Date.now().toString(36)}`,
      missionId,
      fromNode: activeAlloc.nodeId,
      toNode: toNodeId,
      reason,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      success: true,
    };
    this.migrationLog.push(evt);

    // Release old, allocate new
    this.release(activeAlloc.id);
    this.allocate(missionId, activeAlloc.unitsAllocated);
    return evt;
  }

  // ---- Query --------------------------------------------------------------

  getNodes(): readonly SubstrateNode[] { return this.nodes; }

  getActiveAllocations(): SubstrateAllocation[] {
    return this.allocations.filter((a) => !a.releasedAt);
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): SubstrateExecutionSummary {
    const byType: Record<string, number> = {};
    let totalCap = 0;
    let usedCap = 0;
    let healthy = 0;
    for (const n of this.nodes) {
      byType[n.type] = (byType[n.type] ?? 0) + 1;
      totalCap += n.capacityUnits;
      usedCap += n.usedUnits;
      if (n.health === 'healthy') healthy++;
    }
    return {
      totalNodes: this.nodes.length,
      byType: byType as Record<SubstrateType, number>,
      healthyNodes: healthy,
      totalCapacity: totalCap,
      usedCapacity: usedCap,
      utilizationPct: totalCap > 0 ? Number(((usedCap / totalCap) * 100).toFixed(1)) : 0,
      activeAllocations: this.allocations.filter((a) => !a.releasedAt).length,
      totalMigrations: this.migrationLog.length,
      successfulMigrations: this.migrationLog.filter((m) => m.success === true).length,
    };
  }
}
