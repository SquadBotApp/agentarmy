/**
 * Deployment Store – Zustand frontend for the Deployment Orchestrator.
 *
 * Mirrors the Python DeploymentOrchestrator state, fetches from the
 * orchestration API, and exposes mission lifecycle operations
 * (create, deploy, list, stats).
 */

import { create } from 'zustand';

// =============================================================================
// TYPES (match deployment_orchestrator.py)
// =============================================================================

export type NodeType = 'agent' | 'tool' | 'logic' | 'gate' | 'parallel' | 'aggregate' | 'synthesize';
export type MissionStatus = 'planning' | 'deploying' | 'running' | 'adapting' | 'completed' | 'failed' | 'aborted';

export interface MissionNodeInfo {
  label: string;
  type: NodeType;
  role: string;
  agent: string | null;
  runner: string | null;
  status: string;
  risk: string;
  zpe: number;
  cost: number;
  latency_ms: number;
}

export interface MissionInfo {
  mission_id: string;
  goal: string;
  domain: string;
  status: MissionStatus;
  budget_qb: number;
  spent_qb: number;
  risk_tolerance: number;
  node_count: number;
  adaptation_count: number;
  created_at: string;
  completed_at: string | null;
  nodes: Record<string, MissionNodeInfo>;
}

export interface RunnerInfo {
  runner_id: string;
  specialization: string[];
  latency_avg_ms: number;
  cost_per_call: number;
  tools: string[];
  safety_cleared: boolean;
  load: number;
  max_concurrent: number;
}

export interface DeploymentStats {
  total_missions: number;
  completed: number;
  failed: number;
  running: number;
  total_cost_qb: number;
  avg_cost_qb: number;
  total_adaptations: number;
  runners: number;
  event_log_size: number;
}

export interface DeploymentEventInfo {
  event_id: string;
  mission_id: string;
  event_type: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface DeploymentSnapshot {
  stats: DeploymentStats;
  missions: Record<string, MissionInfo>;
  runners: Record<string, RunnerInfo>;
  recent_events: DeploymentEventInfo[];
}

// =============================================================================
// STORE STATE
// =============================================================================

interface DeploymentState {
  // Data
  stats: DeploymentStats | null;
  missions: Record<string, MissionInfo>;
  runners: Record<string, RunnerInfo>;
  recentEvents: DeploymentEventInfo[];
  loading: boolean;
  error: string | null;

  // Fetch
  fetchAll: () => Promise<void>;

  // Actions
  deployMission: (
    goal: string,
    domain?: string,
    riskTolerance?: number,
    budgetQb?: number,
  ) => Promise<MissionDeployResult | null>;

  getMission: (missionId: string) => MissionInfo | undefined;
}

export interface MissionDeployResult {
  mission_id: string;
  goal: string;
  status: string;
  team: Record<string, string>;
  team_rationale: Record<string, string>;
  risk_assessment: string;
  estimated_cost: number;
  actual_cost: number;
  nodes: Record<string, MissionNodeInfo>;
  adaptations: number;
  created_at: string;
  completed_at: string | null;
}

// =============================================================================
// HELPERS
// =============================================================================

const API_BASE = process.env.REACT_APP_ORCH_URL || 'http://localhost:5000';

async function apiPost(path: string, body: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer demo' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: 'Bearer demo' },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// =============================================================================
// STORE
// =============================================================================

export const useDeploymentStore = create<DeploymentState>()((set, get) => ({
  stats: null,
  missions: {},
  runners: {},
  recentEvents: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const data = (await apiGet('/deployment')) as DeploymentSnapshot;
      set({
        stats: data.stats,
        missions: data.missions,
        runners: data.runners,
        recentEvents: data.recent_events,
        loading: false,
      });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  deployMission: async (goal, domain = '', riskTolerance = 0.5, budgetQb = 100) => {
    set({ loading: true, error: null });
    try {
      const result = (await apiPost('/deployment/deploy', {
        goal,
        domain,
        risk_tolerance: riskTolerance,
        budget_qb: budgetQb,
      })) as MissionDeployResult;
      await get().fetchAll();
      set({ loading: false });
      return result;
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : String(err) });
      return null;
    }
  },

  getMission: (missionId) => get().missions[missionId],
}));

export default useDeploymentStore;
