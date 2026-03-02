// ---------------------------------------------------------------------------
// Synthetic Physics & Simulation Layer
// ---------------------------------------------------------------------------
// Applies physics‑inspired models to the agent ecosystem — simulating
// forces (load, attraction, repulsion), energy conservation, entropy,
// and equilibrium states. Used for capacity planning and stress testing.
// ---------------------------------------------------------------------------

export interface PhysicsBody {
  id: string;
  label: string;
  mass: number;           // workload weight
  position: Vec2;
  velocity: Vec2;
  charge: number;         // positive = source, negative = sink
  pinned: boolean;
  createdAt: string;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface ForceField {
  id: string;
  name: string;
  kind: 'gravity' | 'repulsion' | 'attraction' | 'drag' | 'custom';
  strength: number;
  origin: Vec2 | null;    // null = uniform field
  active: boolean;
}

export interface SimulationState {
  bodies: PhysicsBody[];
  fields: ForceField[];
  totalEnergy: number;
  entropy: number;
  tick: number;
  timestamp: string;
}

export interface SimulationConfig {
  timeStepMs: number;
  damping: number;        // 0‑1, friction factor
  maxTicks: number;
  equilibriumThreshold: number;
}

export interface SimulationSummary {
  bodyCount: number;
  fieldCount: number;
  currentTick: number;
  totalEnergy: number;
  entropy: number;
  isEquilibrium: boolean;
}

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: SimulationConfig = {
  timeStepMs: 16,
  damping: 0.95,
  maxTicks: 10_000,
  equilibriumThreshold: 0.01,
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SyntheticPhysicsEngine {
  private bodies: Map<string, PhysicsBody> = new Map();
  private fields: ForceField[] = [];
  private config: SimulationConfig;
  private tick = 0;
  private listeners: Array<(state: SimulationState) => void> = [];

  constructor(config?: Partial<SimulationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ---- Bodies ----

  addBody(body: Omit<PhysicsBody, 'createdAt'>): PhysicsBody {
    const full: PhysicsBody = { ...body, createdAt: new Date().toISOString() };
    this.bodies.set(full.id, full);
    return full;
  }

  removeBody(id: string): boolean {
    return this.bodies.delete(id);
  }

  getBody(id: string): PhysicsBody | undefined {
    return this.bodies.get(id);
  }

  getBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values());
  }

  // ---- Force Fields ----

  addField(field: ForceField): void {
    this.fields.push(field);
  }

  removeField(fieldId: string): void {
    this.fields = this.fields.filter((f) => f.id !== fieldId);
  }

  getFields(): ForceField[] {
    return [...this.fields];
  }

  // ---- Simulation ----

  /** Advance the simulation by one tick. */
  step(): SimulationState {
    this.tick += 1;
    const bodyList = Array.from(this.bodies.values());

    for (const body of bodyList) {
      if (body.pinned) continue;

      const force = this.computeNetForce(body, bodyList);
      // F = ma → a = F/m
      const ax = body.mass > 0 ? force.x / body.mass : 0;
      const ay = body.mass > 0 ? force.y / body.mass : 0;

      body.velocity.x = (body.velocity.x + ax) * this.config.damping;
      body.velocity.y = (body.velocity.y + ay) * this.config.damping;

      body.position.x += body.velocity.x;
      body.position.y += body.velocity.y;
    }

    const state = this.getState();
    for (const fn of this.listeners) fn(state);
    return state;
  }

  /** Run until equilibrium or maxTicks. */
  runUntilEquilibrium(): SimulationState {
    for (let i = 0; i < this.config.maxTicks; i++) {
      const state = this.step();
      if (state.totalEnergy < this.config.equilibriumThreshold) break;
    }
    return this.getState();
  }

  reset(): void {
    this.tick = 0;
    for (const body of this.bodies.values()) {
      body.velocity = { x: 0, y: 0 };
    }
  }

  // ---- Energy & Entropy ----

  computeTotalEnergy(): number {
    let energy = 0;
    for (const body of this.bodies.values()) {
      // Kinetic energy: 0.5 * m * v²
      const v2 = body.velocity.x ** 2 + body.velocity.y ** 2;
      energy += 0.5 * body.mass * v2;
    }
    return energy;
  }

  computeEntropy(): number {
    const bodyList = Array.from(this.bodies.values());
    if (bodyList.length === 0) return 0;
    const totalMass = bodyList.reduce((s, b) => s + b.mass, 0);
    if (totalMass === 0) return 0;

    let entropy = 0;
    for (const b of bodyList) {
      const p = b.mass / totalMass;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    return Number(entropy.toFixed(4));
  }

  // ---- State ----

  getState(): SimulationState {
    return {
      bodies: this.getBodies(),
      fields: [...this.fields],
      totalEnergy: this.computeTotalEnergy(),
      entropy: this.computeEntropy(),
      tick: this.tick,
      timestamp: new Date().toISOString(),
    };
  }

  getSummary(): SimulationSummary {
    const energy = this.computeTotalEnergy();
    return {
      bodyCount: this.bodies.size,
      fieldCount: this.fields.length,
      currentTick: this.tick,
      totalEnergy: energy,
      entropy: this.computeEntropy(),
      isEquilibrium: energy < this.config.equilibriumThreshold,
    };
  }

  // ---- Events ----

  on(listener: (state: SimulationState) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  // ---- Internals ----

  private computeNetForce(body: PhysicsBody, allBodies: PhysicsBody[]): Vec2 {
    let fx = 0;
    let fy = 0;

    for (const field of this.fields) {
      if (!field.active) continue;
      const fieldForce = this.applyField(body, field);
      fx += fieldForce.x;
      fy += fieldForce.y;
    }

    // Body‑to‑body repulsion (like charges repel)
    for (const other of allBodies) {
      if (other.id === body.id) continue;
      const dx = body.position.x - other.position.x;
      const dy = body.position.y - other.position.y;
      const dist2 = dx * dx + dy * dy + 0.01; // avoid zero
      const repulsion = (body.charge * other.charge) / dist2;
      const dist = Math.sqrt(dist2);
      fx += (repulsion * dx) / dist;
      fy += (repulsion * dy) / dist;
    }

    return { x: fx, y: fy };
  }

  private applyField(body: PhysicsBody, field: ForceField): Vec2 {
    if (field.kind === 'drag') {
      return {
        x: -body.velocity.x * field.strength,
        y: -body.velocity.y * field.strength,
      };
    }

    if (field.kind === 'gravity' && field.origin) {
      const dx = field.origin.x - body.position.x;
      const dy = field.origin.y - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy + 0.01);
      return {
        x: (field.strength * body.mass * dx) / dist,
        y: (field.strength * body.mass * dy) / dist,
      };
    }

    if (field.kind === 'repulsion' && field.origin) {
      const dx = body.position.x - field.origin.x;
      const dy = body.position.y - field.origin.y;
      const dist2 = dx * dx + dy * dy + 0.01;
      return {
        x: (field.strength * dx) / dist2,
        y: (field.strength * dy) / dist2,
      };
    }

    return { x: 0, y: 0 };
  }
}
