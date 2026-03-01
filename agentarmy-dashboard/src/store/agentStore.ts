import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Prompt } from '../core/prompts';
import { Workspace, ChangeLog } from '../core/types';

type User = { id: string; name: string; role: 'user' | 'admin' };

type AgentStore = {
  prompts: Prompt[];
  workspace: Workspace;
  currentUser: User;
  audits: ChangeLog[];
  setPrompts: (p: Prompt[]) => void;
  addPrompt: (p: Prompt) => void;
  applyPromptAudit: (p: Prompt) => void;
  updateWorkspace: (w: Workspace, summary?: string) => void;
};

export const useAgentStore = create<AgentStore>()(persist((set, get) => ({
  prompts: [],
  workspace: { documents: [], tasks: [], boards: [], history: [] },
  currentUser: { id: 'u-anon', name: 'anonymous', role: 'user' },
  audits: [],
  setPrompts: (p) => set({ prompts: p }),
  addPrompt: (p) => set((s) => ({ prompts: [p, ...s.prompts] })),
  applyPromptAudit: (p) => set((s) => ({ audits: [{ id: `a-${Date.now()}`, ts: new Date().toISOString(), author: s.currentUser.id, summary: `Applied prompt ${p.name}`, snapshot: p }, ...s.audits] })),
  updateWorkspace: (w, summary) => set((s) => ({ workspace: w, audits: summary ? [{ id: `a-${Date.now()}`, ts: new Date().toISOString(), author: s.currentUser.id, summary, snapshot: w }, ...s.audits] : s.audits })),
}), { name: 'agent-store' }));
