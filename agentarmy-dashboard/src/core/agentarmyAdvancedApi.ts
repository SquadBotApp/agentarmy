// Advanced controls for AgentArmy OS

const API_BASE = process.env.REACT_APP_AGENTARMY_API || 'http://localhost:8000';

export async function killAgent(name: string) {
  const res = await fetch(`${API_BASE}/kill_agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to kill agent');
  return res.json();
}

export async function overrideAgent(name: string, action: string, params: any = {}) {
  const res = await fetch(`${API_BASE}/override_agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, action, params }),
  });
  if (!res.ok) throw new Error('Failed to override agent');
  return res.json();
}

export async function adjustPolicy(subsystem: string, policy: any) {
  const res = await fetch(`${API_BASE}/adjust_policy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subsystem, policy }),
  });
  if (!res.ok) throw new Error('Failed to adjust policy');
  return res.json();
}
