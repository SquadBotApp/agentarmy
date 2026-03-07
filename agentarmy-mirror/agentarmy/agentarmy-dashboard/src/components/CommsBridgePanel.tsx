import React from "react";

import { broadcastComms, CommsBroadcastResult } from "../core/commsBridgeApi";

const DEFAULT_TARGETS = ["3cx", "claude", "copy"];

export function CommsBridgePanel() {
  const [message, setMessage] = React.useState("AgentArmy OS sync: communication bridge online.");
  const [targets, setTargets] = React.useState<string[]>(DEFAULT_TARGETS);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<CommsBroadcastResult | null>(null);

  function toggleTarget(target: string) {
    setTargets((prev) => (prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target]));
  }

  async function send() {
    setLoading(true);
    setError("");
    try {
      const res = await broadcastComms(message, targets);
      setResult(res);
    } catch (err) {
      setError(String(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>Comms Bridge</h3>
      <p>Send one operational message to 3CX, Claude, and Copilot channels.</p>
      <div style={{ marginBottom: "0.5rem" }}>
        <textarea rows={4} cols={90} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        {["3cx", "claude", "copy", "copilot"].map((target) => (
          <label key={target} style={{ marginRight: "1rem" }}>
            <input type="checkbox" checked={targets.includes(target)} onChange={() => toggleTarget(target)} /> {target}
          </label>
        ))}
      </div>
      <button onClick={send} disabled={loading || !message.trim()}>
        {loading ? "Sending..." : "Broadcast"}
      </button>
      {error && <p>{error}</p>}
      {result && (
        <div style={{ marginTop: "0.75rem" }}>
          <div>
            <strong>Accepted:</strong> {result.accepted} / {result.targets.length}
          </div>
          <div>
            <strong>Resolved Targets:</strong> {result.targets.join(", ")}
          </div>
        </div>
      )}
    </section>
  );
}
