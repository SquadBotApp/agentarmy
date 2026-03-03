import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_AGENTARMY_API || 'http://localhost:8000';

export function SelfHealingPanel() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [fixes, setFixes] = useState<any>({});
  const [msg, setMsg] = useState('');

  const diagnose = async () => {
    const res = await fetch(`${API_BASE}/self_healing/diagnose`);
    setDiagnostics(await res.json());
  };
  const autoFix = async () => {
    const res = await fetch(`${API_BASE}/self_healing/auto_fix`, { method: 'POST' });
    setFixes(await res.json());
    setMsg('Auto-fix attempted.');
  };

  return (
    <section>
      <h3>System Health & Self-Healing</h3>
      <button onClick={diagnose}>Diagnose</button>
      <button onClick={autoFix}>Auto-Fix</button>
      <div>{msg}</div>
      <div>
        <h4>Diagnostics</h4>
        <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
        <h4>Auto-Fix Results</h4>
        <pre>{JSON.stringify(fixes, null, 2)}</pre>
      </div>
    </section>
  );
}
