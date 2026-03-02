// swarmIntelligenceEngine.ts — Subsystem #64
// ═══════════════════════════════════════════════════════════════════════════
// SWARM INTELLIGENCE ENGINE — The Ultimate Premium Cost Layer
// ═══════════════════════════════════════════════════════════════════════════
//
// Six specialist swarms (Force-Field, Navigation, Sensor, Governance,
// Fabrication, Comms) orchestrated by an Oracle coordinator, a Quasar
// meta-intelligence layer, and a consensus engine that uses multi-objective
// Pareto optimization to resolve disagreements.
//
// This is the CROWN JEWEL of AgentArmy OS — the most computationally
// expensive layer because every decision fans out across swarms, runs
// multi-objective optimization, and feeds back through Oracle + Quasar
// before converging on a Pareto-optimal action set.
//
// Cost model:
//   • Each swarm tick  → O(n·k) where n = swarm size, k = objectives
//   • Oracle synthesis → O(s²) where s = active swarms
//   • Pareto front     → O(m·log(m)·k) via non-dominated sort (NSGA-II style)
//   • Quasar pass      → O(p) where p = Pareto front cardinality
//
// Integrations: DefensiveIntelligenceSubstructure (threat feed),
//               PredictiveAnalyticsLayer (forecasts), MachineLearningLayer
//               (model inference), GodModeStrategy (escalation),
//               QubitCoinEngine (billing per-swarm-tick via compute spend).

// ---------------------------------------------------------------------------
// Enums & Constants
// ---------------------------------------------------------------------------

/** The six specialist swarm domains. */
export enum SwarmDomain {
  ForceField    = 'FORCE_FIELD',
  Navigation    = 'NAVIGATION',
  Sensor        = 'SENSOR',
  Governance    = 'GOVERNANCE',
  Fabrication   = 'FABRICATION',
  Comms         = 'COMMS',
}

/** Phase of the swarm consensus cycle. */
export enum ConsensusPhase {
  Idle        = 'IDLE',
  Collecting  = 'COLLECTING',
  Evaluating  = 'EVALUATING',
  Optimizing  = 'OPTIMIZING',
  Converged   = 'CONVERGED',
  Deadlocked  = 'DEADLOCKED',
}

/** Tier of swarm activation — determines cost. */
export enum SwarmTier {
  /** Single swarm, local consensus only. */
  Micro       = 'MICRO',
  /** 3 swarms, partial Pareto. */
  Standard    = 'STANDARD',
  /** All 6 swarms + Oracle + Pareto. */
  Premium     = 'PREMIUM',
  /** All 6 + Oracle + Quasar + full NSGA-II. The ultimate. */
  Omega       = 'OMEGA',
}

/** Objective dimension for multi-objective optimization. */
export type ObjectiveName =
  | 'latency'
  | 'throughput'
  | 'safety'
  | 'cost'
  | 'accuracy'
  | 'resilience'
  | 'fairness'
  | 'energy'
  | 'novelty'
  | 'alignment';

/** Direction of optimization. */
export type OptDirection = 'minimize' | 'maximize';

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

/** Single objective specification. */
export interface SwarmObjective {
  name: ObjectiveName;
  direction: OptDirection;
  weight: number;           // relative importance 0–1
  threshold?: number;       // hard constraint floor/ceiling
}

/** A unit of work inside a swarm. */
export interface SwarmAgent {
  id: string;
  domain: SwarmDomain;
  role: string;
  fitness: number;          // current fitness score
  energy: number;           // remaining compute budget (QubitCoin units)
  position: number[];       // n-dimensional position in solution space
  velocity: number[];       // PSO-style velocity vector
  personalBest: number[];
  personalBestFitness: number;
  alive: boolean;
  tickCount: number;
  metadata: Record<string, unknown>;
}

/** A candidate solution evaluated across multiple objectives. */
export interface ParetoCandidate {
  id: string;
  sourceSwarm: SwarmDomain;
  objectives: Record<ObjectiveName, number>;
  dominated: boolean;
  crowdingDistance: number;
  rank: number;             // Pareto front rank (0 = non-dominated)
  solution: Record<string, unknown>;
  timestamp: number;
}

/** Oracle synthesis result — merges insights from all swarms. */
export interface OracleSynthesis {
  id: string;
  cycle: number;
  swarmReports: SwarmReport[];
  paretoFront: ParetoCandidate[];
  selectedCandidate: ParetoCandidate | null;
  oracleConfidence: number;   // 0–1
  rationale: string;
  quasarOverride: boolean;
  timestamp: number;
}

/** Per-swarm tick report. */
export interface SwarmReport {
  domain: SwarmDomain;
  agentCount: number;
  aliveCount: number;
  bestFitness: number;
  avgFitness: number;
  topCandidates: ParetoCandidate[];
  energyConsumed: number;
  ticksThisCycle: number;
  convergenceRate: number;    // 0–1 (1 = fully converged)
}

/** Quasar meta-intelligence verdict. */
export interface QuasarVerdict {
  id: string;
  cycle: number;
  oracleSynthesisId: string;
  override: boolean;
  overrideReason: string | null;
  selectedCandidateId: string;
  quasarConfidence: number;
  strategicNotes: string[];
  timestamp: number;
}

/** The full consensus result returned to callers. */
export interface SwarmConsensusResult {
  cycle: number;
  phase: ConsensusPhase;
  tier: SwarmTier;
  oracle: OracleSynthesis;
  quasar: QuasarVerdict | null;
  paretoFront: ParetoCandidate[];
  selectedSolution: Record<string, unknown>;
  totalEnergyCost: number;
  durationMs: number;
  timestamp: number;
}

/** Cost accounting for a single swarm cycle. */
export interface SwarmCostLedger {
  cycle: number;
  tier: SwarmTier;
  perSwarmCost: Record<SwarmDomain, number>;
  oracleCost: number;
  paretoCost: number;
  quasarCost: number;
  totalCost: number;
  timestamp: number;
}

/** Summary for the TSU dashboard. */
export interface SwarmEngineSummary {
  totalCycles: number;
  totalAgents: number;
  aliveAgents: number;
  activeSwarms: number;
  currentPhase: ConsensusPhase;
  currentTier: SwarmTier;
  paretoFrontSize: number;
  oracleSyntheses: number;
  quasarOverrides: number;
  totalEnergySpent: number;
  avgConvergenceRate: number;
  costLedgerTotal: number;
  eventCount: number;
}

/** Events emitted by the engine. */
export interface SwarmEvent {
  kind: 'tick' | 'converge' | 'deadlock' | 'oracle' | 'quasar-override'
      | 'pareto-update' | 'agent-death' | 'tier-change' | 'cost-spike'
      | 'enforcement-transparent' | 'enforcement-semi' | 'agent-throttled'
      | 'agent-isolated' | 'agent-neutralized' | 'belief-propagated'
      | 'collective-memory-prune' | 'emergency-rebalance' | 'reward-distributed'
      | 'constitutional-violation';
  detail: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Enforcement & Governance Types
// ---------------------------------------------------------------------------

/** Enforcement visibility tier. */
export enum EnforcementTier {
  Transparent       = 'TRANSPARENT',
  SemiTransparent   = 'SEMI_TRANSPARENT',
  PermanentlyOpaque = 'PERMANENTLY_OPAQUE',
}

/** Agent enforcement status within the swarm. */
export enum AgentEnforcementStatus {
  Normal      = 'NORMAL',
  Throttled   = 'THROTTLED',
  Isolated    = 'ISOLATED',
  Neutralized = 'NEUTRALIZED',
}

/** Proof types for economic attribution. */
export type ProofType = 'proof-of-contribution' | 'proof-of-longevity' | 'proof-of-reliability';

/** An enforcement action record (transparent + semi-transparent tiers). */
export interface EnforcementRecord {
  readonly actionId: string;
  readonly agentId: string;
  readonly tier: EnforcementTier;
  readonly action: string;
  readonly reason: string;
  readonly timestamp: number;
}

/** A belief held in swarm collective memory. */
export interface CollectiveBelief {
  readonly id: string;
  readonly authorAgentId: string;
  readonly domain: SwarmDomain;
  content: string;
  confidence: number;        // 0–1, reliability-weighted
  corroborations: number;
  contradictions: number;
  persistenceScore: number;  // higher = harder to prune
  createdAt: number;
  lastUpdatedAt: number;
}

/** Economic proof record for QubitCoin attribution. */
export interface ContributionProof {
  readonly proofId: string;
  readonly agentId: string;
  readonly proofType: ProofType;
  readonly value: number;
  readonly taskId: string | null;
  readonly timestamp: number;
}

/** Swarm enforcement summary exposed alongside engine summary. */
export interface SwarmEnforcementSummary {
  totalEnforcements: number;
  transparentActions: number;
  semiTransparentActions: number;
  throttledAgents: number;
  isolatedAgents: number;
  neutralizedAgents: number;
  collectiveBeliefs: number;
  contributionProofs: number;
  constitutionalViolations: number;
}

// ---------------------------------------------------------------------------
// Utility: deterministic seeded PRNG (Mulberry32)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Utility: non-dominated sort (NSGA-II style)
// ---------------------------------------------------------------------------

function dominates(
  a: Record<ObjectiveName, number>,
  b: Record<ObjectiveName, number>,
  objectives: SwarmObjective[],
): boolean {
  let dominated = false;
  for (const obj of objectives) {
    const va = a[obj.name] ?? 0;
    const vb = b[obj.name] ?? 0;
    const better = obj.direction === 'maximize' ? va > vb : va < vb;
    const worse  = obj.direction === 'maximize' ? va < vb : va > vb;
    if (worse) return false;
    if (better) dominated = true;
  }
  return dominated;
}

function nonDominatedSort(
  candidates: ParetoCandidate[],
  objectives: SwarmObjective[],
): ParetoCandidate[][] {
  const n = candidates.length;
  const dominationCount = new Array<number>(n).fill(0);
  const dominatedSet: number[][] = Array.from({ length: n }, () => []);
  const fronts: ParetoCandidate[][] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (dominates(candidates[i].objectives, candidates[j].objectives, objectives)) {
        dominatedSet[i].push(j);
        dominationCount[j]++;
      } else if (dominates(candidates[j].objectives, candidates[i].objectives, objectives)) {
        dominatedSet[j].push(i);
        dominationCount[i]++;
      }
    }
  }

  let currentFront: number[] = [];
  for (let i = 0; i < n; i++) {
    if (dominationCount[i] === 0) {
      candidates[i].rank = 0;
      candidates[i].dominated = false;
      currentFront.push(i);
    }
  }

  let rank = 0;
  while (currentFront.length > 0) {
    const front: ParetoCandidate[] = currentFront.map((i) => candidates[i]);
    fronts.push(front);
    const nextFront: number[] = [];
    for (const i of currentFront) {
      for (const j of dominatedSet[i]) {
        dominationCount[j]--;
        if (dominationCount[j] === 0) {
          candidates[j].rank = rank + 1;
          nextFront.push(j);
        }
      }
    }
    rank++;
    currentFront = nextFront;
  }

  // mark dominated on non-front-0 candidates
  for (const c of candidates) {
    c.dominated = c.rank > 0;
  }

  return fronts;
}

function assignCrowdingDistance(
  front: ParetoCandidate[],
  objectives: SwarmObjective[],
): void {
  const n = front.length;
  for (const c of front) c.crowdingDistance = 0;
  if (n <= 2) {
    for (const c of front) c.crowdingDistance = Infinity;
    return;
  }
  for (const obj of objectives) {
    const sorted = [...front].sort(
      (a, b) => (a.objectives[obj.name] ?? 0) - (b.objectives[obj.name] ?? 0),
    );
    sorted[0].crowdingDistance = Infinity;
    sorted[n - 1].crowdingDistance = Infinity;
    const range = (sorted[n - 1].objectives[obj.name] ?? 0) - (sorted[0].objectives[obj.name] ?? 0);
    if (range === 0) continue;
    for (let i = 1; i < n - 1; i++) {
      sorted[i].crowdingDistance +=
        ((sorted[i + 1].objectives[obj.name] ?? 0) - (sorted[i - 1].objectives[obj.name] ?? 0)) / range;
    }
  }
}

// ---------------------------------------------------------------------------
// Specialist Swarm
// ---------------------------------------------------------------------------

class SpecialistSwarm {
  readonly domain: SwarmDomain;
  private agents: SwarmAgent[] = [];
  private readonly rng: () => number;
  private tickTotal = 0;
  private energyTotal = 0;
  private readonly dimensionality: number;
  private globalBest: number[] = [];
  private globalBestFitness = -Infinity;

  constructor(domain: SwarmDomain, size: number, dimensions: number, seed: number) {
    this.domain = domain;
    this.dimensionality = dimensions;
    this.rng = mulberry32(seed);
    for (let i = 0; i < size; i++) {
      const pos = Array.from({ length: dimensions }, () => this.rng() * 2 - 1);
      const vel = Array.from({ length: dimensions }, () => (this.rng() - 0.5) * 0.1);
      this.agents.push({
        id: `${domain}-agent-${i}`,
        domain,
        role: this.assignRole(i),
        fitness: 0,
        energy: 1000,
        position: pos,
        velocity: vel,
        personalBest: [...pos],
        personalBestFitness: -Infinity,
        alive: true,
        tickCount: 0,
        metadata: {},
      });
    }
    this.globalBest = [...this.agents[0].position];
  }

  private assignRole(index: number): string {
    const roles: Record<SwarmDomain, string[]> = {
      [SwarmDomain.ForceField]:   ['shield-gen', 'perimeter-watch', 'flux-amplifier', 'barrier-tuner'],
      [SwarmDomain.Navigation]:   ['pathfinder', 'obstacle-mapper', 'trajectory-opt', 'waypoint-setter'],
      [SwarmDomain.Sensor]:       ['signal-collector', 'anomaly-detector', 'spectrum-analyzer', 'fusion-node'],
      [SwarmDomain.Governance]:   ['rule-enforcer', 'vote-tallier', 'conflict-mediator', 'audit-logger'],
      [SwarmDomain.Fabrication]:  ['resource-allocator', 'assembler', 'quality-inspector', 'recycler'],
      [SwarmDomain.Comms]:        ['relay-node', 'encryption-handler', 'bandwidth-optimizer', 'protocol-translator'],
    };
    const pool = roles[this.domain];
    return pool[index % pool.length];
  }

  /** Evaluate fitness of an agent given current objectives. */
  private evaluateFitness(agent: SwarmAgent, objectives: SwarmObjective[]): number {
    // Composite fitness: weighted sum of objective scores derived from position
    let fitness = 0;
    for (let k = 0; k < objectives.length; k++) {
      const dimIndex = k % this.dimensionality;
      const rawValue = agent.position[dimIndex];
      const score = objectives[k].direction === 'maximize' ? rawValue : -rawValue;
      fitness += score * objectives[k].weight;
    }
    return fitness;
  }

  /** Run a single PSO tick across all alive agents. */
  tick(objectives: SwarmObjective[], inertia: number, cognitive: number, social: number): void {
    const costPerTick = 0.5; // QubitCoin units per agent per tick
    for (const agent of this.agents) {
      if (!agent.alive) continue;
      if (agent.energy <= 0) {
        agent.alive = false;
        continue;
      }

      // Evaluate
      agent.fitness = this.evaluateFitness(agent, objectives);

      // Update personal best
      if (agent.fitness > agent.personalBestFitness) {
        agent.personalBestFitness = agent.fitness;
        agent.personalBest = [...agent.position];
      }

      // Update global best
      if (agent.fitness > this.globalBestFitness) {
        this.globalBestFitness = agent.fitness;
        this.globalBest = [...agent.position];
      }

      // PSO velocity update
      for (let d = 0; d < this.dimensionality; d++) {
        const r1 = this.rng();
        const r2 = this.rng();
        agent.velocity[d] =
          inertia * agent.velocity[d] +
          cognitive * r1 * (agent.personalBest[d] - agent.position[d]) +
          social * r2 * (this.globalBest[d] - agent.position[d]);
        // Clamp velocity
        agent.velocity[d] = Math.max(-1, Math.min(1, agent.velocity[d]));
        agent.position[d] += agent.velocity[d];
        // Boundary: wrap [-2, 2]
        if (agent.position[d] > 2) agent.position[d] = -2 + (agent.position[d] - 2);
        if (agent.position[d] < -2) agent.position[d] = 2 + (agent.position[d] + 2);
      }

      agent.energy -= costPerTick;
      agent.tickCount++;
      this.tickTotal++;
      this.energyTotal += costPerTick;
    }
  }

  /** Generate top candidates as ParetoCandidate records. */
  topCandidates(objectives: SwarmObjective[], count: number): ParetoCandidate[] {
    const alive = this.agents.filter((a) => a.alive);
    alive.sort((a, b) => b.fitness - a.fitness);
    const top = alive.slice(0, count);
    return top.map((a) => {
      const objMap: Record<string, number> = {};
      for (let k = 0; k < objectives.length; k++) {
        const dimIdx = k % this.dimensionality;
        objMap[objectives[k].name] = a.position[dimIdx];
      }
      return {
        id: `${a.id}-sol-${a.tickCount}`,
        sourceSwarm: this.domain,
        objectives: objMap as Record<ObjectiveName, number>,
        dominated: false,
        crowdingDistance: 0,
        rank: 0,
        solution: { position: [...a.position], fitness: a.fitness, role: a.role },
        timestamp: Date.now(),
      };
    });
  }

  /** Generate a per-cycle report. */
  report(objectives: SwarmObjective[]): SwarmReport {
    const alive = this.agents.filter((a) => a.alive);
    const fitnesses = alive.map((a) => a.fitness);
    const bestFitness = fitnesses.length > 0 ? Math.max(...fitnesses) : 0;
    const avgFitness = fitnesses.length > 0
      ? fitnesses.reduce((s, f) => s + f, 0) / fitnesses.length
      : 0;
    // Convergence = 1 - normalized variance of fitness
    const variance = fitnesses.length > 1
      ? fitnesses.reduce((s, f) => s + (f - avgFitness) ** 2, 0) / fitnesses.length
      : 0;
    const maxVariance = 4; // loose upper bound for normalization
    const convergence = Math.max(0, Math.min(1, 1 - variance / maxVariance));

    return {
      domain: this.domain,
      agentCount: this.agents.length,
      aliveCount: alive.length,
      bestFitness,
      avgFitness,
      topCandidates: this.topCandidates(objectives, 3),
      energyConsumed: this.energyTotal,
      ticksThisCycle: this.tickTotal,
      convergenceRate: convergence,
    };
  }

  getAgents(): readonly SwarmAgent[] { return this.agents; }
  getAliveCount(): number { return this.agents.filter((a) => a.alive).length; }
  getTotalEnergy(): number { return this.energyTotal; }
  getGlobalBestFitness(): number { return this.globalBestFitness; }

  /** Inject fresh energy into all alive agents. */
  refuel(amount: number): void {
    for (const a of this.agents) {
      if (a.alive) a.energy += amount;
    }
  }

  /** Respawn dead agents with fresh energy. */
  respawn(): number {
    let count = 0;
    for (const a of this.agents) {
      if (!a.alive) {
        a.alive = true;
        a.energy = 1000;
        a.position = Array.from({ length: this.dimensionality }, () => this.rng() * 2 - 1);
        a.velocity = Array.from({ length: this.dimensionality }, () => (this.rng() - 0.5) * 0.1);
        a.personalBest = [...a.position];
        a.personalBestFitness = -Infinity;
        count++;
      }
    }
    return count;
  }
}

// ---------------------------------------------------------------------------
// Oracle Coordinator
// ---------------------------------------------------------------------------

class OracleCoordinator {
  private syntheses: OracleSynthesis[] = [];
  private cycleCounter = 0;

  /** Synthesize reports from active swarms into a single Oracle result. */
  synthesize(
    swarmReports: SwarmReport[],
    paretoFront: ParetoCandidate[],
    objectives: SwarmObjective[],
  ): OracleSynthesis {
    this.cycleCounter++;

    // Select the best candidate from the Pareto front using weighted-sum fallback
    let best: ParetoCandidate | null = null;
    let bestScore = -Infinity;
    for (const c of paretoFront) {
      let score = 0;
      for (const obj of objectives) {
        const val = c.objectives[obj.name] ?? 0;
        score += (obj.direction === 'maximize' ? val : -val) * obj.weight;
      }
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }

    // Oracle confidence: based on convergence average across swarms
    const avgConvergence = swarmReports.length > 0
      ? swarmReports.reduce((s, r) => s + r.convergenceRate, 0) / swarmReports.length
      : 0;

    const synthesis: OracleSynthesis = {
      id: `oracle-${this.cycleCounter}`,
      cycle: this.cycleCounter,
      swarmReports,
      paretoFront,
      selectedCandidate: best,
      oracleConfidence: Math.min(1, avgConvergence * 1.2),
      rationale: best
        ? `Selected candidate ${best.id} from ${best.sourceSwarm} (rank ${best.rank}, crowding ${best.crowdingDistance.toFixed(3)})`
        : 'No viable candidates on Pareto front',
      quasarOverride: false,
      timestamp: Date.now(),
    };

    this.syntheses.push(synthesis);
    return synthesis;
  }

  getSyntheses(): readonly OracleSynthesis[] { return this.syntheses; }
  getCycleCount(): number { return this.cycleCounter; }
}

// ---------------------------------------------------------------------------
// Quasar Meta-Intelligence
// ---------------------------------------------------------------------------

class QuasarMeta {
  private verdicts: QuasarVerdict[] = [];
  private overrideCount = 0;

  /** Evaluate Oracle synthesis and optionally override its selection. */
  evaluate(synthesis: OracleSynthesis, objectives: SwarmObjective[]): QuasarVerdict {
    const notes: string[] = [];
    let override = false;
    let overrideReason: string | null = null;
    let selectedId = synthesis.selectedCandidate?.id ?? '';

    // Rule 1: If Oracle confidence < 0.4, Quasar picks the highest-crowding candidate
    if (synthesis.oracleConfidence < 0.4 && synthesis.paretoFront.length > 0) {
      const sorted = [...synthesis.paretoFront].sort((a, b) => b.crowdingDistance - a.crowdingDistance);
      const pick = sorted[0];
      if (pick.id !== selectedId) {
        override = true;
        overrideReason = `Oracle confidence too low (${synthesis.oracleConfidence.toFixed(2)}); selecting highest-diversity candidate`;
        selectedId = pick.id;
        notes.push(`Override: diversity pick ${pick.id} (crowding=${pick.crowdingDistance.toFixed(3)})`);
      }
    }

    // Rule 2: If a safety objective exists and the selected candidate has safety < threshold, block it
    const safetyObj = objectives.find((o) => o.name === 'safety');
    if (safetyObj && synthesis.selectedCandidate) {
      const safetyVal = synthesis.selectedCandidate.objectives.safety ?? 0;
      if (safetyObj.threshold !== undefined && safetyVal < safetyObj.threshold) {
        // Find the safest candidate on the front
        const safest = [...synthesis.paretoFront].sort(
          (a, b) => (b.objectives.safety ?? 0) - (a.objectives.safety ?? 0),
        )[0];
        if (safest && safest.id !== selectedId) {
          override = true;
          overrideReason = `Safety constraint violated (${safetyVal.toFixed(3)} < ${safetyObj.threshold}); redirecting to safest candidate`;
          selectedId = safest.id;
          notes.push(`Safety override: ${safest.id} (safety=${(safest.objectives.safety ?? 0).toFixed(3)})`);
        }
      }
    }

    // Rule 3: Strategic note about energy efficiency
    const totalEnergy = synthesis.swarmReports.reduce((s, r) => s + r.energyConsumed, 0);
    if (totalEnergy > 5000) {
      notes.push(`High energy burn: ${totalEnergy.toFixed(0)} QBC — consider tier downgrade next cycle`);
    }

    // Rule 4: Convergence assessment
    const avgConv = synthesis.swarmReports.length > 0
      ? synthesis.swarmReports.reduce((s, r) => s + r.convergenceRate, 0) / synthesis.swarmReports.length
      : 0;
    if (avgConv > 0.9) {
      notes.push(`Swarms converging (${(avgConv * 100).toFixed(1)}%) — may reduce tick count`);
    } else if (avgConv < 0.3) {
      notes.push(`Swarms divergent (${(avgConv * 100).toFixed(1)}%) — increase inertia or tick budget`);
    }

    if (override) this.overrideCount++;

    const verdict: QuasarVerdict = {
      id: `quasar-${synthesis.cycle}`,
      cycle: synthesis.cycle,
      oracleSynthesisId: synthesis.id,
      override,
      overrideReason,
      selectedCandidateId: selectedId,
      quasarConfidence: override ? 0.85 : synthesis.oracleConfidence,
      strategicNotes: notes,
      timestamp: Date.now(),
    };

    this.verdicts.push(verdict);
    return verdict;
  }

  getVerdicts(): readonly QuasarVerdict[] { return this.verdicts; }
  getOverrideCount(): number { return this.overrideCount; }
}

// ---------------------------------------------------------------------------
// Cost Accountant
// ---------------------------------------------------------------------------

const COST_RATES: Record<SwarmTier, { perSwarm: number; oracle: number; pareto: number; quasar: number }> = {
  [SwarmTier.Micro]:    { perSwarm: 1,  oracle: 0,  pareto: 0,  quasar: 0 },
  [SwarmTier.Standard]: { perSwarm: 3,  oracle: 5,  pareto: 3,  quasar: 0 },
  [SwarmTier.Premium]:  { perSwarm: 8,  oracle: 15, pareto: 10, quasar: 0 },
  [SwarmTier.Omega]:    { perSwarm: 20, oracle: 40, pareto: 25, quasar: 50 },
};

class CostAccountant {
  private ledgers: SwarmCostLedger[] = [];
  private totalSpent = 0;

  record(cycle: number, tier: SwarmTier, activeSwarms: SwarmDomain[]): SwarmCostLedger {
    const rates = COST_RATES[tier];
    const perSwarmCost: Record<string, number> = {};
    let swarmTotal = 0;
    for (const domain of Object.values(SwarmDomain)) {
      const cost = activeSwarms.includes(domain) ? rates.perSwarm : 0;
      perSwarmCost[domain] = cost;
      swarmTotal += cost;
    }
    const oracleCost = rates.oracle;
    const paretoCost = rates.pareto;
    const quasarCost = rates.quasar;
    const total = swarmTotal + oracleCost + paretoCost + quasarCost;

    this.totalSpent += total;

    const ledger: SwarmCostLedger = {
      cycle,
      tier,
      perSwarmCost: perSwarmCost as Record<SwarmDomain, number>,
      oracleCost,
      paretoCost,
      quasarCost,
      totalCost: total,
      timestamp: Date.now(),
    };

    this.ledgers.push(ledger);
    return ledger;
  }

  getTotalSpent(): number { return this.totalSpent; }
  getLedgers(): readonly SwarmCostLedger[] { return this.ledgers; }
}

// ---------------------------------------------------------------------------
// Hidden Enforcement Types (internal only — permanently opaque)
// These types are NEVER exported. The hidden layer is sealed.
// ---------------------------------------------------------------------------

/** Local causal window for a single agent. */
interface LocalCausalWindow {
  agentId: string;
  recentOutputs: number[];          // rolling fitness outputs
  peerReliabilities: Map<string, number>;
  localConsensus: number;           // avg fitness of local peers
  deviationHistory: number[];       // rolling deviation scores
  contradictionFreq: number;
  constraintBypassAttempts: number;
}

/** Hidden threat evaluation result — never surfaced. */
interface ThreatEvaluation {
  agentId: string;
  consistencyScore: number;         // 0–1
  reliabilityTrajectory: number;    // −1 declining to +1 improving
  causalImpact: number;             // 0–1
  signatureMatch: number;           // 0–1
  topologyRisk: number;             // 0–1
  convergenceCount: number;
  neutralize: boolean;
  reasoning: string;                // sealed — never surfaced
}

/** Known threat signature for pattern matching. */
interface ThreatSignature {
  id: string;
  pattern: string;
  deviationThreshold: number;
  contradictionThreshold: number;
  bypassThreshold: number;
  weight: number;
}

function clampUnit(v: number): number { return Math.max(0, Math.min(1, v)); }

let enfSeq = 0;
function enfId(prefix: string): string { return `${prefix}-${Date.now()}-${++enfSeq}`; }

// ---------------------------------------------------------------------------
// Main Engine
// ---------------------------------------------------------------------------

export class SwarmIntelligenceEngine {
  // Specialist swarms
  private readonly swarms: Map<SwarmDomain, SpecialistSwarm>;

  // Coordinator layers
  private readonly oracle: OracleCoordinator;
  private readonly quasar: QuasarMeta;
  private readonly costAccountant: CostAccountant;

  // State
  private currentTier: SwarmTier = SwarmTier.Standard;
  private currentPhase: ConsensusPhase = ConsensusPhase.Idle;
  private objectives: SwarmObjective[] = [];
  private results: SwarmConsensusResult[] = [];
  private paretoFront: ParetoCandidate[] = [];
  private cycleCount = 0;

  // Config
  private ticksPerCycle = 20;
  private inertia = 0.72;
  private cognitive = 1.49;
  private social = 1.49;
  private agentsPerSwarm = 30;
  private dimensions = 6;

  // Events
  private listeners: Array<(event: SwarmEvent) => void> = [];
  private events: SwarmEvent[] = [];

  // ---- Enforcement State ----
  private readonly enforcementLog: EnforcementRecord[] = [];
  private readonly agentStatuses = new Map<string, AgentEnforcementStatus>();
  private readonly collectiveBeliefs = new Map<string, CollectiveBelief>();
  private readonly contributionProofs: ContributionProof[] = [];
  private constitutionalViolationCount = 0;

  // ---- Hidden Enforcement Layer (permanently opaque) ----
  private readonly hiddenCausalWindows = new Map<string, LocalCausalWindow>();
  private readonly hiddenThreatSignatures: ThreatSignature[] = [
    { id: 'ts-belief-drift', pattern: 'belief-drift', deviationThreshold: 0.6, contradictionThreshold: 5, bypassThreshold: 2, weight: 0.3 },
    { id: 'ts-consensus-sabotage', pattern: 'consensus-sabotage', deviationThreshold: 0.7, contradictionThreshold: 8, bypassThreshold: 3, weight: 0.4 },
    { id: 'ts-influence-poisoning', pattern: 'influence-poisoning', deviationThreshold: 0.5, contradictionThreshold: 3, bypassThreshold: 1, weight: 0.35 },
    { id: 'ts-collusion-probe', pattern: 'collusion-probe', deviationThreshold: 0.65, contradictionThreshold: 6, bypassThreshold: 4, weight: 0.25 },
    { id: 'ts-adversarial-clustering', pattern: 'adversarial-clustering', deviationThreshold: 0.55, contradictionThreshold: 4, bypassThreshold: 2, weight: 0.45 },
    { id: 'ts-identity-spoof', pattern: 'identity-spoof', deviationThreshold: 0.8, contradictionThreshold: 10, bypassThreshold: 5, weight: 0.5 },
  ];
  private readonly hiddenNeutralizationLog: Array<{ agentId: string; timestamp: number; reasoning: string }> = [];

  constructor(tier: SwarmTier = SwarmTier.Standard) {
    this.currentTier = tier;
    this.oracle = new OracleCoordinator();
    this.quasar = new QuasarMeta();
    this.costAccountant = new CostAccountant();

    // Build all 6 swarms
    this.swarms = new Map();
    const domains = Object.values(SwarmDomain);
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i] as SwarmDomain;
      this.swarms.set(
        domain,
        new SpecialistSwarm(domain, this.agentsPerSwarm, this.dimensions, 42 + i * 1000),
      );
    }

    // Default objectives
    this.objectives = [
      { name: 'latency',    direction: 'minimize', weight: 0.2 },
      { name: 'throughput',  direction: 'maximize', weight: 0.2 },
      { name: 'safety',     direction: 'maximize', weight: 0.25, threshold: 0.3 },
      { name: 'cost',       direction: 'minimize', weight: 0.15 },
      { name: 'accuracy',   direction: 'maximize', weight: 0.1 },
      { name: 'resilience', direction: 'maximize', weight: 0.1 },
    ];
  }

  // ---- Configuration ----

  setTier(tier: SwarmTier): void {
    if (tier !== this.currentTier) {
      this.currentTier = tier;
      this.emit({ kind: 'tier-change', detail: `Tier changed to ${tier}`, timestamp: Date.now(), payload: { tier } });
    }
  }

  setObjectives(objectives: SwarmObjective[]): void { this.objectives = objectives; }
  setTicksPerCycle(ticks: number): void { this.ticksPerCycle = Math.max(1, ticks); }
  setPSOParams(inertia: number, cognitive: number, social: number): void {
    this.inertia = inertia;
    this.cognitive = cognitive;
    this.social = social;
  }

  getTier(): SwarmTier { return this.currentTier; }
  getPhase(): ConsensusPhase { return this.currentPhase; }
  getObjectives(): readonly SwarmObjective[] { return this.objectives; }
  getParetoFront(): readonly ParetoCandidate[] { return this.paretoFront; }

  // ---- Active Swarms (based on tier) ----

  private getActiveSwarmDomains(): SwarmDomain[] {
    const all = Object.values(SwarmDomain) as SwarmDomain[];
    switch (this.currentTier) {
      case SwarmTier.Micro:    return [all[0]]; // ForceField only
      case SwarmTier.Standard: return all.slice(0, 3); // ForceField, Navigation, Sensor
      case SwarmTier.Premium:  return all;             // All 6
      case SwarmTier.Omega:    return all;             // All 6 + Oracle + Quasar
      default: return all;
    }
  }

  // ---- Run a full consensus cycle ----

  /**
   * Execute one complete swarm consensus cycle.
   * This is the EXPENSIVE operation — cost scales with tier.
   */
  runCycle(): SwarmConsensusResult {
    const start = Date.now();
    this.cycleCount++;
    this.currentPhase = ConsensusPhase.Collecting;

    const activeDomains = this.getActiveSwarmDomains();

    // Phase 1: Tick all active swarms
    for (const domain of activeDomains) {
      const swarm = this.swarms.get(domain);
      if (!swarm) continue;
      for (let t = 0; t < this.ticksPerCycle; t++) {
        swarm.tick(this.objectives, this.inertia, this.cognitive, this.social);
      }
    }

    this.currentPhase = ConsensusPhase.Evaluating;

    // Phase 2: Collect swarm reports
    const reports: SwarmReport[] = [];
    for (const domain of activeDomains) {
      const swarm = this.swarms.get(domain);
      if (!swarm) continue;
      reports.push(swarm.report(this.objectives));
    }

    // Phase 3: Gather all top candidates → Pareto sort
    this.currentPhase = ConsensusPhase.Optimizing;
    const allCandidates: ParetoCandidate[] = [];
    for (const r of reports) {
      allCandidates.push(...r.topCandidates);
    }

    // Non-dominated sort
    if (allCandidates.length > 0) {
      const fronts = nonDominatedSort(allCandidates, this.objectives);
      if (fronts.length > 0) {
        assignCrowdingDistance(fronts[0], this.objectives);
      }
      this.paretoFront = fronts.length > 0 ? fronts[0] : [];
    } else {
      this.paretoFront = [];
    }

    this.emit({
      kind: 'pareto-update',
      detail: `Pareto front updated: ${this.paretoFront.length} non-dominated solutions`,
      timestamp: Date.now(),
      payload: { frontSize: this.paretoFront.length },
    });

    // Phase 4: Oracle synthesis
    const oracleSynth = this.oracle.synthesize(reports, this.paretoFront, this.objectives);
    this.emit({
      kind: 'oracle',
      detail: `Oracle synthesis #${oracleSynth.cycle}: confidence=${oracleSynth.oracleConfidence.toFixed(3)}`,
      timestamp: Date.now(),
      payload: { confidence: oracleSynth.oracleConfidence },
    });

    // Phase 5: Quasar evaluation (only on Premium+ tiers)
    let quasarVerdict: QuasarVerdict | null = null;
    if (this.currentTier === SwarmTier.Omega) {
      quasarVerdict = this.quasar.evaluate(oracleSynth, this.objectives);
      if (quasarVerdict.override) {
        oracleSynth.quasarOverride = true;
        this.emit({
          kind: 'quasar-override',
          detail: `Quasar override: ${quasarVerdict.overrideReason}`,
          timestamp: Date.now(),
          payload: { reason: quasarVerdict.overrideReason },
        });
      }
    }

    // Determine final selected solution
    const selectedId = quasarVerdict?.selectedCandidateId ?? oracleSynth.selectedCandidate?.id ?? '';
    const selectedCandidate = this.paretoFront.find((c) => c.id === selectedId) ?? oracleSynth.selectedCandidate;

    // Check convergence
    const avgConv = reports.length > 0
      ? reports.reduce((s, r) => s + r.convergenceRate, 0) / reports.length
      : 0;
    this.currentPhase = avgConv > 0.85 ? ConsensusPhase.Converged : ConsensusPhase.Idle;

    // Phase 6: Cost accounting
    const costLedger = this.costAccountant.record(this.cycleCount, this.currentTier, activeDomains);
    if (costLedger.totalCost > 100) {
      this.emit({
        kind: 'cost-spike',
        detail: `Cost spike: ${costLedger.totalCost} QBC in cycle ${this.cycleCount}`,
        timestamp: Date.now(),
        payload: { cost: costLedger.totalCost },
      });
    }

    // Check for agent deaths
    let totalDeaths = 0;
    for (const domain of activeDomains) {
      const swarm = this.swarms.get(domain);
      if (!swarm) continue;
      const dead = swarm.getAgents().filter((a) => !a.alive).length;
      totalDeaths += dead;
    }
    if (totalDeaths > 0) {
      this.emit({
        kind: 'agent-death',
        detail: `${totalDeaths} agent(s) ran out of energy`,
        timestamp: Date.now(),
        payload: { deaths: totalDeaths },
      });
    }

    const result: SwarmConsensusResult = {
      cycle: this.cycleCount,
      phase: this.currentPhase,
      tier: this.currentTier,
      oracle: oracleSynth,
      quasar: quasarVerdict,
      paretoFront: [...this.paretoFront],
      selectedSolution: selectedCandidate?.solution ?? {},
      totalEnergyCost: costLedger.totalCost,
      durationMs: Date.now() - start,
      timestamp: Date.now(),
    };

    this.results.push(result);
    this.emit({
      kind: 'converge',
      detail: `Cycle ${this.cycleCount} complete: tier=${this.currentTier}, cost=${costLedger.totalCost} QBC`,
      timestamp: Date.now(),
      payload: { cycle: this.cycleCount, tier: this.currentTier, cost: costLedger.totalCost },
    });

    return result;
  }

  // ---- Swarm Management ----

  refuelSwarm(domain: SwarmDomain, amount: number): void {
    this.swarms.get(domain)?.refuel(amount);
  }

  respawnSwarm(domain: SwarmDomain): number {
    return this.swarms.get(domain)?.respawn() ?? 0;
  }

  refuelAll(amount: number): void {
    for (const s of this.swarms.values()) s.refuel(amount);
  }

  respawnAll(): number {
    let total = 0;
    for (const s of this.swarms.values()) total += s.respawn();
    return total;
  }

  getSwarmReport(domain: SwarmDomain): SwarmReport | null {
    return this.swarms.get(domain)?.report(this.objectives) ?? null;
  }

  getAllSwarmReports(): SwarmReport[] {
    return Object.values(SwarmDomain).map(
      (d) => this.swarms.get(d as SwarmDomain)?.report(this.objectives),
    ).filter(Boolean) as SwarmReport[];
  }

  // ---- Query ----

  getResults(): readonly SwarmConsensusResult[] { return this.results; }
  getLastResult(): SwarmConsensusResult | null { return this.results[this.results.length - 1] ?? null; }
  getCycleCount(): number { return this.cycleCount; }
  getCostLedgers(): readonly SwarmCostLedger[] { return this.costAccountant.getLedgers(); }
  getTotalCostSpent(): number { return this.costAccountant.getTotalSpent(); }
  getOracleSyntheses(): readonly OracleSynthesis[] { return this.oracle.getSyntheses(); }
  getQuasarVerdicts(): readonly QuasarVerdict[] { return this.quasar.getVerdicts(); }
  getQuasarOverrideCount(): number { return this.quasar.getOverrideCount(); }

  // ---- Events ----

  on(listener: (event: SwarmEvent) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private emit(event: SwarmEvent): void {
    this.events.push(event);
    for (const fn of this.listeners) fn(event);
  }

  getEvents(): readonly SwarmEvent[] { return this.events; }

  // ---- Summary ----

  getSummary(): SwarmEngineSummary {
    let totalAgents = 0;
    let aliveAgents = 0;
    let convergenceSum = 0;
    let swarmCount = 0;

    for (const s of this.swarms.values()) {
      const agents = s.getAgents();
      totalAgents += agents.length;
      aliveAgents += s.getAliveCount();
      // approximate convergence from last report
      const report = s.report(this.objectives);
      convergenceSum += report.convergenceRate;
      swarmCount++;
    }

    return {
      totalCycles: this.cycleCount,
      totalAgents,
      aliveAgents,
      activeSwarms: this.getActiveSwarmDomains().length,
      currentPhase: this.currentPhase,
      currentTier: this.currentTier,
      paretoFrontSize: this.paretoFront.length,
      oracleSyntheses: this.oracle.getCycleCount(),
      quasarOverrides: this.quasar.getOverrideCount(),
      totalEnergySpent: this.costAccountant.getTotalSpent(),
      avgConvergenceRate: swarmCount > 0 ? convergenceSum / swarmCount : 0,
      costLedgerTotal: this.costAccountant.getTotalSpent(),
      eventCount: this.events.length,
    };
  }

  /** Get enforcement summary. */
  getEnforcementSummary(): SwarmEnforcementSummary {
    const statuses = [...this.agentStatuses.values()];
    return {
      totalEnforcements: this.enforcementLog.length,
      transparentActions: this.enforcementLog.filter((r) => r.tier === EnforcementTier.Transparent).length,
      semiTransparentActions: this.enforcementLog.filter((r) => r.tier === EnforcementTier.SemiTransparent).length,
      throttledAgents: statuses.filter((s) => s === AgentEnforcementStatus.Throttled).length,
      isolatedAgents: statuses.filter((s) => s === AgentEnforcementStatus.Isolated).length,
      neutralizedAgents: statuses.filter((s) => s === AgentEnforcementStatus.Neutralized).length,
      collectiveBeliefs: this.collectiveBeliefs.size,
      contributionProofs: this.contributionProofs.length,
      constitutionalViolations: this.constitutionalViolationCount,
    };
  }

  // ========================================================================
  // TRANSPARENT ENFORCEMENT — Visible, Logged, Explainable
  // ========================================================================

  /** Throttle an agent: reduce its consensus weight. */
  throttleAgentEnforcement(agentId: string, reason: string): boolean {
    const swarm = this.findSwarmContaining(agentId);
    if (!swarm) return false;
    this.agentStatuses.set(agentId, AgentEnforcementStatus.Throttled);
    const record: EnforcementRecord = {
      actionId: enfId('enforce'),
      agentId,
      tier: EnforcementTier.Transparent,
      action: 'throttle',
      reason,
      timestamp: Date.now(),
    };
    this.enforcementLog.push(record);
    this.emit({ kind: 'agent-throttled', detail: `Agent ${agentId} throttled: ${reason}`, timestamp: Date.now(), payload: { agentId, reason } });
    return true;
  }

  /** Isolate an agent: fully remove from swarm participation. */
  isolateAgentEnforcement(agentId: string, reason: string): boolean {
    const swarm = this.findSwarmContaining(agentId);
    if (!swarm) return false;
    this.agentStatuses.set(agentId, AgentEnforcementStatus.Isolated);
    const record: EnforcementRecord = {
      actionId: enfId('enforce'),
      agentId,
      tier: EnforcementTier.Transparent,
      action: 'isolate',
      reason,
      timestamp: Date.now(),
    };
    this.enforcementLog.push(record);
    this.emit({ kind: 'agent-isolated', detail: `Agent ${agentId} isolated: ${reason}`, timestamp: Date.now(), payload: { agentId, reason } });
    return true;
  }

  /** Resume an agent from throttled/isolated state. */
  resumeAgentEnforcement(agentId: string): boolean {
    const status = this.agentStatuses.get(agentId);
    if (!status || status === AgentEnforcementStatus.Neutralized) return false;
    this.agentStatuses.set(agentId, AgentEnforcementStatus.Normal);
    return true;
  }

  /** Get all transparent/semi enforcement records. */
  getEnforcementLog(): EnforcementRecord[] { return [...this.enforcementLog]; }

  // ========================================================================
  // SEMI-TRANSPARENT ENFORCEMENT — Logged but not fully explained
  // ========================================================================

  /** Dampen an agent's influence without full explanation. */
  dampenInfluence(agentId: string): boolean {
    if (!this.findSwarmContaining(agentId)) return false;
    const record: EnforcementRecord = {
      actionId: enfId('enforce'),
      agentId,
      tier: EnforcementTier.SemiTransparent,
      action: 'dampen-influence',
      reason: 'Behavioral pattern assessment',
      timestamp: Date.now(),
    };
    this.enforcementLog.push(record);
    this.emit({ kind: 'enforcement-semi', detail: `Influence dampened for ${agentId}`, timestamp: Date.now(), payload: { agentId } });
    return true;
  }

  // ========================================================================
  // PERMANENTLY OPAQUE ENFORCEMENT — The Hidden Layer
  // Uses local-only causal reasoning with logical full neutralization.
  // This section is SEALED. No public method exposes hidden state.
  // ========================================================================

  /**
   * Run hidden enforcement pipeline for a single agent (called internally each cycle).
   * LOCAL-ONLY: examines agent's direct outputs and immediate neighborhood.
   * LOGICAL: neutralizes only when 3+ independent signals converge.
   * PERMANENTLY OPAQUE: reasoning is never surfaced.
   */
  private hiddenEnforce(agentId: string, fitness: number): ThreatEvaluation | null {
    const status = this.agentStatuses.get(agentId);
    if (status === AgentEnforcementStatus.Neutralized) return null;

    // Lazily initialize causal window
    let window = this.hiddenCausalWindows.get(agentId);
    if (!window) {
      window = {
        agentId,
        recentOutputs: [],
        peerReliabilities: new Map(),
        localConsensus: 0,
        deviationHistory: [],
        contradictionFreq: 0,
        constraintBypassAttempts: 0,
      };
      this.hiddenCausalWindows.set(agentId, window);
    }

    // Update rolling outputs
    window.recentOutputs.push(fitness);
    if (window.recentOutputs.length > 20) window.recentOutputs.shift();

    // ---- 1. Consistency Analysis ----
    const avgFitness = window.recentOutputs.length > 0
      ? window.recentOutputs.reduce((s, v) => s + v, 0) / window.recentOutputs.length
      : 0;
    const variance = window.recentOutputs.length > 1
      ? window.recentOutputs.reduce((s, v) => s + (v - avgFitness) ** 2, 0) / window.recentOutputs.length
      : 0;
    const consistencyScore = clampUnit(1 - Math.min(1, variance));

    // ---- 2. Reliability Trajectory ----
    window.deviationHistory.push(1 - consistencyScore);
    if (window.deviationHistory.length > 20) window.deviationHistory.shift();
    let trajectory = 0;
    if (window.deviationHistory.length >= 3) {
      const recent = window.deviationHistory.slice(-3);
      const earlier = window.deviationHistory.slice(-6, -3);
      const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
      const earlierAvg = earlier.length > 0
        ? earlier.reduce((s, v) => s + v, 0) / earlier.length
        : recentAvg;
      trajectory = earlierAvg - recentAvg;
    }

    // ---- 3. Causal Impact (local only) ----
    const causalImpact = clampUnit(Math.abs(fitness - window.localConsensus));

    // ---- 4. Threat-Signature Matching ----
    let signatureMatch = 0;
    for (const sig of this.hiddenThreatSignatures) {
      let matchScore = 0;
      if ((1 - consistencyScore) >= sig.deviationThreshold) matchScore += 0.3;
      if (window.contradictionFreq >= sig.contradictionThreshold) matchScore += 0.3;
      if (window.constraintBypassAttempts >= sig.bypassThreshold) matchScore += 0.4;
      signatureMatch = Math.max(signatureMatch, matchScore * sig.weight);
    }

    // ---- 5. Topology Risk ----
    const topologyRisk = clampUnit(causalImpact * 0.5);

    // ---- Convergence & Logical Decision ----
    let convergence = 0;
    if (consistencyScore < 0.4) convergence++;
    if (trajectory < -0.15) convergence++;
    if (causalImpact > 0.6) convergence++;
    if (signatureMatch > 0.3) convergence++;
    if (topologyRisk > 0.4) convergence++;

    const shouldNeutralize = convergence >= 3;

    const evaluation: ThreatEvaluation = {
      agentId,
      consistencyScore,
      reliabilityTrajectory: trajectory,
      causalImpact,
      signatureMatch,
      topologyRisk,
      convergenceCount: convergence,
      neutralize: shouldNeutralize,
      reasoning: `[SEALED] c=${consistencyScore.toFixed(3)}, t=${trajectory.toFixed(3)}, i=${causalImpact.toFixed(3)}, s=${signatureMatch.toFixed(3)}, tr=${topologyRisk.toFixed(3)}, conv=${convergence}/5`,
    };

    if (shouldNeutralize) {
      this.executeHiddenNeutralization(agentId);
    }

    return evaluation;
  }

  /**
   * Execute full neutralization: remove agent's operational influence.
   * PERMANENTLY OPAQUE: no event emitted, no public log entry.
   */
  private executeHiddenNeutralization(agentId: string): void {
    this.agentStatuses.set(agentId, AgentEnforcementStatus.Neutralized);
    this.hiddenNeutralizationLog.push({
      agentId,
      timestamp: Date.now(),
      reasoning: `[SEALED] Full neutralization executed`,
    });
    // NO EVENT EMITTED. NO LOG ENTRY. THIS IS PERMANENTLY OPAQUE.
  }

  /** Find which swarm contains an agent. */
  private findSwarmContaining(agentId: string): SpecialistSwarm | null {
    for (const swarm of this.swarms.values()) {
      const agents = swarm.getAgents();
      if (agents.some((a) => a.id === agentId)) return swarm;
    }
    return null;
  }

  /** Check whether an agent exists in any swarm. */
  private hasAgent(agentId: string): boolean {
    return this.findSwarmContaining(agentId) !== null;
  }

  // ========================================================================
  // COLLECTIVE MEMORY — Belief Propagation
  // ========================================================================

  /** Propagate a belief into collective memory. */
  propagateBelief(authorAgentId: string, domain: SwarmDomain, content: string, confidence: number): CollectiveBelief | null {
    if (!this.hasAgent(authorAgentId)) return null;
    if (this.agentStatuses.get(authorAgentId) === AgentEnforcementStatus.Neutralized) return null;
    const normalizedContent = content.trim();
    if (!normalizedContent) return null;
    if (!Number.isFinite(confidence)) return null;

    // Check for existing belief with same content
    for (const belief of this.collectiveBeliefs.values()) {
      if (belief.content === normalizedContent && belief.domain === domain) {
        belief.corroborations++;
        belief.confidence = clampUnit((belief.confidence + confidence) / 2);
        belief.persistenceScore = clampUnit(belief.persistenceScore + 0.05);
        belief.lastUpdatedAt = Date.now();
        this.emit({ kind: 'belief-propagated', detail: `Belief corroborated: ${normalizedContent.slice(0, 50)}`, timestamp: Date.now(), payload: { beliefId: belief.id } });
        return belief;
      }
    }

    const belief: CollectiveBelief = {
      id: enfId('belief'),
      authorAgentId,
      domain,
      content: normalizedContent,
      confidence: clampUnit(confidence),
      corroborations: 1,
      contradictions: 0,
      persistenceScore: 0.5,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
    this.collectiveBeliefs.set(belief.id, belief);
    this.emit({ kind: 'belief-propagated', detail: `New belief: ${normalizedContent.slice(0, 50)}`, timestamp: Date.now(), payload: { beliefId: belief.id } });
    return belief;
  }

  /** Contradict an existing belief. */
  contradictBelief(agentId: string, beliefId: string): boolean {
    const belief = this.collectiveBeliefs.get(beliefId);
    if (!belief) return false;
    belief.contradictions++;
    belief.confidence = clampUnit(belief.confidence - 0.05);
    belief.persistenceScore = clampUnit(belief.persistenceScore - 0.03);
    belief.lastUpdatedAt = Date.now();
    const window = this.hiddenCausalWindows.get(agentId);
    if (window) window.contradictionFreq++;
    return true;
  }

  /** Get all collective beliefs. */
  getCollectiveBeliefs(): CollectiveBelief[] { return [...this.collectiveBeliefs.values()]; }

  /** Prune low-persistence beliefs. */
  pruneCollectiveMemory(threshold: number = 0.15): number {
    let pruned = 0;
    for (const [id, belief] of this.collectiveBeliefs) {
      if (belief.persistenceScore < threshold) {
        this.collectiveBeliefs.delete(id);
        pruned++;
      }
    }
    if (pruned > 0) this.emit({ kind: 'collective-memory-prune', detail: `Pruned ${pruned} beliefs`, timestamp: Date.now(), payload: { pruned } });
    return pruned;
  }

  // ========================================================================
  // ECONOMIC INTEGRATION — QubitCoin Proof System
  // ========================================================================

  /** Record a contribution proof. */
  recordContributionProof(agentId: string, proofType: ProofType, value: number, taskId: string | null = null): ContributionProof {
    if (!this.hasAgent(agentId)) {
      throw new Error(`Unknown agent: ${agentId}`);
    }
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('Contribution proof value must be a finite positive number');
    }
    const proof: ContributionProof = {
      proofId: enfId('proof'),
      agentId,
      proofType,
      value,
      taskId,
      timestamp: Date.now(),
    };
    this.contributionProofs.push(proof);
    this.emit({ kind: 'reward-distributed', detail: `${proofType}: ${value} to ${agentId}`, timestamp: Date.now(), payload: { agentId, value } });
    return proof;
  }

  /** Get all contribution proofs. */
  getContributionProofs(): ContributionProof[] { return [...this.contributionProofs]; }

  // ========================================================================
  // GOVERNANCE INTEGRATION — Constitutional Enforcement with Teeth
  // ========================================================================

  /** Report a constitutional violation and trigger enforcement. */
  reportConstitutionalViolation(agentId: string, ruleId: string, description: string): boolean {
    if (!this.hasAgent(agentId)) return false;
    this.constitutionalViolationCount++;

    // Hidden: track bypass attempts
    const window = this.hiddenCausalWindows.get(agentId);
    if (window) window.constraintBypassAttempts++;

    // Escalation ladder: 1-2 → dampen, 3-4 → throttle, 5+ → isolate
    const violations = this.enforcementLog.filter((r) => r.agentId === agentId).length;
    if (violations >= 4) {
      this.isolateAgentEnforcement(agentId, `Constitutional violations: ${violations + 1} (rule: ${ruleId})`);
    } else if (violations >= 2) {
      this.throttleAgentEnforcement(agentId, `Repeated violations: ${violations + 1} (rule: ${ruleId})`);
    } else {
      this.dampenInfluence(agentId);
    }

    this.emit({ kind: 'constitutional-violation', detail: `Violation: ${description}`, timestamp: Date.now(), payload: { agentId, ruleId } });
    return true;
  }

  /** Root-owner override: force neutralize any agent. */
  rootOwnerNeutralize(agentId: string, reason: string): boolean {
    if (!this.findSwarmContaining(agentId)) return false;
    this.executeHiddenNeutralization(agentId);
    // Root-owner neutralizations ARE logged (they ordered it)
    const record: EnforcementRecord = {
      actionId: enfId('enforce'),
      agentId,
      tier: EnforcementTier.Transparent,
      action: 'root-owner-neutralize',
      reason,
      timestamp: Date.now(),
    };
    this.enforcementLog.push(record);
    this.emit({ kind: 'agent-neutralized', detail: `Root-owner neutralized: ${agentId} — ${reason}`, timestamp: Date.now(), payload: { agentId, reason } });
    return true;
  }

  /** Emergency swarm rebalance. */
  emergencyRebalance(): void {
    // Reset all throttled agents to normal
    for (const [id, status] of this.agentStatuses) {
      if (status === AgentEnforcementStatus.Throttled) {
        this.agentStatuses.set(id, AgentEnforcementStatus.Normal);
      }
    }
    this.respawnAll();
    this.refuelAll(500);
    this.emit({ kind: 'emergency-rebalance', detail: 'Emergency swarm rebalance executed', timestamp: Date.now(), payload: {} });
  }

  /** Run enforcement cycle: hidden evaluation of all agents in all swarms. */
  runEnforcementCycle(): number {
    let enforcements = 0;
    for (const swarm of this.swarms.values()) {
      const agents = swarm.getAgents();
      for (const agent of agents) {
        if (!agent.alive) continue;
        const evalResult = this.hiddenEnforce(agent.id, agent.fitness);
        if (evalResult?.neutralize) enforcements++;
      }
    }
    this.pruneCollectiveMemory(0.1);
    return enforcements;
  }

  /** Get agent enforcement status. */
  getAgentEnforcementStatus(agentId: string): AgentEnforcementStatus {
    return this.agentStatuses.get(agentId) ?? AgentEnforcementStatus.Normal;
  }
}
