/**
 * Semantic Compression & Retrieval Layer — transforms raw historical data
 * into compact, queryable, semantically meaningful representations.
 *
 * Prevents the OS from drowning in its own data as it scales. Powers the
 * Unified Query Interface with fast, meaningful retrieval.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SemanticEmbedding {
  id: string;
  sourceId: string;
  sourceType: string;
  vector: number[];           // simplified — real system would use high‑dim
  tags: string[];
  summary: string;
  cluster?: string;
  createdAt: string;
}

export interface SemanticCluster {
  id: string;
  label: string;
  memberCount: number;
  centroid: number[];
  topTags: string[];
  createdAt: string;
}

export interface SemanticSearchResult {
  embedding: SemanticEmbedding;
  score: number;              // 0‑1 similarity
}

export interface CompressionStats {
  totalEmbeddings: number;
  totalClusters: number;
  compressionRatio: number;   // original items / embeddings
  avgVectorDim: number;
}

// ---------------------------------------------------------------------------
// Layer
// ---------------------------------------------------------------------------

const VECTOR_DIM = 16; // simplified dimension for in‑memory demo

export class SemanticCompressionLayer {
  private embeddings: SemanticEmbedding[] = [];
  private clusters: SemanticCluster[] = [];
  private sourceCount = 0;

  // ---- Ingest / compress ----

  /** Create a semantic embedding from arbitrary data. */
  compress(
    sourceId: string,
    sourceType: string,
    content: string,
    tags: string[] = [],
  ): SemanticEmbedding {
    this.sourceCount += 1;

    const vector = this.generateVector(content);
    const summary = content.length > 200 ? content.slice(0, 197) + '...' : content;

    const emb: SemanticEmbedding = {
      id: `emb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sourceId,
      sourceType,
      vector,
      tags,
      summary,
      createdAt: new Date().toISOString(),
    };

    this.embeddings.push(emb);
    this.maybeAssignCluster(emb);

    if (this.embeddings.length > 50_000) {
      this.embeddings = this.embeddings.slice(-50_000);
    }

    return emb;
  }

  /** Compress multiple items in batch. */
  compressBatch(items: Array<{ sourceId: string; sourceType: string; content: string; tags?: string[] }>): SemanticEmbedding[] {
    return items.map((i) => this.compress(i.sourceId, i.sourceType, i.content, i.tags));
  }

  /** Deduplicate: remove embeddings with very high similarity. */
  deduplicate(threshold = 0.95): number {
    const removed: string[] = [];
    for (let i = 0; i < this.embeddings.length; i++) {
      for (let j = i + 1; j < this.embeddings.length; j++) {
        if (removed.includes(this.embeddings[j].id)) continue;
        const sim = this.cosineSimilarity(this.embeddings[i].vector, this.embeddings[j].vector);
        if (sim >= threshold) removed.push(this.embeddings[j].id);
      }
    }
    this.embeddings = this.embeddings.filter((e) => !removed.includes(e.id));
    return removed.length;
  }

  // ---- Search / retrieve ----

  /** Semantic search: find embeddings most similar to a query. */
  search(query: string, limit = 10): SemanticSearchResult[] {
    const qv = this.generateVector(query);
    const scored = this.embeddings.map((e) => ({
      embedding: e,
      score: this.cosineSimilarity(qv, e.vector),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /** Find by tags. */
  findByTags(tags: string[], limit = 50): SemanticEmbedding[] {
    return this.embeddings
      .filter((e) => tags.every((t) => e.tags.includes(t)))
      .slice(-limit);
  }

  /** Get cluster members. */
  getClusterMembers(clusterId: string): SemanticEmbedding[] {
    return this.embeddings.filter((e) => e.cluster === clusterId);
  }

  // ---- Clustering ----

  /** Re-cluster all embeddings using simple k-means-like grouping. */
  buildClusters(k = 8): SemanticCluster[] {
    if (this.embeddings.length < k) return [];

    // Initialize centroids from random embeddings
    const centroids = this.embeddings
      .slice(0, k)
      .map((e) => [...e.vector]);

    // Single-pass assignment
    this.assignEmbeddingsToCentroids(centroids);

    // Build cluster metadata
    this.clusters = [];
    for (let i = 0; i < k; i++) {
      const cluster = this.buildClusterMeta(i, centroids[i]);
      if (cluster) this.clusters.push(cluster);
    }

    return this.clusters;
  }

  private assignEmbeddingsToCentroids(centroids: number[][]): void {
    for (const emb of this.embeddings) {
      let bestIdx = 0;
      let bestSim = -1;
      for (let i = 0; i < centroids.length; i++) {
        const sim = this.cosineSimilarity(emb.vector, centroids[i]);
        if (sim > bestSim) {
          bestSim = sim;
          bestIdx = i;
        }
      }
      emb.cluster = `cluster-${bestIdx}`;
    }
  }

  private buildClusterMeta(index: number, centroid: number[]): SemanticCluster | null {
    const members = this.embeddings.filter((e) => e.cluster === `cluster-${index}`);
    if (members.length === 0) return null;

    const tagCounts = new Map<string, number>();
    for (const m of members) {
      for (const t of m.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);

    return {
      id: `cluster-${index}`,
      label: topTags.length > 0 ? topTags.join(', ') : `Cluster ${index}`,
      memberCount: members.length,
      centroid,
      topTags,
      createdAt: new Date().toISOString(),
    };
  }

  getClusters(): SemanticCluster[] {
    return [...this.clusters];
  }

  // ---- Stats ----

  getStats(): CompressionStats {
    return {
      totalEmbeddings: this.embeddings.length,
      totalClusters: this.clusters.length,
      compressionRatio: this.sourceCount > 0 ? this.sourceCount / Math.max(1, this.embeddings.length) : 1,
      avgVectorDim: VECTOR_DIM,
    };
  }

  // ---- Internals ----

  /** Simple deterministic vector generation from text (not a real embedding model). */
  private generateVector(text: string): number[] {
    const vec = new Array(VECTOR_DIM).fill(0);
    for (let i = 0; i < text.length; i++) {
      vec[i % VECTOR_DIM] += (text.codePointAt(i) ?? 0) / 1000;
    }
    // Normalize
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    if (mag > 0) {
      for (let i = 0; i < vec.length; i++) vec[i] /= mag;
    }
    return vec;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let ma = 0;
    let mb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      ma += a[i] * a[i];
      mb += b[i] * b[i];
    }
    const denom = Math.sqrt(ma) * Math.sqrt(mb);
    return denom > 0 ? dot / denom : 0;
  }

  private maybeAssignCluster(emb: SemanticEmbedding): void {
    if (this.clusters.length === 0) return;
    let bestId = this.clusters[0].id;
    let bestSim = -1;
    for (const c of this.clusters) {
      const sim = this.cosineSimilarity(emb.vector, c.centroid);
      if (sim > bestSim) {
        bestSim = sim;
        bestId = c.id;
      }
    }
    emb.cluster = bestId;
  }
}
