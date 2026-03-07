export type SuperpowerTower = {
  generated_at: string;
  summary: {
    jobs_total: number;
    jobs_completed: number;
    jobs_failed: number;
    recent_decisions: number;
    installed_skills: number;
    memory_items: number;
  };
  agent_stats: any[];
  installed_skills: any[];
  recent_memory: any[];
};

function headers(): Record<string, string> {
  const token = localStorage.getItem("agent-token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const base = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${path} failed: ${res.status} ${err}`);
  }
  return res.json();
}

export function runAutonomousPr(goal: string, dryRun = true) {
  return post("/superpowers/autonomous-pr", { goal, dry_run: dryRun });
}

export function compileToolGraph(goal: string) {
  return post("/superpowers/tool-graph/compile", { goal });
}

export function runSelfHeal(objective: string) {
  return post("/superpowers/self-heal/run", { objective });
}

export function suggestPairEdit(file: string, intent: string) {
  return post("/superpowers/pair/suggest", { file, intent });
}

export function installSkill(skillId: string, metadata: Record<string, unknown> = {}) {
  return post("/superpowers/marketplace/install", { skill_id: skillId, metadata });
}

export function executeDsl(command: string) {
  return post("/superpowers/dsl/execute", { command });
}

export async function fetchControlTower(): Promise<SuperpowerTower> {
  const base = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${base}/superpowers/control-tower`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`control-tower failed: ${res.status} ${err}`);
  }
  return res.json();
}
