import React, { useState } from 'react';

const API = process.env.REACT_APP_AGENTARMY_API || 'http://localhost:8000';

export const SecurityPanel: React.FC = () => {
  const [encInput, setEncInput] = useState('');
  const [encOutput, setEncOutput] = useState('');
  const [decInput, setDecInput] = useState('');
  const [decOutput, setDecOutput] = useState('');
  const [netStatus, setNetStatus] = useState<'enabled' | 'disabled' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encrypt = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/security/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: encInput })
      });
      const data = await res.json();
      setEncOutput(data.token);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const decrypt = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/security/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: decInput })
      });
      const data = await res.json();
      setDecOutput(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const enableIsolation = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API}/security/network_isolation/enable`, { method: 'POST' });
      setNetStatus('enabled');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const disableIsolation = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API}/security/network_isolation/disable`, { method: 'POST' });
      setNetStatus('disabled');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ border: '1px solid #34c759', borderRadius: 8, padding: 16, margin: 16 }}>
      <h3>Security & Network Isolation</h3>
      <div>
        <input value={encInput} onChange={e => setEncInput(e.target.value)} placeholder="Text to encrypt" />
        <button onClick={encrypt} disabled={loading}>Encrypt</button>
        <input value={encOutput} readOnly placeholder="Encrypted output" style={{ width: 300 }} />
      </div>
      <div>
        <input value={decInput} onChange={e => setDecInput(e.target.value)} placeholder="Token to decrypt" />
        <button onClick={decrypt} disabled={loading}>Decrypt</button>
        <input value={decOutput} readOnly placeholder="Decrypted output" style={{ width: 300 }} />
      </div>
      <div>
        <button onClick={enableIsolation} disabled={loading || netStatus === 'enabled'}>Enable Network Isolation</button>
        <button onClick={disableIsolation} disabled={loading || netStatus === 'disabled'}>Disable Network Isolation</button>
        <span style={{ marginLeft: 8 }}>Status: <b>{netStatus}</b></span>
      </div>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </section>
  );
};

export default SecurityPanel;
