export type ConnectorHealthPayload = {
  trace_id: string;
  orchestration_service: any;
  connector_health: {
    base_urls: string[];
    connectors: Array<{
      base_url: string;
      healthy: boolean;
      success_count: number;
      failure_count: number;
      last_error: string | null;
      last_checked_at: string | null;
    }>;
  };
};

export type ConfigHealthPayload = {
  trace_id: string;
  configured_count: number;
  total_count: number;
  checks: Array<{ key: string; configured: boolean }>;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("agent-token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchConnectorHealth(): Promise<ConnectorHealthPayload> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${backendUrl}/orchestrate/connectors/health`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`connector health failed: ${res.status}`);
  return res.json();
}

export async function fetchConfigHealth(): Promise<ConfigHealthPayload> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${backendUrl}/orchestrate/config-health`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`config health failed: ${res.status}`);
  return res.json();
}
