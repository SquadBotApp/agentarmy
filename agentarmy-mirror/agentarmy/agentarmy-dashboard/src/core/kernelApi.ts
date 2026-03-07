type JsonRecord = Record<string, unknown>;

function headers(): Record<string, string> {
  const token = localStorage.getItem("agent-token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchKernelState(): Promise<JsonRecord> {
  const base = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${base}/kernel/state`, { method: "GET", headers: headers() });
  if (!res.ok) throw new Error(`kernel state failed: ${res.status}`);
  return res.json();
}

export async function fetchKernelPolicies(): Promise<JsonRecord> {
  const base = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${base}/kernel/policies`, { method: "GET", headers: headers() });
  if (!res.ok) throw new Error(`kernel policies failed: ${res.status}`);
  return res.json();
}

export async function executeKernelCommand(
  action: string,
  payload: JsonRecord = {},
  dryRun = true
): Promise<JsonRecord> {
  const base = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${base}/kernel/commands/execute`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ action, payload, dry_run: dryRun }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`kernel command failed: ${res.status} ${body}`);
  try {
    return JSON.parse(body);
  } catch {
    return { raw: body };
  }
}
