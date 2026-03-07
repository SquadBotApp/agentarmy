import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_AGENTARMY_API || 'http://localhost:8000';

export function AISuggestionPanel() {
  const [desc, setDesc] = useState('');
  const [tools, setTools] = useState<any[]>([]);
  const [workflow, setWorkflow] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const suggestTools = async () => {
    setMessage('Loading tool suggestions...');
    try {
      const res = await fetch(`${API_BASE}/ai_suggestion/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(desc),
      });
      setTools(await res.json());
      setMessage('Tool suggestions updated.');
    } catch (err) {
      setMessage(`Tool suggestion failed: ${String(err)}`);
    }
  };

  const suggestWorkflow = async () => {
    setMessage('Loading workflow suggestions...');
    try {
      const res = await fetch(`${API_BASE}/ai_suggestion/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(desc),
      });
      setWorkflow(await res.json());
      setMessage('Workflow suggestions updated.');
    } catch (err) {
      setMessage(`Workflow suggestion failed: ${String(err)}`);
    }
  };

  return (
    <section>
      <h3>AI-Powered Tool & Workflow Suggestion</h3>
      <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} cols={60} placeholder="Describe what you want to automate..." />
      <div>
        <button onClick={suggestTools}>Suggest Tools</button>
        <button onClick={suggestWorkflow}>Suggest Workflow</button>
      </div>
      <div>
        <h4>Suggested Tools</h4>
        <pre>{JSON.stringify(tools, null, 2)}</pre>
        <h4>Suggested Workflow</h4>
        <pre>{JSON.stringify(workflow, null, 2)}</pre>
      </div>
      <div>{message}</div>
    </section>
  );
}
