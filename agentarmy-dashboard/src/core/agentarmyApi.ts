// AgentArmy API Client
// Provides typed functions to interact with the AgentArmy OS backend (FastAPI)

const API_BASE = process.env.REACT_APP_AGENTARMY_API || 'http://localhost:8000';

export async function fetchAgents() {
  const res = await fetch(`${API_BASE}/agents`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

export async function fetchSubsystems() {
  const res = await fetch(`${API_BASE}/subsystems`);
  if (!res.ok) throw new Error('Failed to fetch subsystems');
  return res.json();
}

export async function broadcastEvent(eventType: string, payload: any = {}) {
  const res = await fetch(`${API_BASE}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType, payload }),
  });
  if (!res.ok) throw new Error('Failed to broadcast event');
  return res.json();
}

export async function shutdownRuntime() {
  const res = await fetch(`${API_BASE}/shutdown`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to shutdown runtime');
  return res.json();
}
