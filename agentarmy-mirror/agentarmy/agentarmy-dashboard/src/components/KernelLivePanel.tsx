import React, { useState, useEffect } from 'react';
import styles from './KernelLivePanel.module.css';

export function KernelLivePanel() {
  const [kernelState, setKernelState] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [overrideTarget, setOverrideTarget] = useState('');
  const [overrideAction, setOverrideAction] = useState('kill');
  const [overrideResult, setOverrideResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/kernel/state').then(r => r.json()).then(setKernelState);
    fetch('/api/audit/log').then(r => r.json()).then(setAuditLog);
  }, []);

  async function handleOverride() {
    setOverrideResult(null);
    try {
      const res = await fetch('/api/root/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: overrideAction, target: overrideTarget })
      });
      setOverrideResult(await res.text());
    } catch (e: any) {
      setOverrideResult(e.message);
    }
  }

  return (
    <div className={styles.kernelLivePanel}>
      <h3>Kernel State & Root-Owner Controls</h3>
      <section>
        <h4>Live Kernel State</h4>
        <pre>{JSON.stringify(kernelState, null, 2)}</pre>
      </section>
      <section>
        <h4>Audit Log</h4>
        <pre>{JSON.stringify(auditLog, null, 2)}</pre>
      </section>
      <section>
        <h4>Root-Owner Override</h4>
        <input value={overrideTarget} onChange={e => setOverrideTarget(e.target.value)} placeholder="Target (agent/tool)" />
        <select value={overrideAction} onChange={e => setOverrideAction(e.target.value)}>
          <option value="kill">Kill</option>
          <option value="isolate">Isolate</option>
          <option value="approve">Approve</option>
          <option value="deny">Deny</option>
        </select>
        <button onClick={handleOverride}>Execute Override</button>
        {overrideResult && <pre>Result: {overrideResult}</pre>}
      </section>
    </div>
  );
}
