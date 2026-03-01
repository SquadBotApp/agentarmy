import React, { useState } from 'react';
import { Workspace } from '../core/types';
import { aiRewrite, aiPlan, aiSummarize } from '../core/workflow';
import { useAgentStore } from '../store/agentStore';

export function WorkspaceCard() {
  const workspace = useAgentStore(s => s.workspace);
  const updateWorkspace = useAgentStore(s => s.updateWorkspace);
  const [selectedDocId, setSelectedDocId] = useState(workspace.documents?.[0]?.id || null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const doc = workspace.documents.find(d => d.id === selectedDocId) || workspace.documents[0];
  const [editing, setEditing] = useState(doc ? doc.content : '');

  async function doRewrite() {
    if (!doc) return;
    try {
      setLoading('rewrite');
      setError(null);
      const out = await aiRewrite(editing);
      const nw: Workspace = { ...workspace, documents: workspace.documents.map(d => d.id === doc.id ? { ...d, content: out, updatedAt: new Date().toISOString() } : d) } as Workspace;
      updateWorkspace(nw, `AI rewrite on ${doc.title}`);
      setEditing(out);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Rewrite failed: ${msg}`);
      console.error('Rewrite error:', err);
    } finally {
      setLoading(null);
    }
  }

  async function doPlan() {
    try {
      setLoading('plan');
      setError(null);
      const out = await aiPlan(editing || (doc ? doc.content : ''));
      const nw = { ...workspace, tasks: [...(workspace.tasks||[]), ...out] } as Workspace;
      updateWorkspace(nw, 'AI generated plan');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Plan failed: ${msg}`);
      console.error('Plan error:', err);
    } finally {
      setLoading(null);
    }
  }

  async function doSummarize() {
    if (!doc) return;
    try {
      setLoading('summarize');
      setError(null);
      const out = await aiSummarize(editing || (doc ? doc.content : ''));
      const nw: Workspace = { ...workspace, documents: workspace.documents.map(d => d.id === doc.id ? { ...d, content: out, updatedAt: new Date().toISOString() } : d) } as Workspace;
      updateWorkspace(nw, `AI summarize on ${doc.title}`);
      setEditing(out);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Summarize failed: ${msg}`);
      console.error('Summarize error:', err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card">
      <h2>Workspace</h2>
      {error && <div style={{ color: '#d32f2f', marginBottom: 8, padding: 8, background: '#ffebee', borderRadius: 4 }}>{error}</div>}
      <div style={{display:'flex',gap:8}}>
        <div style={{flex:1}}>
          <select value={selectedDocId||''} onChange={(e)=>{ setSelectedDocId(e.target.value); const d = workspace.documents.find(x=>x.id===e.target.value); setEditing(d?.content||''); }}>
            {workspace.documents.map(d=> <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
          <textarea style={{width:'100%',height:160,marginTop:8}} value={editing} onChange={(e)=>setEditing(e.target.value)} />
          <div style={{marginTop:8,display:'flex',gap:8}}>
            <button className="btn" onClick={doRewrite} disabled={loading === 'rewrite'}>{loading === 'rewrite' ? '⏳ Rewriting...' : 'Rewrite'}</button>
            <button className="btn" onClick={doSummarize} disabled={loading === 'summarize'}>{loading === 'summarize' ? '⏳ Summarizing...' : 'Summarize'}</button>
            <button className="btn" onClick={doPlan} disabled={loading === 'plan'}>{loading === 'plan' ? '⏳ Planning...' : 'Make Plan'}</button>
          </div>
        </div>
        <div style={{width:260}}>
          <h4>Tasks</h4>
          <ul style={{maxHeight:220,overflow:'auto'}}>
            {workspace.tasks.map(t => (
              <li key={t.id}><input type="checkbox" checked={!!t.done} readOnly /> {t.title}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
