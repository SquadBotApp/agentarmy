import React, { useState } from 'react';
import { useWorkflow, useCreateWorkflow } from '../core/useWorkflow';

export function WorkflowPanel() {
  const [workflowName, setWorkflowName] = useState('sample_etl_delivery');
  const [stepJson, setStepJson] = useState('[{"name":"Extract from Fivetran","agent_name":"fivetran_integration","action":"step"},{"name":"Virtualize with Denodo","agent_name":"denodo_integration","action":"step"},{"name":"Transform with Matillion","agent_name":"matillion_integration","action":"step"},{"name":"Deliver via Cleo","agent_name":"cleo_integration","action":"step"}]');
  const { status, results, error, loading, refreshStatus, refreshResults, run } = useWorkflow(workflowName);
  const createWorkflow = useCreateWorkflow();
  const [createMsg, setCreateMsg] = useState('');

  const handleCreate = async () => {
    try {
      const steps = JSON.parse(stepJson);
      await createWorkflow(workflowName, steps);
      setCreateMsg('Workflow created!');
    } catch (e: any) {
      setCreateMsg('Error: ' + e.message);
    }
  };

  return (
    <section>
      <h3>Workflow Automation</h3>
      <div>
        <label>Workflow Name: <input value={workflowName} onChange={e => setWorkflowName(e.target.value)} /></label>
      </div>
      <div>
        <label>Steps (JSON):<br />
          <textarea value={stepJson} onChange={e => setStepJson(e.target.value)} rows={4} cols={60} />
        </label>
      </div>
      <button onClick={handleCreate}>Create Workflow</button>
      <button onClick={run} disabled={loading}>Run Workflow</button>
      <button onClick={refreshStatus}>Refresh Status</button>
      <button onClick={refreshResults}>Refresh Results</button>
      <div>Status: {status}</div>
      <div>{createMsg}</div>
      {error && <div style={{color:'red'}}>Error: {error}</div>}
      <div>
        <h4>Results</h4>
        <pre>{JSON.stringify(results, null, 2)}</pre>
      </div>
    </section>
  );
}
