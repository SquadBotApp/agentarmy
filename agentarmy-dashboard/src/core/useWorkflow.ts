import { useState, useCallback } from 'react';
import { createWorkflow, runWorkflow, getWorkflowStatus, getWorkflowResults } from './workflowApi';

export function useWorkflow(name: string) {
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(() => {
    setLoading(true);
    getWorkflowStatus(name)
      .then(res => setStatus(res.status))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  const refreshResults = useCallback(() => {
    setLoading(true);
    getWorkflowResults(name)
      .then(res => setResults(res.results))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  const run = useCallback(() => {
    setLoading(true);
    runWorkflow(name)
      .then(res => {
        setStatus('completed');
        setResults(res.results);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  return { status, results, error, loading, refreshStatus, refreshResults, run };
}

export function useCreateWorkflow() {
  return createWorkflow;
}
