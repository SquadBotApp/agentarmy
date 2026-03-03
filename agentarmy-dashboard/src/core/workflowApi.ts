// Workflow API Client for AgentArmy OS
// Provides functions to interact with workflow endpoints

const API_BASE = process.env.REACT_APP_AGENTARMY_API || 'http://localhost:8000';

export async function createWorkflow(name: string, steps: any[]) {
  const res = await fetch(`${API_BASE}/workflow/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, steps }),
  });
  if (!res.ok) throw new Error('Failed to create workflow');
  return res.json();
}

export async function runWorkflow(name: string) {
  const res = await fetch(`${API_BASE}/workflow/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to run workflow');
  return res.json();
}

export async function getWorkflowStatus(name: string) {
  const res = await fetch(`${API_BASE}/workflow/status?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Failed to get workflow status');
  return res.json();
}

export async function getWorkflowResults(name: string) {
  const res = await fetch(`${API_BASE}/workflow/results?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Failed to get workflow results');
  return res.json();
}
