import React from "react";

import { fetchSshPlan, SshPlanResult } from "../core/sshPlanApi";

export function SshOpsPanel() {
  const [goal, setGoal] = React.useState("Add secure SSH access for production operations");
  const [host, setHost] = React.useState("10.0.0.8");
  const [username, setUsername] = React.useState("automation");
  const [profileType, setProfileType] = React.useState("linux_server");
  const [authMode, setAuthMode] = React.useState("ed25519_key");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<SshPlanResult | null>(null);

  async function runPlan() {
    setLoading(true);
    setError("");
    try {
      const plan = await fetchSshPlan(goal, [
        {
          host,
          username,
          profile_type: profileType,
          auth_mode: authMode,
          controls: ["host_key_pinning", "least_privilege_user"],
        },
      ]);
      setResult(plan);
    } catch (err) {
      setError(String(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>SSH Operations</h3>
      <p>Plan and harden SSH integrations for authorized infrastructure.</p>
      <div style={{ marginBottom: "0.5rem" }}>
        <input value={goal} onChange={(e) => setGoal(e.target.value)} style={{ width: "100%", maxWidth: 760 }} />
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        <label style={{ marginRight: "0.75rem" }}>
          Host <input value={host} onChange={(e) => setHost(e.target.value)} />
        </label>
        <label style={{ marginRight: "0.75rem" }}>
          User <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        <label style={{ marginRight: "0.75rem" }}>
          Profile{" "}
          <select value={profileType} onChange={(e) => setProfileType(e.target.value)}>
            {["linux_server", "network_device", "bastion"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          Auth{" "}
          <select value={authMode} onChange={(e) => setAuthMode(e.target.value)}>
            {["ed25519_key", "hardware_key", "short_lived_cert", "password"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button onClick={runPlan} disabled={loading}>
        {loading ? "Planning..." : "Build SSH Plan"}
      </button>
      {error && <p>{error}</p>}
      {result && (
        <div style={{ marginTop: "0.75rem" }}>
          <div>
            <strong>Ready:</strong> {result.summary.ready_profiles} / {result.summary.total_profiles}
          </div>
          <div>
            <strong>High Risk:</strong> {result.summary.high_risk_profiles}
          </div>
          <div>
            <strong>Actions:</strong> {result.recommended_actions.join(" | ")}
          </div>
          <div>
            <strong>Policy:</strong> {result.policy_notes.join(" | ")}
          </div>
        </div>
      )}
    </section>
  );
}
