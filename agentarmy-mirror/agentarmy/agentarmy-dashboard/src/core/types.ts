export type Tool = { id: string; name: string; capability: number };
export type Policy = { id: string; name: string; strictness: number };
export type Universe = { id: string; name: string; description?: string };

export type Metrics = {
  zpe: number; // 0.2 - 2.0
  cost: number; // normalized 0-1
  safety: number; // 0-1
  resonance: number; // 0-1
};

export type Doc = { id: string; title: string; content: string; updatedAt: string };
export type Task = { id: string; title: string; notes?: string; done?: boolean; createdAt: string };
export type Board = { id: string; name: string; taskIds: string[] };
export type ChangeLog = { id: string; ts: string; author?: string; summary: string; snapshot?: any };

export type Workspace = {
  documents: Doc[];
  tasks: Task[];
  boards: Board[];
  history: ChangeLog[];
};

export type AgentArmyState = {
  tools: Tool[];
  policies: Policy[];
  universes: Universe[];
  activeUniverse: string;
  metrics: Metrics;
  version?: number;
  workspace?: Workspace;
};

export const initialAgentArmyState: AgentArmyState = {
  tools: [
    { id: 't1', name: 'vision-model-x', capability: 0.7 },
    { id: 't2', name: 'language-model-y', capability: 0.8 },
  ],
  policies: [{ id: 'p1', name: 'human-override', strictness: 1 }],
  universes: [
    { id: 'uA', name: 'Universe A' },
    { id: 'uB', name: 'Universe B' },
    { id: 'uC', name: 'Universe C' },
  ],
  activeUniverse: 'Universe B',
  metrics: { zpe: 1, cost: 0.3, safety: 0.9, resonance: 0.6 },
  version: 1,
  workspace: {
    documents: [{ id: 'd1', title: 'Notes', content: 'Welcome to AgentArmy workspace.', updatedAt: new Date().toISOString() }],
    tasks: [{ id: 't1', title: 'Draft mission', notes: '', done: false, createdAt: new Date().toISOString() }],
    boards: [],
    history: [],
  },
};
