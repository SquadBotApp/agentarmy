// ---------------------------------------------------------------------------
// Neural Infinity Layer
// ---------------------------------------------------------------------------
// Infinite‑depth neural‑inspired processing for continuous learning and
// adaptation.  Manages neural pathways (weighted connections between
// cognitive nodes), learning episodes, and synaptic plasticity across
// the OS, enabling emergent intelligence that deepens over time.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type PathwayState = 'forming' | 'active' | 'potentiated' | 'depressed' | 'pruned';
export type LearningMode = 'supervised' | 'unsupervised' | 'reinforcement' | 'meta-learning' | 'self-supervised';

export interface CognitiveNode {
  readonly id: string;
  readonly label: string;
  readonly activation: number;          // 0 – 1
  readonly bias: number;
  readonly layerDepth: number;
  readonly createdAt: string;
}

export interface NeuralPathway {
  readonly id: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly weight: number;
  readonly state: PathwayState;
  readonly signalCount: number;
  readonly lastSignalAt: string | null;
}

export interface LearningEpisode {
  readonly id: string;
  readonly mode: LearningMode;
  readonly inputs: number;
  readonly outputs: number;
  readonly loss: number;
  readonly improvement: number;         // delta loss from previous episode
  readonly epochsRun: number;
  readonly startedAt: string;
  readonly completedAt: string | null;
}

export interface PlasticityMetric {
  readonly timestamp: string;
  readonly activePathways: number;
  readonly avgWeight: number;
  readonly potentiationRate: number;
  readonly pruningRate: number;
}

export interface NeuralInfinitySummary {
  readonly totalNodes: number;
  readonly totalPathways: number;
  readonly activePathways: number;
  readonly prunedPathways: number;
  readonly episodes: number;
  readonly avgLoss: number;
  readonly avgImprovement: number;
  readonly maxDepth: number;
  readonly learningMode: LearningMode;
}

// ---- Layer ----------------------------------------------------------------

export class NeuralInfinityLayer {
  private readonly nodes: CognitiveNode[] = [];
  private readonly pathways: NeuralPathway[] = [];
  private readonly episodes: LearningEpisode[] = [];
  private readonly plasticityLog: PlasticityMetric[] = [];
  private learningMode: LearningMode = 'meta-learning';

  // ---- Node management ----------------------------------------------------

  addNode(label: string, layerDepth: number, bias = 0): CognitiveNode {
    const node: CognitiveNode = {
      id: `cn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      activation: 0,
      bias,
      layerDepth,
      createdAt: new Date().toISOString(),
    };
    this.nodes.push(node);
    return node;
  }

  activate(nodeId: string, value: number): boolean {
    const idx = this.nodes.findIndex((n) => n.id === nodeId);
    if (idx < 0) return false;
    this.nodes[idx] = { ...this.nodes[idx], activation: Math.max(0, Math.min(1, value)) };
    return true;
  }

  // ---- Pathway management -------------------------------------------------

  connect(fromNodeId: string, toNodeId: string, weight = 0.5): NeuralPathway {
    const pathway: NeuralPathway = {
      id: `np-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      fromNodeId,
      toNodeId,
      weight: Math.max(-1, Math.min(1, weight)),
      state: 'forming',
      signalCount: 0,
      lastSignalAt: null,
    };
    this.pathways.push(pathway);
    return pathway;
  }

  signal(pathwayId: string): boolean {
    const idx = this.pathways.findIndex((p) => p.id === pathwayId);
    if (idx < 0) return false;
    const p = this.pathways[idx];
    this.pathways[idx] = {
      ...p,
      signalCount: p.signalCount + 1,
      state: p.state === 'forming' ? 'active' : p.state,
      lastSignalAt: new Date().toISOString(),
    };
    return true;
  }

  potentiate(pathwayId: string, delta: number): boolean {
    const idx = this.pathways.findIndex((p) => p.id === pathwayId);
    if (idx < 0) return false;
    const p = this.pathways[idx];
    const newWeight = Math.max(-1, Math.min(1, p.weight + delta));
    this.pathways[idx] = { ...p, weight: newWeight, state: delta > 0 ? 'potentiated' : 'depressed' };
    return true;
  }

  prune(pathwayId: string): boolean {
    const idx = this.pathways.findIndex((p) => p.id === pathwayId);
    if (idx < 0) return false;
    this.pathways[idx] = { ...this.pathways[idx], state: 'pruned', weight: 0 };
    return true;
  }

  // ---- Learning episodes --------------------------------------------------

  startEpisode(mode?: LearningMode): LearningEpisode {
    const ep: LearningEpisode = {
      id: `le-${Date.now().toString(36)}`,
      mode: mode ?? this.learningMode,
      inputs: 0,
      outputs: 0,
      loss: 1.0,
      improvement: 0,
      epochsRun: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    this.episodes.push(ep);
    return ep;
  }

  completeEpisode(episodeId: string, inputs: number, outputs: number, loss: number, epochsRun: number): boolean {
    const idx = this.episodes.findIndex((e) => e.id === episodeId);
    if (idx < 0) return false;
    const prev = this.episodes.at(-2);
    const improvement = prev ? prev.loss - loss : 0;
    this.episodes[idx] = {
      ...this.episodes[idx],
      inputs,
      outputs,
      loss: Math.max(0, loss),
      improvement,
      epochsRun,
      completedAt: new Date().toISOString(),
    };
    return true;
  }

  // ---- Plasticity ---------------------------------------------------------

  recordPlasticity(): PlasticityMetric {
    const active = this.pathways.filter((p) => p.state === 'active' || p.state === 'potentiated');
    const pruned = this.pathways.filter((p) => p.state === 'pruned');
    const avgW = active.length > 0 ? active.reduce((s, p) => s + Math.abs(p.weight), 0) / active.length : 0;
    const metric: PlasticityMetric = {
      timestamp: new Date().toISOString(),
      activePathways: active.length,
      avgWeight: Number(avgW.toFixed(4)),
      potentiationRate: this.pathways.length > 0
        ? this.pathways.filter((p) => p.state === 'potentiated').length / this.pathways.length
        : 0,
      pruningRate: this.pathways.length > 0 ? pruned.length / this.pathways.length : 0,
    };
    this.plasticityLog.push(metric);
    if (this.plasticityLog.length > 10_000) this.plasticityLog.splice(0, this.plasticityLog.length - 10_000);
    return metric;
  }

  // ---- Mode ---------------------------------------------------------------

  setLearningMode(mode: LearningMode): void { this.learningMode = mode; }

  // ---- Summary ------------------------------------------------------------

  getSummary(): NeuralInfinitySummary {
    const completed = this.episodes.filter((e) => e.completedAt);
    const avgLoss = completed.length > 0 ? completed.reduce((s, e) => s + e.loss, 0) / completed.length : 0;
    const avgImp = completed.length > 0 ? completed.reduce((s, e) => s + e.improvement, 0) / completed.length : 0;
    const maxDepth = this.nodes.length > 0 ? Math.max(...this.nodes.map((n) => n.layerDepth)) : 0;
    return {
      totalNodes: this.nodes.length,
      totalPathways: this.pathways.length,
      activePathways: this.pathways.filter((p) => p.state === 'active' || p.state === 'potentiated').length,
      prunedPathways: this.pathways.filter((p) => p.state === 'pruned').length,
      episodes: this.episodes.length,
      avgLoss: Number(avgLoss.toFixed(4)),
      avgImprovement: Number(avgImp.toFixed(4)),
      maxDepth,
      learningMode: this.learningMode,
    };
  }
}
