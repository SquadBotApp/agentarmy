import { useEffect, useState, useCallback } from 'react';
import { fetchAgents, fetchSubsystems, broadcastEvent, shutdownRuntime } from './agentarmyApi';

export function useAgents() {
  const [agents, setAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchAgents()
      .then(setAgents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { agents, loading, error, refresh };
}

export function useSubsystems() {
  const [subsystems, setSubsystems] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchSubsystems()
      .then(setSubsystems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { subsystems, loading, error, refresh };
}

export function useBroadcastEvent() {
  return broadcastEvent;
}

export function useShutdownRuntime() {
  return shutdownRuntime;
}
