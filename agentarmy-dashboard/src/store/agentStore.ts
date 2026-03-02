import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Prompt, savePrompts, loadPrompts } from '../core/prompts';
import { Workspace, ChangeLog } from '../core/types';

type User = { id: string; name: string; role: 'user' | 'admin' };

type AgentStore = {
  prompts: Prompt[];
  workspace: Workspace;
  currentUser: User;
  token?: string;
  audits: ChangeLog[];
  setPrompts: (p: Prompt[]) => void;
  addPrompt: (p: Prompt) => void;
  applyPromptAudit: (p: Prompt) => void;
  updateWorkspace: (w: Workspace, summary?: string) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

function summarizeWorkspaceDiff(prev: Workspace, next: Workspace): string {
  const prevDocs = prev.documents || [];
  const nextDocs = next.documents || [];
  const prevTasks = prev.tasks || [];
  const nextTasks = next.tasks || [];

  const changedDocs = nextDocs.filter((n) => {
    const p = prevDocs.find((d) => d.id === n.id);
    if (!p) return true;
    return p.content !== n.content || p.title !== n.title;
  }).length;

  const addedTasks = Math.max(0, nextTasks.length - prevTasks.length);
  const changedTasks = nextTasks.filter((n) => {
    const p = prevTasks.find((t) => t.id === n.id);
    if (!p) return false;
    return p.title !== n.title || !!p.done !== !!n.done;
  }).length;

  return `docsChanged=${changedDocs}, tasksAdded=${addedTasks}, tasksChanged=${changedTasks}`;
}

export const useAgentStore = create<AgentStore>()(persist((set, get) => ({
  prompts: [],
  workspace: { documents: [], tasks: [], boards: [], history: [] },
  currentUser: { id: 'u-anon', name: 'anonymous', role: 'user' },
  audits: [],
  setPrompts: (p) => {
    set({ prompts: p });
    try { savePrompts(p); } catch {};
  },
  addPrompt: (p) => {
    set((s) => {
      const updated = [p, ...s.prompts];
      try { savePrompts(updated); } catch {};
      return { prompts: updated };
    });
  },
  applyPromptAudit: (p) => set((s) => ({ audits: [{ id: `a-${Date.now()}`, ts: new Date().toISOString(), author: s.currentUser.id, summary: `Applied prompt ${p.name}`, snapshot: p }, ...s.audits] })),

  updateWorkspace: (w, summary) => set((s) => {
    const diff = summarizeWorkspaceDiff(s.workspace, w);
    const baseSummary = summary || 'Workspace updated';
    return {
      workspace: w,
      audits: [{
        id: `a-${Date.now()}`,
        ts: new Date().toISOString(),
        author: s.currentUser.id,
        summary: `${baseSummary} | diff: ${diff}`,
        snapshot: w,
      }, ...s.audits],
    };
  }),
  login: async (username, password) => {
    try {
      const backend = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
      const res = await fetch(`${backend}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const user = { id: username, name: username, role: data.role };
      set({ token: data.token, currentUser: user });
      localStorage.setItem('agent-token', data.token);
      // fetch prompts after login
      try {
        const prompts = await loadPrompts();
        set({ prompts });
      } catch {}
      return true;
    } catch {
      return false;
    }
  },
  logout: () => set({ token: undefined, currentUser: { id: 'u-anon', name: 'anonymous', role: 'user' } }),
}), { name: 'agent-store' }));
