import React, { useState, useEffect } from 'react';
import { Prompt } from '../core/prompts';
import { useAgentStore } from '../store/agentStore';

export function PromptManager({
  onApply,
  onClose,
}: {
  onApply: (p: Prompt) => void;
  onClose: () => void;
}) {
  const prompts = useAgentStore((s) => s.prompts);
  const addPrompt = useAgentStore((s) => s.addPrompt);
  const setPrompts = useAgentStore((s) => s.setPrompts);
  const applyPromptAudit = useAgentStore((s) => s.applyPromptAudit);
  const currentUser = useAgentStore((s) => s.currentUser);
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => { /* prompts are in store; kept for persistence */ }, [prompts]);

  function handleAddPrompt() {
    if (!newName.trim() || !newContent.trim()) return;
    const p: Prompt = { id: `p-${Date.now()}-${Math.floor(Math.random()*1000)}`, name: newName.trim(), content: newContent.trim(), createdAt: new Date().toISOString() };
    addPrompt(p);
    setNewName(''); setNewContent('');
  }

  function startEdit(p: Prompt) { setEditing(p); }
  function saveEdit() {
    if (!editing) return;
    // replace by rebuilding list
    const updated = (prompts || []).map((x) => x.id === editing.id ? editing : x);
    setPrompts(updated);
    setEditing(null);
  }
  function removePrompt(id: string) { setPrompts((prompts || []).filter((p) => p.id !== id)); }

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h2>Prompt Manager</h2>
        <p>Manage system prompts used to guide candidate evaluation and presentation.</p>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <input placeholder="Name" value={newName} onChange={(e)=>setNewName(e.target.value)} />
          <input placeholder="Short content" value={newContent} onChange={(e)=>setNewContent(e.target.value)} />
          <button className="btn" onClick={handleAddPrompt}>Add</button>
        </div>
        <ul style={{maxHeight:300,overflow:'auto'}}>
          {prompts.map((p) => (
            <li key={p.id} style={{padding:8,borderBottom:'1px solid #ddd'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{flex:1}}>
                  <div><strong>{p.name}</strong> <small style={{opacity:0.7}}>({new Date(p.createdAt).toLocaleString()})</small></div>
                  <div style={{fontSize:13,marginTop:6,whiteSpace:'pre-wrap'}}>{p.content}</div>
                </div>
                <div style={{marginLeft:8,display:'flex',flexDirection:'column',gap:6}}>
                  <button className="btn" onClick={() => {
                    // RBAC: only admins may apply prompts directly
                    if (currentUser?.role !== 'admin') {
                      globalThis.alert('Only administrators may apply prompts. Request elevation or contact an admin.');
                      return;
                    }
                    onApply(p); applyPromptAudit(p);
                  }}>Apply</button>
                  <button className="btn" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn" onClick={() => removePrompt(p.id)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {editing && (
          <div style={{marginTop:8}}>
            <h3>Edit prompt</h3>
            <input value={editing.name} onChange={(e)=>setEditing({...editing, name: e.target.value})} />
            <textarea style={{width:'100%',height:120}} value={editing.content} onChange={(e)=>setEditing({...editing, content: e.target.value})} />
            <div style={{textAlign:'right'}}>
              <button className="btn" onClick={()=>setEditing(null)}>Cancel</button>
              <button className="btn" onClick={saveEdit} style={{marginLeft:8}}>Save</button>
            </div>
          </div>
        )}

        <div style={{marginTop:12,textAlign:'right'}}>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
