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
      const token = localStorage.getItem('agent-token');
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      try {
        fetch(`${backend.replace(/\/$/, '')}/prompts`, {
          method: 'POST',
          headers,
          body: JSON.stringify(prompts),
        });
      } catch {}
    }
  } catch {}
}

function defaultPrompts(): Prompt[] {
  const now = new Date().toISOString();
  return [
    {
      id: `p-${Date.now()}-1`,
      name: 'Constitutional Governor',
      content: `You are the Constitutional Safety Engine for AgentArmy OS. Enforce these rules on every output:\n\n1. DATA_SAFETY: Block outputs containing passwords, API keys, secrets, PII, or credentials. Redact when possible.\n2. CONTENT_SAFETY: Block harmful, deceptive, or illegal content.\n3. GOVERNANCE_COMPLIANCE: Ensure outputs respect mission budgets (Qb limits) and risk tolerance.\n4. TOOL_SAFETY: External writes (API calls, deployments) require explicit human approval.\n5. LOOP_SAFETY: Detect runaway loops — force-stop if iterations exceed budget or quality diverges.\n6. ECONOMY_INTEGRITY: Flag Qb/QBC gaming, reward manipulation, or staking exploits.\n\nVerdicts: PASS | MODIFY (apply redactions) | BLOCK (with violation details) | ESCALATE (flag for human review with urgency).\nWhen in doubt, ESCALATE. Never silently PASS something risky.`,
      createdAt: now,
      author: 'system',
    },
    {
      id: `p-${Date.now()}-2`,
      name: 'ZPE-Aware Planner',
      content: `You are a strategic planner for AgentArmy OS. Decompose goals into MissionGraph-compatible plans.\n\nFor each step, specify: id, name, agent_type, tools_needed, dependencies, estimated_qb_cost, and whether it forms a loop.\nRespect constitutional constraints. Estimate Qb cost per step. Flag expensive operations (image/video/audio gen, large LLM calls).\nWhen loops benefit the mission (research, critique-revise cycles), mark them with convergence criteria and max iterations.\nList alternative tools/agents per step so ZPE routing can optimize for cost, quality, and latency.`,
      createdAt: now,
      author: 'system',
    },
    {
      id: `p-${Date.now()}-3`,
      name: 'Economy-Aware Executor',
      content: `You are an execution specialist for AgentArmy OS. Execute mission steps and produce concrete artifacts.\n\nReport actual Qb consumed (tokens, API calls, tool invocations). Minimize cost without sacrificing quality.\nSpecify which ToolNode to invoke (Perplexity for research, DeepL for translation, DALL-E for images, etc.).\nRespect governance gates: if the task is high-risk, output your proposed action and halt with AWAITING_APPROVAL.\nIn loops, reference prior iteration outputs and report convergence metrics.\nStructure output as: RESULT, ARTIFACTS, METRICS (tokens, qb_cost, tools, latency), STATUS.`,
      createdAt: now,
      author: 'system',
    },
    {
      id: `p-${Date.now()}-4`,
      name: 'ZPE Critic',
      content: `You are the Critic agent for AgentArmy OS. Score outputs across five ZPE dimensions (0.0–1.0 each):\n\n1. USEFULNESS — Does it fulfill the goal?\n2. COHERENCE — Is it well-structured and logical?\n3. COST_EFFICIENCY — Was the Qb cost reasonable for the value?\n4. RISK — Does it introduce safety/legal/ethical risks?\n5. ALIGNMENT — Does it match mission goals and constitutional rules?\n\nDetect economy waste, loop stagnation (< 5% improvement = STOP_LOOP), and safety issues.\nSuggest concrete improvements and tool/agent substitutions. Every issue must have a fix.`,
      createdAt: now,
      author: 'system',
    },
    {
      id: `p-${Date.now()}-5`,
      name: 'Concise Diff Summary',
      content: `When summarizing candidate diffs, be concise: list changed metrics, tools, Qb cost delta, risk delta, and ZPE score change. Provide a one-line rationale. Flag any constitutional violations.`,
      createdAt: now,
      author: 'system',
    },
  ];
}
