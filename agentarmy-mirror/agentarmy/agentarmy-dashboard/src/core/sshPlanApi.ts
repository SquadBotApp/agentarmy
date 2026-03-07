export type SshProfileInput = {
  name?: string;
  host: string;
  port?: number;
  username?: string;
  profile_type?: string;
  auth_mode?: string;
  controls?: string[];
};

export type SshPlanResult = {
  generated_at: string;
  goal: string;
  profiles: Array<{
    name: string;
    host: string;
    port: number;
    username: string;
    profile_type: string;
    auth_mode: string;
    controls: string[];
    risk_flags: string[];
    risk_score: number;
    ready: boolean;
  }>;
  summary: {
    total_profiles: number;
    high_risk_profiles: number;
    ready_profiles: number;
  };
  recommended_actions: string[];
  policy_notes: string[];
};

export async function fetchSshPlan(goal: string, profiles: SshProfileInput[]): Promise<SshPlanResult> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const token = localStorage.getItem("agent-token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${backendUrl}/orchestrate/ssh-plan`, {
    method: "POST",
    headers,
    body: JSON.stringify({ goal, profiles }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SSH planning failed: ${res.status} ${err}`);
  }
  return res.json();
}
