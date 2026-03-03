import React, { useState } from 'react';
import { useAgents, useSubsystems, useBroadcastEvent, useShutdownRuntime } from '../core/useAgentArmy';
import { AISuggestionPanel } from './AISuggestionPanel';
import { SelfHealingPanel } from './SelfHealingPanel';
import { InternalCloudPanel } from './InternalCloudPanel';
import { SecurityPanel } from './SecurityPanel';
import { AgentArmyLivePanel } from './AgentArmyLivePanel';
import { AgentArmyAdvancedControls } from './AgentArmyAdvancedControls';
import { MobilePluginsPanel } from './MobilePluginsPanel';
import { EfficiencyLabPanel } from './EfficiencyLabPanel';
import { SocialIntelPanel } from './SocialIntelPanel';
import { SshOpsPanel } from './SshOpsPanel';
import { CommsBridgePanel } from './CommsBridgePanel';
import { IntegrationHealthPanel } from './IntegrationHealthPanel';
import { SuperpowersPanel } from './SuperpowersPanel';
import { KernelControlPanel } from './KernelControlPanel';
import { WorkflowPanel } from './WorkflowPanel';
import { ToolMarketplacePanel } from './ToolMarketplacePanel';
import { KernelLivePanel } from './KernelLivePanel';
import adapterTestStyles from './AdapterTestPanel.module.css';
function AdapterTestPanel() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function send3CX() {
    setError(null); setResult(null);
    try {
      const res = await fetch('/adapter/3cx/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_message', to: 'testuser', message: 'Hello from dashboard!' })
      });
      setResult(await res.text());
    } catch (e: any) { setError(e.message); }
  }
  async function sendClaude() {
    setError(null); setResult(null);
    try {
      const res = await fetch('/adapter/claude/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', input: 'Say hello from Claude!' })
      });
      setResult(await res.text());
    } catch (e: any) { setError(e.message); }
  }
  return (
    <div className={adapterTestStyles.adapterTestPanel}>
      <h3>3CX & Claude Adapter Test</h3>
      <button onClick={send3CX}>Send 3CX Message</button>
      <button onClick={sendClaude} className={adapterTestStyles.buttonMarginLeft}>Send Claude Chat</button>
      {result && <pre>Result: {result}</pre>}
      {error && <pre className={adapterTestStyles.errorText}>Error: {error}</pre>}
    </div>
  );
}


export function AgentArmyDashboard() {
  const { agents, loading: agentsLoading, error: agentsError, refresh: refreshAgents } = useAgents();
  const { subsystems, loading: subsystemsLoading, error: subsystemsError, refresh: refreshSubsystems } = useSubsystems();
  const broadcastEvent = useBroadcastEvent();
  const shutdownRuntime = useShutdownRuntime();

  return (
    <div>
      <h2>AgentArmy OS Dashboard</h2>
      <AgentArmyLivePanel />
      <MobilePluginsPanel />
      <EfficiencyLabPanel />
      <SocialIntelPanel />
      <SshOpsPanel />
      <CommsBridgePanel />
      <IntegrationHealthPanel />
      <SuperpowersPanel />
      <KernelControlPanel />
      <AgentArmyAdvancedControls />
      <AISuggestionPanel />
      <SelfHealingPanel />
      <ToolMarketplacePanel />
      <InternalCloudPanel />
      <SecurityPanel />
      <AdapterTestPanel />
      <KernelLivePanel />
      <section>
        <h3>Agents</h3>
        {agentsLoading ? 'Loading...' : agentsError ? agentsError : (
          <ul>{agents.map(a => <li key={a}>{a}</li>)}</ul>
        )}
        <button onClick={refreshAgents}>Refresh Agents</button>
      </section>
      <WorkflowPanel />
      <section>
        <h3>Subsystems</h3>
        {subsystemsLoading ? 'Loading...' : subsystemsError ? subsystemsError : (
          <ul>
            {Object.entries(subsystems).map(([k, v]) => <li key={k}>{`${k}: ${String(v)}`}</li>)}
          </ul>
        )}
        <button onClick={refreshSubsystems}>Refresh Subsystems</button>
      </section>
      <section>
        <h3>Control</h3>
        <button onClick={() => broadcastEvent('test_event', { foo: 'bar' })}>Broadcast Test Event</button>
        <button onClick={shutdownRuntime}>Shutdown Runtime</button>
      </section>
    </div>
  );
}
