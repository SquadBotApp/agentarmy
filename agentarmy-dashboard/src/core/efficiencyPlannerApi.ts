export type EfficiencyPlan = {
  goal: string;
  intents: string[];
  recommended_framework: string;
  toolchain: string[];
  integration_targets: string[];
  parallel_tracks: Array<{ name: string; enabled: boolean }>;
  notes: string[];
};

export type EfficiencyFramework =
  | "native"
  | "langgraph"
  | "crewai"
  | "smolagents"
  | "autogen"
  | "frabric"
  | "fabric";

export async function fetchEfficiencyPlan(
  goal: string,
  mobileVendors: string[] = [],
  framework?: EfficiencyFramework
): Promise<EfficiencyPlan> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const token = localStorage.getItem("agent-token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const payload: Record<string, unknown> = {
    goal,
    mobile_vendors: mobileVendors,
  };
  if (framework && framework.trim()) {
    payload.framework = framework.trim().toLowerCase();
  }

  const res = await fetch(`${backendUrl}/orchestrate/efficiency-plan`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Efficiency plan failed: ${res.status} ${err}`);
  }
  return res.json();
}
