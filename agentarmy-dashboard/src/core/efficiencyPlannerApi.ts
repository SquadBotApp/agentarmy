export type EfficiencyPlan = {
  goal: string;
  intents: string[];
  recommended_framework: string;
  toolchain: string[];
  integration_targets: string[];
  parallel_tracks: Array<{ name: string; enabled: boolean }>;
  notes: string[];
};

export async function fetchEfficiencyPlan(goal: string, mobileVendors: string[] = []): Promise<EfficiencyPlan> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const token = localStorage.getItem("agent-token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${backendUrl}/orchestrate/efficiency-plan`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      goal,
      mobile_vendors: mobileVendors,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Efficiency plan failed: ${res.status} ${err}`);
  }
  return res.json();
}
