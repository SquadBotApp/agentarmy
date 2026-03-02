// ---------------------------------------------------------------------------
// Transcendent Mission Layer
// ---------------------------------------------------------------------------
// The highest operational layer where the OS executes missions that span
// multiple domains, time horizons, civilizations, and abstraction levels.
// These missions are self-evolving, multi-scale intelligence programs
// that are cross-domain, cross-temporal, self-optimizing, self-correcting,
// self-governing, multi-agent, economy-aware, safety-aligned, and globally
// coordinated.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TranscendentScale =
  | 'local'
  | 'regional'
  | 'planetary'
  | 'civilization'
  | 'multi-civilization'
  | 'epoch';

export type MissionLifecycle =
  | 'designing'
  | 'compiling'
  | 'executing'
  | 'evolving'
  | 'completed'
  | 'suspended'
  | 'failed';

export interface TranscendentObjective {
  id: string;
  description: string;
  scale: TranscendentScale;
  domains: string[];
  timeHorizon: { min: number; max: number; unit: 'hours' | 'days' | 'years' | 'decades' | 'centuries' };
  priority: number;         // 0-1
  safetyWeight: number;     // 0-1
}

export interface EvolutionRecord {
  generation: number;
  timestamp: string;
  fitnessScore: number;     // 0-1
  mutations: string[];
  parentVersion: number | null;
}

export interface TranscendentMissionDef {
  id: string;
  name: string;
  description: string;
  scale: TranscendentScale;
  lifecycle: MissionLifecycle;
  objectives: TranscendentObjective[];
  domains: string[];
  agents: string[];          // agent IDs
  economyBudgetQb: number;
  safetyPosture: 'standard' | 'elevated' | 'maximum';
  evolutionHistory: EvolutionRecord[];
  currentGeneration: number;
  fitnessScore: number;
  coordinationScore: number; // 0-1 how well agents cooperate
  createdAt: string;
  lastEvolvedAt: string;
}

export interface TranscendentMissionSummary {
  totalMissions: number;
  byScale: Record<string, number>;
  byLifecycle: Record<string, number>;
  averageFitness: number;
  averageCoordination: number;
  totalObjectives: number;
  totalEvolutions: number;
  domainsSpanned: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class TranscendentMissionEngine {
  private readonly missions: Map<string, TranscendentMissionDef> = new Map();

  // ---- Mission Lifecycle ----

  createMission(
    name: string,
    description: string,
    scale: TranscendentScale,
    domains: string[] = [],
    budgetQb = 1000,
    safetyPosture: TranscendentMissionDef['safetyPosture'] = 'standard',
  ): TranscendentMissionDef {
    const id = `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const mission: TranscendentMissionDef = {
      id,
      name,
      description,
      scale,
      lifecycle: 'designing',
      objectives: [],
      domains,
      agents: [],
      economyBudgetQb: budgetQb,
      safetyPosture,
      evolutionHistory: [],
      currentGeneration: 0,
      fitnessScore: 0,
      coordinationScore: 0,
      createdAt: now,
      lastEvolvedAt: now,
    };
    this.missions.set(id, mission);
    return mission;
  }

  getMission(id: string): TranscendentMissionDef | undefined {
    return this.missions.get(id);
  }

  removeMission(id: string): boolean {
    return this.missions.delete(id);
  }

  // ---- Objectives ----

  addObjective(
    missionId: string,
    description: string,
    scale: TranscendentScale,
    domains: string[],
    timeHorizon: TranscendentObjective['timeHorizon'],
    priority = 0.5,
    safetyWeight = 0.5,
  ): TranscendentObjective | null {
    const m = this.missions.get(missionId);
    if (!m) return null;

    const obj: TranscendentObjective = {
      id: `to-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description,
      scale,
      domains,
      timeHorizon,
      priority,
      safetyWeight,
    };
    m.objectives.push(obj);
    return obj;
  }

  // ---- Agent Assignment ----

  assignAgent(missionId: string, agentId: string): boolean {
    const m = this.missions.get(missionId);
    if (!m || m.agents.includes(agentId)) return false;
    m.agents.push(agentId);
    return true;
  }

  removeAgent(missionId: string, agentId: string): boolean {
    const m = this.missions.get(missionId);
    if (!m) return false;
    const before = m.agents.length;
    m.agents = m.agents.filter((a) => a !== agentId);
    return m.agents.length < before;
  }

  // ---- Lifecycle Transitions ----

  compile(missionId: string): boolean {
    const m = this.missions.get(missionId);
    if (!m || m.lifecycle !== 'designing') return false;
    if (m.objectives.length === 0) return false;
    m.lifecycle = 'compiling';
    // Simulate compilation
    m.lifecycle = 'executing';
    return true;
  }

  suspend(missionId: string): boolean {
    const m = this.missions.get(missionId);
    if (!m || m.lifecycle !== 'executing') return false;
    m.lifecycle = 'suspended';
    return true;
  }

  resume(missionId: string): boolean {
    const m = this.missions.get(missionId);
    if (!m || m.lifecycle !== 'suspended') return false;
    m.lifecycle = 'executing';
    return true;
  }

  complete(missionId: string, success: boolean): boolean {
    const m = this.missions.get(missionId);
    if (!m || (m.lifecycle !== 'executing' && m.lifecycle !== 'evolving')) return false;
    m.lifecycle = success ? 'completed' : 'failed';
    return true;
  }

  // ---- Self‑Evolution ----

  /** Evolve a mission: mutate its strategy and record the generation. */
  evolve(missionId: string, mutations: string[]): EvolutionRecord | null {
    const m = this.missions.get(missionId);
    if (!m || m.lifecycle === 'completed' || m.lifecycle === 'failed') return null;

    m.currentGeneration++;
    m.lifecycle = 'evolving';
    const now = new Date().toISOString();

    // Fitness improves slightly with each evolution
    m.fitnessScore = Math.min(1, m.fitnessScore + 0.02 + Math.random() * 0.05);
    m.coordinationScore = Math.min(1, m.coordinationScore + 0.01 + Math.random() * 0.03);

    const record: EvolutionRecord = {
      generation: m.currentGeneration,
      timestamp: now,
      fitnessScore: Number(m.fitnessScore.toFixed(4)),
      mutations,
      parentVersion: m.currentGeneration > 1 ? m.currentGeneration - 1 : null,
    };
    m.evolutionHistory.push(record);
    m.lastEvolvedAt = now;
    m.lifecycle = 'executing';
    return record;
  }

  // ---- Query ----

  getMissionsByScale(scale: TranscendentScale): TranscendentMissionDef[] {
    return Array.from(this.missions.values()).filter((m) => m.scale === scale);
  }

  getActiveMissions(): TranscendentMissionDef[] {
    return Array.from(this.missions.values()).filter(
      (m) => m.lifecycle === 'executing' || m.lifecycle === 'evolving',
    );
  }

  // ---- Summary ----

  getSummary(): TranscendentMissionSummary {
    const byScale: Record<string, number> = {};
    const byLifecycle: Record<string, number> = {};
    let fitnessSum = 0;
    let coordSum = 0;
    let totalObj = 0;
    let totalEvo = 0;
    const allDomains = new Set<string>();

    for (const m of this.missions.values()) {
      byScale[m.scale] = (byScale[m.scale] ?? 0) + 1;
      byLifecycle[m.lifecycle] = (byLifecycle[m.lifecycle] ?? 0) + 1;
      fitnessSum += m.fitnessScore;
      coordSum += m.coordinationScore;
      totalObj += m.objectives.length;
      totalEvo += m.evolutionHistory.length;
      for (const d of m.domains) allDomains.add(d);
    }

    const count = this.missions.size;
    return {
      totalMissions: count,
      byScale,
      byLifecycle,
      averageFitness: count > 0 ? Number((fitnessSum / count).toFixed(4)) : 0,
      averageCoordination: count > 0 ? Number((coordSum / count).toFixed(4)) : 0,
      totalObjectives: totalObj,
      totalEvolutions: totalEvo,
      domainsSpanned: allDomains.size,
    };
  }
}
