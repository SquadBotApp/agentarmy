import React from "react";

import { analyzeSocialIntel, SocialIntelResult } from "../core/socialIntelApi";

const DEFAULT_SIGNALS = `[
  {
    "source": "Official Product Blog",
    "source_type": "official",
    "claim": "Platform API policy update announced.",
    "verified": true,
    "corroboration_count": 4,
    "evidence_quality": 0.9,
    "recency_hours": 6
  },
  {
    "source": "Random Forum Thread",
    "source_type": "community",
    "claim": "Unverified rumor about service outage.",
    "verified": false,
    "corroboration_count": 0,
    "evidence_quality": 0.2,
    "recency_hours": 2
  }
]`;

export function SocialIntelPanel() {
  const [goal, setGoal] = React.useState("Monitor social signals to improve reliability and defense posture");
  const [platform, setPlatform] = React.useState("x");
  const [handle, setHandle] = React.useState("@agentarmy");
  const [signalsJson, setSignalsJson] = React.useState(DEFAULT_SIGNALS);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<SocialIntelResult | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    try {
      const parsed = JSON.parse(signalsJson);
      const signals = Array.isArray(parsed) ? parsed : [];
      const intel = await analyzeSocialIntel(goal, [{ platform, handle, mode: "monitor" }], signals);
      setResult(intel);
    } catch (err) {
      setError(String(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>Social Intelligence</h3>
      <p>Analyze authorized public signals for credible learning and defense updates.</p>
      <div style={{ marginBottom: "0.5rem" }}>
        <input value={goal} onChange={(e) => setGoal(e.target.value)} style={{ width: "100%", maxWidth: 760 }} />
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        <label style={{ marginRight: "0.75rem" }}>
          Platform{" "}
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {["x", "linkedin", "github", "youtube", "reddit", "discord"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          Handle <input value={handle} onChange={(e) => setHandle(e.target.value)} />
        </label>
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        <textarea
          rows={10}
          cols={90}
          value={signalsJson}
          onChange={(e) => setSignalsJson(e.target.value)}
        />
      </div>
      <button onClick={runAnalysis} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Signals"}
      </button>
      {error && <p>{error}</p>}
      {result && (
        <div style={{ marginTop: "0.75rem" }}>
          <div>
            <strong>Credible Signals:</strong> {result.credibility_summary.credible_count} / {result.credibility_summary.total_signals}
          </div>
          <div>
            <strong>Average Score:</strong> {result.credibility_summary.average_score}
          </div>
          <div>
            <strong>Defense Actions:</strong> {result.defense_actions.join(" | ")}
          </div>
          <div>
            <strong>Policy Notes:</strong> {result.policy_notes.join(" | ")}
          </div>
        </div>
      )}
    </section>
  );
}
