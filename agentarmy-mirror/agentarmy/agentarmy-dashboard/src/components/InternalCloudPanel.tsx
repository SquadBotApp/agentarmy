import React, { useState } from 'react';

const API = process.env.REACT_APP_AGENTARMY_API || 'http://localhost:8000';

export const InternalCloudPanel: React.FC = () => {
  const [status, setStatus] = useState<'active' | 'inactive' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/internal_cloud/status`);
      const data = await res.json();
      setStatus(data.active ? 'active' : 'inactive');
    } catch (e: any) {
      setError(e.message);
      setStatus('unknown');
    } finally {
      setLoading(false);
    }
  };

  const startCloud = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API}/internal_cloud/start`, { method: 'POST' });
      setStatus('active');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const stopCloud = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API}/internal_cloud/stop`, { method: 'POST' });
      setStatus('inactive');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fallbackCloud = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`${API}/internal_cloud/fallback`, { method: 'POST' });
      setStatus('active');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchStatus(); }, []);

  return (
    <section style={{ border: '1px solid #d4af37', borderRadius: 8, padding: 16, margin: 16 }}>
      <h3>Internal Cloud / Offline Mode</h3>
      <p>Status: <b>{status}</b> {loading && '⏳'}</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <button onClick={fetchStatus} disabled={loading}>Refresh Status</button>
      <button onClick={startCloud} disabled={loading || status === 'active'}>Start Internal Cloud</button>
      <button onClick={stopCloud} disabled={loading || status !== 'active'}>Stop Internal Cloud</button>
      <button onClick={fallbackCloud} disabled={loading || status === 'active'}>Fallback to Offline</button>
    </section>
  );
};

export default InternalCloudPanel;
