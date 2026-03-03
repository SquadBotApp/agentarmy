
import React, { useState } from 'react';
import { killAgent, overrideAgent, adjustPolicy } from '../core/agentarmyAdvancedApi';
import styles from './AgentArmyAdvancedControls.module.css';

export function AgentArmyAdvancedControls() {
  const [agentName, setAgentName] = useState('');
  const [action, setAction] = useState('shutdown');
  const [params, setParams] = useState('{}');
  const [subsystem, setSubsystem] = useState('governance');
  const [policy, setPolicy] = useState('{}');
  const [result, setResult] = useState('');

  return (
    <div className={styles['agentarmy-advanced-controls']}>
      <h4>Advanced Controls</h4>
      <div>
        <label>Kill Agent: </label>
        <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="agent name" />
        <button onClick={async () => {
          try {
            const r = await killAgent(agentName);
            setResult(JSON.stringify(r));
          } catch (e: any) { setResult(e.message); }
        }}>Kill</button>
      </div>
      <div>
        <label>Override Agent: </label>
        <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="agent name" />
        <input value={action} onChange={e => setAction(e.target.value)} placeholder="action" />
        <input value={params} onChange={e => setParams(e.target.value)} placeholder="params (JSON)" />
        <button onClick={async () => {
          try {
            const r = await overrideAgent(agentName, action, JSON.parse(params));
            setResult(JSON.stringify(r));
          } catch (e: any) { setResult(e.message); }
        }}>Override</button>
      </div>
      <div>
        <label>Adjust Policy: </label>
        <input value={subsystem} onChange={e => setSubsystem(e.target.value)} placeholder="subsystem" />
        <input value={policy} onChange={e => setPolicy(e.target.value)} placeholder="policy (JSON)" />
        <button onClick={async () => {
          try {
            const r = await adjustPolicy(subsystem, JSON.parse(policy));
            setResult(JSON.stringify(r));
          } catch (e: any) { setResult(e.message); }
        }}>Adjust</button>
      </div>
      <div><strong>Result:</strong> <pre>{result}</pre></div>
    </div>
  );
}
