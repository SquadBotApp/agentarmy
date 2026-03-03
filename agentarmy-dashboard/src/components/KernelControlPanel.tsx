import React from "react";

import { executeKernelCommand, fetchKernelPolicies, fetchKernelState } from "../core/kernelApi";

export function KernelControlPanel() {
  const [stateSummary, setStateSummary] = React.useState<string>("loading...");
  const [policiesSummary, setPoliciesSummary] = React.useState<string>("loading...");
  const [action, setAction] = React.useState("runtime.comms.broadcast");
  const [payload, setPayload] = React.useState('{"message":"kernel dry-run","targets":["claude"]}');
  const [result, setResult] = React.useState("");
  const [error, setError] = React.useState("");

  async function refresh() {
    setError("");
    try {
      const [state, policies] = await Promise.all([fetchKernelState(), fetchKernelPolicies()]);
      const events = (state?.event_chain as any)?.total_events ?? 0;
      const blocked = (state?.event_chain as any)?.blocked_events ?? 0;
      const rules = Array.isArray((policies as any)?.rules) ? (policies as any).rules.length : 0;
      setStateSummary(`events=${events}, blocked=${blocked}`);
      setPoliciesSummary(`rules=${rules}`);
    } catch (err) {
      setError(String(err));
    }
  }

  async function runDryCommand() {
    setError("");
    try {
      const parsed = JSON.parse(payload);
      const out = await executeKernelCommand(action, parsed, true);
      setResult(JSON.stringify(out, null, 2));
    } catch (err) {
      setError(String(err));
      setResult("");
    }
  }

  React.useEffect(() => {
    refresh();
  }, []);

  return (
    <section>
      <h3>Kernel Control</h3>
      <p>Unified intelligence kernel state, policy view, and command bus dry-run.</p>
      <div>
        <strong>Kernel:</strong> {stateSummary}
      </div>
      <div>
        <strong>Policies:</strong> {policiesSummary}
      </div>
      <button onClick={refresh}>Refresh Kernel</button>
      <div style={{ marginTop: "0.5rem" }}>
        <input value={action} onChange={(e) => setAction(e.target.value)} style={{ width: 380 }} />
      </div>
      <div style={{ marginTop: "0.5rem" }}>
        <textarea rows={4} cols={85} value={payload} onChange={(e) => setPayload(e.target.value)} />
      </div>
      <button onClick={runDryCommand}>Run Kernel Command (Dry)</button>
      {error && <pre>{error}</pre>}
      {result && <pre>{result}</pre>}
    </section>
  );
}
