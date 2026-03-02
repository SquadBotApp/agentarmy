// ---------------------------------------------------------------------------
// Dimension Weaver
// ---------------------------------------------------------------------------
// Weaves together disparate dimensional spaces into unified execution
// environments.  Each "fabric" is a composite space stitched from
// independent dimensional threads.  Enables cross‑dimensional data flow,
// seam monitoring, and fabric integrity management.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type ThreadState = 'spinning' | 'woven' | 'frayed' | 'severed' | 'dormant';
export type FabricHealth = 'pristine' | 'stable' | 'stressed' | 'tearing' | 'collapsed';

export interface DimensionalThread {
  readonly id: string;
  readonly name: string;
  readonly dimensionIndex: number;
  readonly state: ThreadState;
  readonly tension: number;            // 0 – 1
  readonly throughput: number;         // items per second
  readonly createdAt: string;
}

export interface WovenFabric {
  readonly id: string;
  readonly name: string;
  readonly threadIds: readonly string[];
  readonly health: FabricHealth;
  readonly seamCount: number;
  readonly integrityScore: number;     // 0 – 1
  readonly createdAt: string;
}

export interface DimensionalSeam {
  readonly id: string;
  readonly fabricId: string;
  readonly threadAId: string;
  readonly threadBId: string;
  readonly strength: number;           // 0 – 1
  readonly dataFlowRate: number;       // items per second
  readonly createdAt: string;
}

export interface WeaveOperation {
  readonly id: string;
  readonly fabricId: string;
  readonly threadsWoven: number;
  readonly seamsCreated: number;
  readonly durationMs: number;
  readonly success: boolean;
  readonly timestamp: string;
}

export interface DimensionWeaverSummary {
  readonly totalThreads: number;
  readonly wovenThreads: number;
  readonly frayedThreads: number;
  readonly fabrics: number;
  readonly pristineFabrics: number;
  readonly totalSeams: number;
  readonly avgIntegrity: number;
  readonly avgTension: number;
  readonly weaveOperations: number;
  readonly weaveSuccessRate: number;
}

// ---- Layer ----------------------------------------------------------------

export class DimensionWeaver {
  private readonly threads: DimensionalThread[] = [];
  private readonly fabrics: WovenFabric[] = [];
  private readonly seams: DimensionalSeam[] = [];
  private readonly operations: WeaveOperation[] = [];

  // ---- Thread management --------------------------------------------------

  createThread(name: string, dimensionIndex: number): DimensionalThread {
    const thread: DimensionalThread = {
      id: `dt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      dimensionIndex,
      state: 'spinning',
      tension: 0.5,
      throughput: 0,
      createdAt: new Date().toISOString(),
    };
    this.threads.push(thread);
    return thread;
  }

  setThreadTension(threadId: string, tension: number): boolean {
    const idx = this.threads.findIndex((t) => t.id === threadId);
    if (idx < 0) return false;
    const clamped = Math.max(0, Math.min(1, tension));
    const state: ThreadState = clamped > 0.9 ? 'frayed' : clamped > 0 ? this.threads[idx].state : 'severed';
    this.threads[idx] = { ...this.threads[idx], tension: clamped, state };
    return true;
  }

  severThread(threadId: string): boolean {
    const idx = this.threads.findIndex((t) => t.id === threadId);
    if (idx < 0) return false;
    this.threads[idx] = { ...this.threads[idx], state: 'severed', tension: 0, throughput: 0 };
    return true;
  }

  // ---- Weaving ------------------------------------------------------------

  weave(name: string, threadIds: string[]): WovenFabric | null {
    const startMs = Date.now();
    const validIds = threadIds.filter((id) => this.threads.some((t) => t.id === id));
    if (validIds.length < 2) return null;

    // Mark threads as woven
    for (const id of validIds) {
      const idx = this.threads.findIndex((t) => t.id === id);
      if (idx >= 0 && this.threads[idx].state === 'spinning') {
        this.threads[idx] = { ...this.threads[idx], state: 'woven' };
      }
    }

    // Create seams between consecutive threads
    const seamIds: string[] = [];
    for (let i = 0; i < validIds.length - 1; i++) {
      const seam = this.createSeam('', validIds[i], validIds[i + 1]);
      seamIds.push(seam.id);
    }

    const fabric: WovenFabric = {
      id: `wf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      threadIds: validIds,
      health: 'pristine',
      seamCount: seamIds.length,
      integrityScore: 1.0,
      createdAt: new Date().toISOString(),
    };
    this.fabrics.push(fabric);

    // Update seams with fabric id
    for (const sid of seamIds) {
      const si = this.seams.findIndex((s) => s.id === sid);
      if (si >= 0) this.seams[si] = { ...this.seams[si], fabricId: fabric.id };
    }

    const op: WeaveOperation = {
      id: `wo-${Date.now().toString(36)}`,
      fabricId: fabric.id,
      threadsWoven: validIds.length,
      seamsCreated: seamIds.length,
      durationMs: Date.now() - startMs,
      success: true,
      timestamp: new Date().toISOString(),
    };
    this.operations.push(op);
    return fabric;
  }

  private createSeam(fabricId: string, threadAId: string, threadBId: string): DimensionalSeam {
    const seam: DimensionalSeam = {
      id: `ds-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      fabricId,
      threadAId,
      threadBId,
      strength: 0.9 + Math.random() * 0.1,
      dataFlowRate: 0,
      createdAt: new Date().toISOString(),
    };
    this.seams.push(seam);
    return seam;
  }

  // ---- Fabric health ------------------------------------------------------

  assessFabric(fabricId: string): FabricHealth | null {
    const fi = this.fabrics.findIndex((f) => f.id === fabricId);
    if (fi < 0) return null;
    const fabric = this.fabrics[fi];
    const fabricSeams = this.seams.filter((s) => s.fabricId === fabricId);
    const avgStrength = fabricSeams.length > 0
      ? fabricSeams.reduce((s, sm) => s + sm.strength, 0) / fabricSeams.length
      : 0;
    const health: FabricHealth = avgStrength > 0.8 ? 'pristine'
      : avgStrength > 0.6 ? 'stable'
      : avgStrength > 0.3 ? 'stressed'
      : avgStrength > 0 ? 'tearing'
      : 'collapsed';
    this.fabrics[fi] = { ...fabric, health, integrityScore: Number(avgStrength.toFixed(3)) };
    return health;
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): DimensionWeaverSummary {
    const avgIntegrity = this.fabrics.length > 0
      ? this.fabrics.reduce((s, f) => s + f.integrityScore, 0) / this.fabrics.length
      : 0;
    const avgTension = this.threads.length > 0
      ? this.threads.reduce((s, t) => s + t.tension, 0) / this.threads.length
      : 0;
    const successOps = this.operations.filter((o) => o.success).length;
    return {
      totalThreads: this.threads.length,
      wovenThreads: this.threads.filter((t) => t.state === 'woven').length,
      frayedThreads: this.threads.filter((t) => t.state === 'frayed' || t.state === 'severed').length,
      fabrics: this.fabrics.length,
      pristineFabrics: this.fabrics.filter((f) => f.health === 'pristine').length,
      totalSeams: this.seams.length,
      avgIntegrity: Number(avgIntegrity.toFixed(3)),
      avgTension: Number(avgTension.toFixed(3)),
      weaveOperations: this.operations.length,
      weaveSuccessRate: this.operations.length > 0 ? Number((successOps / this.operations.length).toFixed(3)) : 0,
    };
  }
}
