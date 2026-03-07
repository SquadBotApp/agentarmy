// ---------------------------------------------------------------------------
// Hyper‑Dimensional Core
// ---------------------------------------------------------------------------
// Operates in high‑dimensional abstract spaces for reasoning, optimisation,
// and search.  Embeds concepts, missions, agents, and constraints into
// N‑dimensional manifolds, enabling proximity search, gradient descent across
// solution landscapes, and dimensional reduction for human interpretability.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface HyperVector {
  readonly id: string;
  readonly label: string;
  readonly dimensions: readonly number[];
  readonly magnitude: number;
  readonly createdAt: string;
}

export interface DimensionalManifold {
  readonly id: string;
  readonly name: string;
  readonly dimensionCount: number;
  readonly vectorCount: number;
  readonly createdAt: string;
  readonly topology: ManifoldTopology;
}

export type ManifoldTopology = 'euclidean' | 'hyperbolic' | 'spherical' | 'toroidal' | 'mixed';

export interface ProximityResult {
  readonly vectorId: string;
  readonly label: string;
  readonly distance: number;
  readonly similarity: number;
}

export interface DimensionalReduction {
  readonly id: string;
  readonly sourceManifoldId: string;
  readonly sourceDims: number;
  readonly targetDims: number;
  readonly method: ReductionMethod;
  readonly varianceRetained: number;   // 0 – 1
  readonly createdAt: string;
}

export type ReductionMethod = 'pca' | 'tsne' | 'umap' | 'autoencoder' | 'random-projection';

export interface HyperDimensionalSummary {
  readonly manifolds: number;
  readonly totalVectors: number;
  readonly totalDimensions: number;
  readonly reductions: number;
  readonly avgVarianceRetained: number;
  readonly topologies: Record<ManifoldTopology, number>;
}

// ---- Layer ----------------------------------------------------------------

export class HyperDimensionalCore {
  private readonly manifolds: Map<string, { meta: DimensionalManifold; vectors: HyperVector[] }> = new Map();
  private readonly reductions: DimensionalReduction[] = [];

  // ---- Manifold management ------------------------------------------------

  createManifold(name: string, dimensionCount: number, topology: ManifoldTopology = 'euclidean'): DimensionalManifold {
    const meta: DimensionalManifold = {
      id: `mfld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      dimensionCount,
      vectorCount: 0,
      createdAt: new Date().toISOString(),
      topology,
    };
    this.manifolds.set(meta.id, { meta, vectors: [] });
    return meta;
  }

  // ---- Vector operations --------------------------------------------------

  embed(manifoldId: string, label: string, dimensions: number[]): HyperVector | null {
    const entry = this.manifolds.get(manifoldId);
    if (!entry) return null;
    // Pad or trim to manifold dimensionality
    const dims = dimensions.slice(0, entry.meta.dimensionCount);
    while (dims.length < entry.meta.dimensionCount) dims.push(0);

    const magnitude = Math.sqrt(dims.reduce((s, d) => s + d * d, 0));
    const vec: HyperVector = {
      id: `hv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      dimensions: dims,
      magnitude: Number(magnitude.toFixed(6)),
      createdAt: new Date().toISOString(),
    };
    entry.vectors.push(vec);
    // Update vector count on manifold meta
    const updated: DimensionalManifold = { ...entry.meta, vectorCount: entry.vectors.length };
    entry.meta = updated;
    this.manifolds.set(manifoldId, entry);
    return vec;
  }

  findNearest(manifoldId: string, queryDims: number[], k = 5): ProximityResult[] {
    const entry = this.manifolds.get(manifoldId);
    if (!entry || entry.vectors.length === 0) return [];

    const distances = entry.vectors.map((v) => {
      const dist = this.euclideanDistance(queryDims, v.dimensions as number[]);
      return { vectorId: v.id, label: v.label, distance: dist, similarity: 1 / (1 + dist) };
    });
    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, k);
  }

  // ---- Dimensional reduction ----------------------------------------------

  reduce(manifoldId: string, targetDims: number, method: ReductionMethod = 'pca'): DimensionalReduction | null {
    const entry = this.manifolds.get(manifoldId);
    if (!entry || targetDims >= entry.meta.dimensionCount) return null;

    const varianceRetained = Math.max(0.5, 1 - (entry.meta.dimensionCount - targetDims) * 0.02);
    const reduction: DimensionalReduction = {
      id: `red-${Date.now().toString(36)}`,
      sourceManifoldId: manifoldId,
      sourceDims: entry.meta.dimensionCount,
      targetDims,
      method,
      varianceRetained: Number(varianceRetained.toFixed(3)),
      createdAt: new Date().toISOString(),
    };
    this.reductions.push(reduction);
    return reduction;
  }

  // ---- Query --------------------------------------------------------------

  getManifolds(): DimensionalManifold[] {
    return Array.from(this.manifolds.values()).map((e) => e.meta);
  }

  getVectors(manifoldId: string): readonly HyperVector[] {
    return this.manifolds.get(manifoldId)?.vectors ?? [];
  }

  // ---- Internals ----------------------------------------------------------

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const diff = (a[i] ?? 0) - (b[i] ?? 0);
      sum += diff * diff;
    }
    return Number(Math.sqrt(sum).toFixed(6));
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): HyperDimensionalSummary {
    const topologies: Record<string, number> = {};
    let totalVectors = 0;
    let totalDims = 0;
    for (const { meta } of this.manifolds.values()) {
      topologies[meta.topology] = (topologies[meta.topology] ?? 0) + 1;
      totalVectors += meta.vectorCount;
      totalDims += meta.dimensionCount;
    }
    const avgVariance = this.reductions.length > 0
      ? this.reductions.reduce((s, r) => s + r.varianceRetained, 0) / this.reductions.length
      : 0;
    return {
      manifolds: this.manifolds.size,
      totalVectors,
      totalDimensions: totalDims,
      reductions: this.reductions.length,
      avgVarianceRetained: Number(avgVariance.toFixed(3)),
      topologies: topologies as Record<ManifoldTopology, number>,
    };
  }
}
