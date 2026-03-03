type JsonRecord = Record<string, unknown>;

function headers(): Record<string, string> {
  const token = localStorage.getItem("agent-token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function backendBase(): string {
  return process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
}

async function post(path: string, body: JsonRecord): Promise<JsonRecord> {
  const res = await fetch(`${backendBase()}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`education request failed: ${res.status} ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function fetchEducationState(): Promise<JsonRecord> {
  const res = await fetch(`${backendBase()}/education/state`, { method: "GET", headers: headers() });
  if (!res.ok) throw new Error(`education state failed: ${res.status}`);
  return res.json();
}

export async function startEducationSession(input: JsonRecord): Promise<JsonRecord> {
  return post("/education/session/start", input);
}

export async function submitEducationAssessment(input: JsonRecord): Promise<JsonRecord> {
  return post("/education/session/assess", input);
}

export async function generateEducationSimulation(input: JsonRecord): Promise<JsonRecord> {
  return post("/education/simulation/generate", input);
}

