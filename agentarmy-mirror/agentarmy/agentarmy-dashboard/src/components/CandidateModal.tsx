import React, { useState } from "react";
import { AgentArmyState } from "../core/types";
import { ScoredCandidate } from "../core/upgrade";
import { ConfirmModal } from "./ConfirmModal";

export function CandidateModal({
  candidates,
  onClose,
  onApply,
}: {
  candidates: ScoredCandidate[];
  onClose: () => void;
  onApply: (s: AgentArmyState) => void;
}) {
  const [confirm, setConfirm] = useState<{open:boolean; candidate?:ScoredCandidate}>({ open:false, candidate:undefined });

  return (
    <>
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h2>Proposed Evolutions</h2>
        <p>Select a candidate to apply or cancel. Candidates failing the constitution are labeled.</p>
        <ul style={{ maxHeight: 300, overflow: 'auto' }}>
          {candidates.map((c) => (
            <li key={c.id} style={{ padding: 8, borderBottom: '1px solid #222' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong>Score: {c.score.toFixed(2)}</strong>
                    <span style={{ fontSize: 12, color: c.passes ? 'limegreen' : '#ff6b6b' }}>{c.passes ? 'passes' : 'fails constitution'}</span>
                  </div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>{c.state.activeUniverse} • zpe={c.state.metrics.zpe.toFixed(2)} • safety={c.state.metrics.safety.toFixed(2)}</div>
                  {c.diff && c.diff.length > 0 && (
                    <ul style={{ fontSize: 12, marginTop: 8 }}>
                      {c.diff.map((d, j) => <li key={`${c.id}-d-${j}`}>{d}</li>)}
                    </ul>
                  )}
                  {!c.passes && c.reasons && c.reasons.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#ff6b6b' }}>
                        <strong>Reasons:</strong>
                        <ul>
                          {c.reasons.map((r, k) => <li key={`${c.id}-r-${k}`}>{r}</li>)}
                        </ul>
                      </div>
                  )}
                </div>
                <div style={{ marginLeft: 12 }}>
                    <button className="btn" onClick={() => {
                      if (!c.passes) {
                        setConfirm({ open: true, candidate: c });
                        return;
                      }
                      onApply(c.state);
                    }}>{c.passes ? 'Apply' : 'Apply (override)'}</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <button className="btn" onClick={() => { if (candidates[0]) onApply(candidates[0].state); }}>Auto pick top</button>
          <button className="btn" style={{ marginLeft: 8 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
      </div>
      <ConfirmModal open={confirm.open} title="Confirm override" message={confirm.candidate ? `This candidate fails the constitution for these reasons:\n- ${confirm.candidate.reasons.join('\n- ')}\n\nApply anyway?` : ''} onCancel={() => setConfirm({ open:false, candidate:undefined })} onConfirm={() => { if (confirm.candidate) onApply(confirm.candidate.state); setConfirm({ open:false, candidate:undefined }); }} />
      </>
  );
}
