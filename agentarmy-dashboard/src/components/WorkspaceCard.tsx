import React, { useState } from 'react';
import styles from './WorkspaceCard.module.css';
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
      {error && <div className={styles.errorBox}>{error}</div>}
      <div className={styles.flexRow}>
        <div className={styles.flex1}>
          <label htmlFor="docSelect" className="visually-hidden">Select document</label>
          <select id="docSelect" title="Select document" value={selectedDocId||''} onChange={(e)=>{ setSelectedDocId(e.target.value); const d = workspace.documents.find(x=>x.id===e.target.value); setEditing(d?.content||''); }}>
            {workspace.documents.map(d=> <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
          <label htmlFor="docTextarea" className="visually-hidden">Document content</label>
          <textarea id="docTextarea" className={styles.textarea} value={editing} onChange={(e)=>setEditing(e.target.value)} placeholder="Edit document content" title="Document content" />
          <div className={styles.buttonRow}>
            <button className="btn" onClick={doRewrite} disabled={loading === 'rewrite'}>{loading === 'rewrite' ? '⏳ Rewriting...' : 'Rewrite'}</button>
            <button className="btn" onClick={doSummarize} disabled={loading === 'summarize'}>{loading === 'summarize' ? '⏳ Summarizing...' : 'Summarize'}</button>
            <button className="btn" onClick={doPlan} disabled={loading === 'plan'}>{loading === 'plan' ? '⏳ Planning...' : 'Make Plan'}</button>
          </div>
        </div>
        <div className={styles.tasksCol}>
          <h4>Tasks</h4>
          <ul className={styles.tasksList}>
            {workspace.tasks.map(t => (
              <li key={t.id}>
                <label className="visually-hidden" htmlFor={`task-done-${t.id}`}>Task done: {t.title}</label>
                <input id={`task-done-${t.id}`} type="checkbox" checked={!!t.done} readOnly title={`Task done: ${t.title}`} /> {t.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
