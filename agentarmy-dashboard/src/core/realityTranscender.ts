// ---------------------------------------------------------------------------
// Reality Transcender
// ---------------------------------------------------------------------------
// Bridges between simulated and actual reality boundaries.  Manages
// reality layers (simulation, augmented, physical), tracks fidelity of
// each layer relative to a ground‑truth reference, and provides
// transcendence operations that transfer results across layers while
// preserving semantic accuracy.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type RealityTier = 'physical' | 'augmented' | 'simulated' | 'abstract' | 'transcendent';
export type TransferStatus = 'pending' | 'in-flight' | 'completed' | 'failed' | 'rolled-back';

export interface RealityLayer {
  readonly id: string;
  readonly name: string;
  readonly tier: RealityTier;
  readonly fidelity: number;          // 0 – 1 relative to ground truth
  readonly entityCount: number;
  readonly active: boolean;
  readonly createdAt: string;
}

export interface TranscendenceTransfer {
  readonly id: string;
  readonly sourceLayerId: string;
  readonly targetLayerId: string;
  readonly entityCount: number;
  readonly semanticAccuracy: number;   // 0 – 1
  readonly status: TransferStatus;
  readonly startedAt: string;
  readonly completedAt: string | null;
}

export interface FidelitySnapshot {
  readonly timestamp: string;
  readonly layerId: string;
  readonly fidelity: number;
  readonly drift: number;             // change since previous measurement
}

export interface RealityBoundary {
  readonly id: string;
  readonly layerAId: string;
  readonly layerBId: string;
  readonly permeability: number;       // 0 – 1 (0 = sealed, 1 = open)
  readonly crossings: number;
}

export interface RealityTranscenderSummary {
  readonly totalLayers: number;
  readonly activeLayers: number;
  readonly totalTransfers: number;
  readonly completedTransfers: number;
  readonly failedTransfers: number;
  readonly avgSemanticAccuracy: number;
  readonly avgFidelity: number;
  readonly boundaries: number;
  readonly avgPermeability: number;
}

// ---- Layer ----------------------------------------------------------------

export class RealityTranscender {
  private readonly layers: RealityLayer[] = [];
  private readonly transfers: TranscendenceTransfer[] = [];
  private readonly snapshots: FidelitySnapshot[] = [];
  private readonly boundaries: RealityBoundary[] = [];

  // ---- Layer management ---------------------------------------------------

  addLayer(name: string, tier: RealityTier, fidelity = 1.0): RealityLayer {
    const layer: RealityLayer = {
      id: `rl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      tier,
      fidelity: Math.max(0, Math.min(1, fidelity)),
      entityCount: 0,
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.layers.push(layer);
    return layer;
  }

  deactivateLayer(layerId: string): boolean {
    const idx = this.layers.findIndex((l) => l.id === layerId);
    if (idx < 0) return false;
    this.layers[idx] = { ...this.layers[idx], active: false };
    return true;
  }

  updateEntityCount(layerId: string, count: number): boolean {
    const idx = this.layers.findIndex((l) => l.id === layerId);
    if (idx < 0) return false;
    this.layers[idx] = { ...this.layers[idx], entityCount: Math.max(0, count) };
    return true;
  }

  // ---- Boundary management ------------------------------------------------

  defineBoundary(layerAId: string, layerBId: string, permeability = 0.5): RealityBoundary | null {
    if (!this.layers.some((l) => l.id === layerAId) || !this.layers.some((l) => l.id === layerBId)) return null;
    const boundary: RealityBoundary = {
      id: `rb-${Date.now().toString(36)}`,
      layerAId,
      layerBId,
      permeability: Math.max(0, Math.min(1, permeability)),
      crossings: 0,
    };
    this.boundaries.push(boundary);
    return boundary;
  }

  // ---- Transcendence transfer ---------------------------------------------

  initiateTransfer(sourceLayerId: string, targetLayerId: string, entityCount: number): TranscendenceTransfer | null {
    if (!this.layers.some((l) => l.id === sourceLayerId) || !this.layers.some((l) => l.id === targetLayerId)) return null;
    const transfer: TranscendenceTransfer = {
      id: `tt-${Date.now().toString(36)}`,
      sourceLayerId,
      targetLayerId,
      entityCount,
      semanticAccuracy: 1.0,
      status: 'pending',
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    this.transfers.push(transfer);
    return transfer;
  }

  completeTransfer(transferId: string, semanticAccuracy: number, success: boolean): boolean {
    const idx = this.transfers.findIndex((t) => t.id === transferId);
    if (idx < 0) return false;
    this.transfers[idx] = {
      ...this.transfers[idx],
      semanticAccuracy: Math.max(0, Math.min(1, semanticAccuracy)),
      status: success ? 'completed' : 'failed',
      completedAt: new Date().toISOString(),
    };
    // Increment boundary crossing if applicable
    const t = this.transfers[idx];
    const bi = this.boundaries.findIndex(
      (b) =>
        (b.layerAId === t.sourceLayerId && b.layerBId === t.targetLayerId) ||
        (b.layerBId === t.sourceLayerId && b.layerAId === t.targetLayerId),
    );
    if (bi >= 0) this.boundaries[bi] = { ...this.boundaries[bi], crossings: this.boundaries[bi].crossings + 1 };
    return true;
  }

  // ---- Fidelity snapshots -------------------------------------------------

  measureFidelity(layerId: string, fidelity: number): FidelitySnapshot | null {
    const layer = this.layers.find((l) => l.id === layerId);
    if (!layer) return null;
    const prev = [...this.snapshots].reverse().find((s) => s.layerId === layerId);
    const snap: FidelitySnapshot = {
      timestamp: new Date().toISOString(),
      layerId,
      fidelity: Math.max(0, Math.min(1, fidelity)),
      drift: prev ? fidelity - prev.fidelity : 0,
    };
    this.snapshots.push(snap);
    if (this.snapshots.length > 10_000) this.snapshots.splice(0, this.snapshots.length - 10_000);
    return snap;
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): RealityTranscenderSummary {
    const completed = this.transfers.filter((t) => t.status === 'completed');
    const failed = this.transfers.filter((t) => t.status === 'failed');
    const avgAcc = completed.length > 0
      ? completed.reduce((s, t) => s + t.semanticAccuracy, 0) / completed.length
      : 0;
    const avgFid = this.layers.length > 0
      ? this.layers.reduce((s, l) => s + l.fidelity, 0) / this.layers.length
      : 0;
    const avgPerm = this.boundaries.length > 0
      ? this.boundaries.reduce((s, b) => s + b.permeability, 0) / this.boundaries.length
      : 0;
    return {
      totalLayers: this.layers.length,
      activeLayers: this.layers.filter((l) => l.active).length,
      totalTransfers: this.transfers.length,
      completedTransfers: completed.length,
      failedTransfers: failed.length,
      avgSemanticAccuracy: Number(avgAcc.toFixed(3)),
      avgFidelity: Number(avgFid.toFixed(3)),
      boundaries: this.boundaries.length,
      avgPermeability: Number(avgPerm.toFixed(3)),
    };
  }
}
