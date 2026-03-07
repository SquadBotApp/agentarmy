// ---------------------------------------------------------------------------
// Synthetic Reality Fabric
// ---------------------------------------------------------------------------
// Generates and maintains fully simulated environments—logical, economic,
// social, physical, or hybrid—where missions, agents, and governance
// structures can be tested, trained, or evolved safely before acting in
// the real world.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SimulationType =
  | 'multi-agent'
  | 'economic'
  | 'governance'
  | 'physical'
  | 'social'
  | 'emergent'
  | 'evolution'
  | 'hybrid';

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface SimulationConfig {
  tickRate: number;          // simulation steps per second
  maxTicks: number;          // hard stop
  seed: number;              // deterministic reproducibility
  parameters: Record<string, unknown>;
}

export interface SimulationEntity {
  id: string;
  kind: 'agent' | 'resource' | 'rule' | 'environment' | 'actor';
  name: string;
  state: Record<string, unknown>;
}

export interface SimulationEvent {
  tick: number;
  entityId: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface SimulationOutcome {
  success: boolean;
  score: number;             // 0-1
  metrics: Record<string, number>;
  events: SimulationEvent[];
  summary: string;
}

export interface SimulationRun {
  id: string;
  type: SimulationType;
  name: string;
  description: string;
  config: SimulationConfig;
  status: SimulationStatus;
  currentTick: number;
  entities: SimulationEntity[];
  events: SimulationEvent[];
  outcome: SimulationOutcome | null;
  createdAt: string;
  completedAt: string | null;
}

export interface SyntheticRealitySummary {
  totalSimulations: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  averageScore: number;
  totalEntityCount: number;
  totalEvents: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SyntheticRealityFabric {
  private readonly simulations: Map<string, SimulationRun> = new Map();

  // ---- Simulation Lifecycle ----

  createSimulation(
    type: SimulationType,
    name: string,
    description: string,
    config: Partial<SimulationConfig> = {},
  ): SimulationRun {
    const id = `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const run: SimulationRun = {
      id,
      type,
      name,
      description,
      config: {
        tickRate: config.tickRate ?? 60,
        maxTicks: config.maxTicks ?? 10_000,
        seed: config.seed ?? Math.floor(Math.random() * 1_000_000),
        parameters: config.parameters ?? {},
      },
      status: 'idle',
      currentTick: 0,
      entities: [],
      events: [],
      outcome: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    this.simulations.set(id, run);
    return run;
  }

  getSimulation(id: string): SimulationRun | undefined {
    return this.simulations.get(id);
  }

  removeSimulation(id: string): boolean {
    return this.simulations.delete(id);
  }

  // ---- Entity Management ----

  addEntity(
    simulationId: string,
    kind: SimulationEntity['kind'],
    name: string,
    state: Record<string, unknown> = {},
  ): SimulationEntity | null {
    const sim = this.simulations.get(simulationId);
    if (!sim || sim.status === 'completed' || sim.status === 'failed') return null;

    const entity: SimulationEntity = {
      id: `se-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      name,
      state,
    };
    sim.entities.push(entity);
    return entity;
  }

  removeEntity(simulationId: string, entityId: string): boolean {
    const sim = this.simulations.get(simulationId);
    if (!sim) return false;
    const before = sim.entities.length;
    sim.entities = sim.entities.filter((e) => e.id !== entityId);
    return sim.entities.length < before;
  }

  // ---- Simulation Execution ----

  start(simulationId: string): boolean {
    const sim = this.simulations.get(simulationId);
    if (sim?.status !== 'idle') return false;
    sim.status = 'running';
    return true;
  }

  pause(simulationId: string): boolean {
    const sim = this.simulations.get(simulationId);
    if (sim?.status !== 'running') return false;
    sim.status = 'paused';
    return true;
  }

  resume(simulationId: string): boolean {
    const sim = this.simulations.get(simulationId);
    if (sim?.status !== 'paused') return false;
    sim.status = 'running';
    return true;
  }

  /** Advance the simulation by `n` ticks. Returns events generated. */
  tick(simulationId: string, n = 1): SimulationEvent[] {
    const sim = this.simulations.get(simulationId);
    if (sim?.status !== 'running') return [];

    const generated: SimulationEvent[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < n; i++) {
      if (sim.currentTick >= sim.config.maxTicks) {
        this.complete(sim);
        break;
      }
      sim.currentTick++;

      // Produce one event per entity per tick (simplified deterministic sim)
      for (const entity of sim.entities) {
        const evt: SimulationEvent = {
          tick: sim.currentTick,
          entityId: entity.id,
          event: 'step',
          data: { state: { ...entity.state } },
          timestamp: now,
        };
        sim.events.push(evt);
        generated.push(evt);
      }
    }

    // Auto-complete if ticks exhausted
    if (sim.currentTick >= sim.config.maxTicks && sim.status === 'running') {
      this.complete(sim);
    }

    return generated;
  }

  // ---- Forecast ----

  /** Run a quick deterministic forecast returning the predicted score. */
  forecast(simulationId: string, horizonTicks: number): number {
    const sim = this.simulations.get(simulationId);
    if (!sim) return 0;
    // Simple heuristic: success probability scales with entity count & horizon
    const entityFactor = Math.min(1, sim.entities.length / 10);
    const horizonFactor = Math.min(1, horizonTicks / sim.config.maxTicks);
    return Number((entityFactor * 0.5 + horizonFactor * 0.5).toFixed(3));
  }

  // ---- Summary ----

  getSummary(): SyntheticRealitySummary {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalEntities = 0;
    let totalEvents = 0;
    let scoreSum = 0;
    let completedCount = 0;

    for (const sim of this.simulations.values()) {
      byType[sim.type] = (byType[sim.type] ?? 0) + 1;
      byStatus[sim.status] = (byStatus[sim.status] ?? 0) + 1;
      totalEntities += sim.entities.length;
      totalEvents += sim.events.length;
      if (sim.outcome) {
        scoreSum += sim.outcome.score;
        completedCount++;
      }
    }

    return {
      totalSimulations: this.simulations.size,
      byType,
      byStatus,
      averageScore: completedCount > 0 ? Number((scoreSum / completedCount).toFixed(3)) : 0,
      totalEntityCount: totalEntities,
      totalEvents,
    };
  }

  // ---- Internals ----

  private complete(sim: SimulationRun): void {
    sim.status = 'completed';
    sim.completedAt = new Date().toISOString();
    // Compute outcome heuristically
    const successfulSteps = sim.events.filter((e) => e.event === 'step').length;
    const maxPossible = sim.config.maxTicks * Math.max(1, sim.entities.length);
    const score = maxPossible > 0 ? Number((successfulSteps / maxPossible).toFixed(3)) : 0;
    sim.outcome = {
      success: score > 0.4,
      score,
      metrics: { totalSteps: successfulSteps, maxPossible, entityCount: sim.entities.length },
      events: sim.events.slice(-100),
      summary: `Simulation "${sim.name}" completed with score ${score}`,
    };
  }
}
