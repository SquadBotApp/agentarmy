export type Prompt = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  author?: string;
};

const STORAGE_KEY = 'agentarmy_prompts_v1';

export async function loadPrompts(): Promise<Prompt[]> {
  try {
    // If a backend is configured, fetch from backend — REACT_APP_BACKEND_URL
    const backend = (process.env as any).REACT_APP_BACKEND_URL;
    if (backend) {
      const token = localStorage.getItem('agent-token');
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      try {
        const res = await fetch(`${backend.replace(/\/$/, '')}/prompts`, { headers });
        if (res.ok) {
          const json = await res.json();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
          return json;
        }
      } catch {}
      // fall through to localStorage
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPrompts();
    return JSON.parse(raw) as Prompt[];
  } catch {
    return defaultPrompts();
  }
}

export function savePrompts(prompts: Prompt[]) {
  try {
    // If backend configured, attempt push; still persist locally as fallback
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    const backend = (process.env as any).REACT_APP_BACKEND_URL;
    if (backend) {
      try { fetch(`${backend.replace(/\/$/, '')}/prompts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(prompts) }); } catch {}
    }
  } catch {}
}

function defaultPrompts(): Prompt[] {
  const now = new Date().toISOString();
  return [
    {
      id: `p-${Date.now()}-1`,
      name: 'Conservative Governance',
      content: `You are an assistant for AgentArmy. Always prefer human review for actions that decrease safety or dramatically increase cost. If a proposed change fails safety checks, present reasons and request explicit human confirmation.`,
      createdAt: now,
      author: 'system',
    },
    {
      id: `p-${Date.now()}-2`,
      name: 'Concise Explanation',
      content: `When summarizing candidate diffs, be concise: list changed metrics and tools, and provide one-line rationale for the change.`,
      createdAt: now,
      author: 'system',
    },
  ];
}
