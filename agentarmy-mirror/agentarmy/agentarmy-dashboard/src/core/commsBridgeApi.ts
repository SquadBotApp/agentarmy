export type CommsBroadcastResult = {
  status: string;
  message: string;
  event_type: string;
  targets: string[];
  accepted: number;
  results: Record<string, { status: string; reason?: string; http_status?: number; error?: string }>;
  dispatched_at: string;
};

export async function broadcastComms(
  message: string,
  targets: string[],
  options?: { channel?: string; priority?: string; event_type?: string; context?: Record<string, unknown> }
): Promise<CommsBroadcastResult> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const token = localStorage.getItem("agent-token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${backendUrl}/orchestrate/comms-broadcast`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      targets,
      channel: options?.channel || "operations",
      priority: options?.priority || "normal",
      event_type: options?.event_type || "comms_broadcast",
      context: options?.context || {},
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Comms broadcast failed: ${res.status} ${err}`);
  }
  return res.json();
}
