/**
 * Lifecycle Store – Zustand frontend for the Lifecycle Manager.
 *
 * Mirrors the Python LifecycleManager state, fetches from the
 * orchestration API, and exposes human-oversight actions
 * (freeze, unfreeze, promote, demote, lock/unlock tools, etc.).
 */

import { create } from 'zustand';

// =============================================================================
// TYPES  (match lifecycle_manager.py enums / models)
// =============================================================================

export type LifecycleStage =
  | 'candidate'
  | 'staging'
  | 'active'
  | 'evolving'
  | 'frozen'
  | 'retired'
  | 'merged'
  | 'forked';

export type SafetyPosture = 'maximum' | 'high' | 'standard' | 'relaxed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type LifecycleEventType =
  | 'creation'
  | 'deployment'
  | 'evolution'
  | 'rollback'
  | 'merge'
  | 'fork'
  | 'retirement'
  | 'freeze'
  | 'unfreeze'
  | 'promotion'
  | 'demotion'
  | 'tool_lock'
  | 'tool_unlock'
  | 'domain_restrict'
  | 'safety_check'
  | 'governance_override';

export interface AgentVersionInfo {
  version_number: number;
  safety_posture: SafetyPosture;
  risk_level: RiskLevel;
  tools: string[];
  specialization_tags: string[];
  zpe_baseline: number;
  qb_efficiency: number;
  domain_restrictions: string[];
}

export interface ManagedAgentInfo {
  agent_id: string;
  name: string;
  role: string;
  stage: LifecycleStage;
  frozen: boolean;
  tools_locked: boolean;
  approved_tools: string[];
  domain_restrictions: string[];
  governance_required: boolean;
  performance_score: number;
  total_missions: number;
  total_successes: number;
  total_failures: number;
  parent_id: string | null;
  merged_into: string | null;
  current_version: AgentVersionInfo | null;
  version_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  event_id: string;
  event_type: LifecycleEventType;
  agent_id: string;
  agent_name: string;
  timestamp: string;
  actor: string;
  safety_check_passed: boolean;
  governance_approval: string | null;
  details: Record<string, unknown>;
}

export interface ConstitutionalStatus {
  total_agents: number;
  active_agents: number;
  frozen_agents: number;
  high_risk_agents: number;
  governance_enabled: number;
  avg_performance: number;
  recent_violations: number;
  total_audit_events: number;
  rules_count: number;
  rules: { id: string; desc: string; severity: string }[];
}

export interface LifecycleSnapshot {
  agents: Record<string, ManagedAgentInfo>;
  constitutional_status: ConstitutionalStatus;
  audit_log: AuditEvent[];
}

// =============================================================================
// STORE STATE
// =============================================================================

interface LifecycleState {
  // Data
  agents: Record<string, ManagedAgentInfo>;
  auditLog: AuditEvent[];
  constitutionalStatus: ConstitutionalStatus | null;
  loading: boolean;
  error: string | null;

  // Fetch
  fetchAll: () => Promise<void>;

  // Human oversight actions (call backend, then re-fetch)
  createAgent: (name: string, role: string, tools?: string[], safetyPosture?: SafetyPosture) => Promise<boolean>;
  deployAgent: (agentId: string) => Promise<boolean>;
  freezeAgent: (agentId: string) => Promise<boolean>;
  unfreezeAgent: (agentId: string) => Promise<boolean>;
  retireAgent: (agentId: string) => Promise<boolean>;
  lockTools: (agentId: string) => Promise<boolean>;
  unlockTools: (agentId: string) => Promise<boolean>;
  promoteAgent: (agentId: string, posture: SafetyPosture) => Promise<boolean>;
  demoteAgent: (agentId: string, posture: SafetyPosture) => Promise<boolean>;
  rollbackAgent: (agentId: string, version?: number) => Promise<boolean>;
  forkAgent: (agentId: string, newName: string) => Promise<boolean>;
  mergeAgents: (sourceId: string, targetId: string) => Promise<boolean>;
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

export const useLifecycleStore = create<LifecycleState>()((set, get) => ({
  agents: {},
  auditLog: [],
  constitutionalStatus: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const data = (await apiGet('/lifecycle')) as LifecycleSnapshot;
      set({
        agents: data.agents,
        auditLog: data.audit_log,
        constitutionalStatus: data.constitutional_status,
        loading: false,
      });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  createAgent: async (name, role, tools, safetyPosture) => {
    try {
      await apiPost('/lifecycle/create', { name, role, tools, safety_posture: safetyPosture });
      await get().fetchAll();
      return true;
    } catch { return false; }
  },

  deployAgent: async (agentId) => {
    try { await apiPost('/lifecycle/deploy', { agent_id: agentId }); await get().fetchAll(); return true; }
    catch { return false; }
  },

  freezeAgent: async (agentId) => {
    try { await apiPost('/lifecycle/freeze', { agent_id: agentId }); await get().fetchAll(); return true; }
    catch { return false; }
  },

  unfreezeAgent: async (agentId) => {
    try { await apiPost('/lifecycle/unfreeze', { agent_id: agentId }); await get().fetchAll(); return true; }
    catch { return false; }
  },

  retireAgent: async (agentId) => {
    try { await apiPost('/lifecycle/retire', { agent_id: agentId }); await get().fetchAll(); return true; }
    catch { return false; }
  },

  lockTools: async (agentId) => {
    try { await apiPost('/lifecycle/lock-tools', { agent_id: agentId }); await get().fetchAll(); return true; }
    catch { return false; }
  },

  unlockTools: async (agentId) => {
    try { await apiPost('/lifecycle/unlock-tools', { agent_id: agentId }); await get().fetchAll(); return true; }
    catch { return false; }
  },

  promoteAgent: async (agentId, posture) => {
    try { await apiPost('/lifecycle/promote', { agent_id: agentId, posture }); await get().fetchAll(); return true; }
    catch { return false; }
  },

  demoteAgent: async (agentId, posture) => {
    try { await apiPost('/lifecycle/demote', { agent_id: agentId, posture }); await get().fetchAll(); return true; }
    catch { return false; }
  },

  rollbackAgent: async (agentId, version) => {
    try { await apiPost('/lifecycle/rollback', { agent_id: agentId, target_version: version }); await get().fetchAll(); return true; }
    catch { return false; }
  },

  forkAgent: async (agentId, newName) => {
    try { await apiPost('/lifecycle/fork', { agent_id: agentId, new_name: newName }); await get().fetchAll(); return true; }
    catch { return false; }
  },

  mergeAgents: async (sourceId, targetId) => {
    try { await apiPost('/lifecycle/merge', { source_id: sourceId, target_id: targetId }); await get().fetchAll(); return true; }
    catch { return false; }
  },
}));

export default useLifecycleStore;
