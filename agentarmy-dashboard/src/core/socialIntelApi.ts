export type SocialProfile = {
  platform: string;
  handle: string;
  mode?: string;
  purpose?: string;
};

export type SocialSignal = {
  source: string;
  source_type: string;
  claim: string;
  verified?: boolean;
  corroboration_count?: number;
  evidence_quality?: number;
  recency_hours?: number;
};

export type SocialIntelResult = {
  generated_at: string;
  goal: string;
  profiles: SocialProfile[];
  credibility_summary: {
    total_signals: number;
    credible_count: number;
    low_confidence_count: number;
    average_score: number;
  };
  credible_signals: Array<{ source: string; claim: string; score: number; credible: boolean }>;
  low_confidence_signals: Array<{ source: string; claim: string; score: number; credible: boolean }>;
  defense_actions: string[];
  learning_updates: string[];
  policy_notes: string[];
};

export async function analyzeSocialIntel(
  goal: string,
  profiles: SocialProfile[],
  signals: SocialSignal[]
): Promise<SocialIntelResult> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const token = localStorage.getItem("agent-token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${backendUrl}/orchestrate/social-intel`, {
    method: "POST",
    headers,
    body: JSON.stringify({ goal, profiles, signals }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Social intel analysis failed: ${res.status} ${err}`);
  }
  return res.json();
}
