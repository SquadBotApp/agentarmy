import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_AGENTARMY_API || 'http://localhost:8000';

export function ToolMarketplacePanel() {
  const [tools, setTools] = useState<any[]>([]);
  const [installed, setInstalled] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  const discover = async () => {
    const res = await fetch(`${API_BASE}/tool_marketplace/discover`);
    setTools(await res.json());
  };
  const install = async (tool: any) => {
    const res = await fetch(`${API_BASE}/tool_marketplace/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tool),
    });
    const data = await res.json();
    setMsg(data.status + ': ' + data.tool);
    listInstalled();
  };
  const listInstalled = async () => {
    const res = await fetch(`${API_BASE}/tool_marketplace/installed`);
    setInstalled(await res.json());
  };

  return (
    <section>
      <h3>Tool Marketplace</h3>
      <button onClick={discover}>Discover Tools</button>
      <button onClick={listInstalled}>List Installed Tools</button>
      <div>{msg}</div>
      <ul>
        {tools.map(t => (
          <li key={t.name}>
            {t.name} ({t.type})
            <button onClick={() => install(t)}>Install</button>
          </li>
        ))}
      </ul>
      <div>
        <h4>Installed Tools</h4>
        <ul>{installed.map((t: string) => <li key={t}>{t}</li>)}</ul>
      </div>
    </section>
  );
}
