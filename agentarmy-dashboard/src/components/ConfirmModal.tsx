import React from 'react';

export function ConfirmModal({ open, title, message, onCancel, onConfirm }: { open: boolean; title?: string; message: string; onCancel: ()=>void; onConfirm: ()=>void }) {
  if (!open) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        {title && <h3>{title}</h3>}
        <p style={{whiteSpace:'pre-wrap'}}>{message}</p>
        <div style={{textAlign:'right'}}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn" style={{marginLeft:8}} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
