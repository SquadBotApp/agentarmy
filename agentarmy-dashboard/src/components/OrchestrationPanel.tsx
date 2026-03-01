import React, { useState } from 'react';

/**
 * OrchestrationPanel
 * Displays orchestration decisions from the Python service
 * Shows ZPE scores, CPM timeline, task routing, and alternatives
 */

interface ZPEScoreData {
  total: number;
  components: Record<string, number>;
}

interface CPMSummary {
  project_duration: number;
  critical_tasks: string[];
}

interface OrchestrationAlternative {
  task_id: string;
  agent_id: string;
  score: number;
  components: Record<string, number>;
  is_critical: boolean;
}

interface OrchestrationDecision {
  nextTaskId: string | null;
  nextAgentId: string | null;
  zpe: ZPEScoreData;
  cpm: CPMSummary;
  rationale: string;
  alternatives: OrchestrationAlternative[];
}

interface OrchestrationPanelProps {
  decision?: OrchestrationDecision;
  isLoading?: boolean;
  onSubmitTask?: (taskGoal: string) => void;
}

export const OrchestrationPanel: React.FC<OrchestrationPanelProps> = ({
  decision,
  isLoading = false,
  onSubmitTask,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [taskInput, setTaskInput] = useState('');

  const handleSubmit = () => {
    if (taskInput.trim() && onSubmitTask) {
      onSubmitTask(taskInput);
      setTaskInput('');
    }
  };

  return (
    <div className="orchestration-panel">
      <div className="panel-header">
        <h3>🧠 Brain (Orchestration)</h3>
        <button
          className="toggle-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="panel-content">
          {/* Task Submission */}
          <div className="section task-submission">
            <h4>Submit Task</h4>
            <input
              type="text"
              placeholder="Enter task goal (e.g., 'Create marketing plan')"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
            <button onClick={handleSubmit} disabled={isLoading || !taskInput.trim()}>
              {isLoading ? 'Processing...' : 'Submit'}
            </button>
          </div>

          {decision && !isLoading && (
            <>
              {/* Decision Summary */}
              <div className="section decision-summary">
                <h4>Decision</h4>
                {decision.nextTaskId ? (
                  <div className="decision-main">
                    <div className="decision-item">
                      <label>Next Task:</label>
                      <code>{decision.nextTaskId}</code>
                    </div>
                    <div className="decision-item">
                      <label>Assigned Agent:</label>
                      <code>{decision.nextAgentId}</code>
                    </div>
                  </div>
                ) : (
                  <div className="completion-message">
                    ✓ All tasks completed. Workflow finished.
                  </div>
                )}
                <p className="rationale">{decision.rationale}</p>
              </div>

              {/* ZPE Score Breakdown */}
              <div className="section zpe-breakdown">
                <h4>ZPE Score</h4>
                <div className="zpe-total">
                  <span className="score-value">{decision.zpe.total.toFixed(3)}</span>
                  <span className="score-label">/ 1.0</span>
                </div>
                <div className="zpe-components">
                  {Object.entries(decision.zpe.components).map(([key, value]) => (
                    <div key={key} className="component-bar">
                      <label>{key}</label>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
                        />
                      </div>
                      <span className="component-value">{value.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CPM Summary */}
              <div className="section cpm-summary">
                <h4>Critical Path Method (CPM)</h4>
                <div className="cpm-stats">
                  <div className="stat">
                    <label>Project Duration:</label>
                    <span>{decision.cpm.project_duration.toFixed(2)} hours</span>
                  </div>
                  <div className="stat">
                    <label>Critical Tasks:</label>
                    <span>{decision.cpm.critical_tasks.length}</span>
                  </div>
                </div>
                {decision.cpm.critical_tasks.length > 0 && (
                  <div className="critical-path">
                    <p>Critical Path:</p>
                    <code>{decision.cpm.critical_tasks.join(' → ')}</code>
                  </div>
                )}
              </div>

              {/* Alternatives */}
              <div className="section alternatives">
                <button
                  className="alternatives-toggle"
                  onClick={() => setShowAlternatives(!showAlternatives)}
                >
                  {showAlternatives ? '▼' : '▶'} View {decision.alternatives.length} Alternatives
                </button>
                {showAlternatives && (
                  <div className="alternatives-list">
                    {decision.alternatives.map((alt, idx) => (
                      <div key={idx} className="alternative-item">
                        <div className="alt-header">
                          <span className="alt-rank">#{idx + 1}</span>
                          <span className="alt-task">{alt.task_id}</span>
                          <span className="alt-agent">{alt.agent_id}</span>
                          <span className="alt-score">{alt.score.toFixed(3)}</span>
                          {alt.is_critical && <span className="alt-critical">★ Critical</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {isLoading && (
            <div className="loading">
              <p>Orchestrating tasks...</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .orchestration-panel {
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          background: #1a1a1a;
          color: #e0e0e0;
          margin: 16px 0;
          font-family: 'Segoe UI', sans-serif;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #242424;
          border-bottom: 1px solid #2a2a2a;
          cursor: pointer;
          border-radius: 8px 8px 0 0;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .toggle-btn {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }

        .panel-content {
          padding: 16px;
          max-height: 800px;
          overflow-y: auto;
        }

        .section {
          margin-bottom: 20px;
          padding: 12px;
          background: #222;
          border-radius: 6px;
          border: 1px solid #2a2a2a;
        }

        .section h4 {
          margin: 0 0 12px 0;
          font-size: 13px;
          font-weight: 600;
          color: #4a9eff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Task Submission */
        .task-submission input {
          width: 100%;
          padding: 8px 12px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          color: #e0e0e0;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .task-submission input::placeholder {
          color: #666;
        }

        .task-submission button {
          width: 100%;
          padding: 8px;
          background: #4a9eff;
          border: none;
          border-radius: 4px;
          color: black;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: opacity 0.2s;
        }

        .task-submission button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .task-submission button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Decision Summary */
        .decision-summary {
          background: #1f3a52;
          border: 1px solid #2a5a7a;
        }

        .decision-main {
          margin-bottom: 12px;
        }

        .decision-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .decision-item label {
          font-weight: 600;
          color: #4a9eff;
          min-width: 120px;
          font-size: 12px;
        }

        .decision-item code {
          background: #1a1a1a;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #66ff66;
        }

        .completion-message {
          color: #66ff66;
          font-weight: 600;
          font-size: 13px;
          padding: 12px;
          background: #1a3a1a;
          border-radius: 4px;
          border: 1px solid #3a6a3a;
        }

        .rationale {
          margin: 8px 0 0 0;
          font-size: 12px;
          color: #aaa;
          line-height: 1.4;
        }

        /* ZPE Score */
        .zpe-breakdown {
          background: #2a2a1a;
          border: 1px solid #3a3a2a;
        }

        .zpe-total {
          display: flex;
          align-items: baseline;
          margin-bottom: 16px;
        }

        .score-value {
          font-size: 28px;
          font-weight: 700;
          color: #66ff66;
          margin-right: 6px;
        }

        .score-label {
          font-size: 12px;
          color: #888;
        }

        .zpe-components {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .component-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .component-bar label {
          font-weight: 500;
          color: #999;
          min-width: 90px;
          text-align: right;
        }

        .bar-container {
          flex: 1;
          height: 16px;
          background: #1a1a1a;
          border-radius: 2px;
          overflow: hidden;
          border: 1px solid #2a2a2a;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #4a9eff, #66ff66);
          transition: width 0.3s ease;
        }

        .component-value {
          min-width: 50px;
          text-align: right;
          color: #66ff66;
          font-weight: 600;
        }

        /* CPM Summary */
        .cpm-summary {
          background: #1a3a2a;
          border: 1px solid #2a5a4a;
        }

        .cpm-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .stat label {
          color: #888;
          font-weight: 500;
        }

        .stat span {
          color: #66ff66;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }

        .critical-path {
          padding: 8px;
          background: #1a1a1a;
          border-radius: 4px;
        }

        .critical-path p {
          margin: 0 0 6px 0;
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .critical-path code {
          font-size: 11px;
          color: #ffff66;
          font-family: 'Courier New', monospace;
          word-break: break-all;
        }

        /* Alternatives */
        .alternatives-toggle {
          width: 100%;
          padding: 8px;
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 4px;
          color: #e0e0e0;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .alternatives-toggle:hover {
          opacity: 0.8;
        }

        .alternatives-list {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 300px;
          overflow-y: auto;
        }

        .alternative-item {
          padding: 8px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          font-size: 11px;
        }

        .alt-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alt-rank {
          color: #888;
          font-weight: 600;
          min-width: 30px;
        }

        .alt-task {
          color: #66ff66;
          font-family: 'Courier New', monospace;
          flex: 1;
        }

        .alt-agent {
          color: #4a9eff;
          font-weight: 500;
        }

        .alt-score {
          color: #ffff66;
          font-weight: 600;
          min-width: 50px;
          text-align: right;
        }

        .alt-critical {
          color: #ff6666;
          font-weight: 700;
        }

        .loading {
          text-align: center;
          padding: 24px;
          color: #888;
          font-style: italic;
        }

        /* Scrollbar styling */
        .panel-content::-webkit-scrollbar {
          width: 6px;
        }

        .panel-content::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .panel-content::-webkit-scrollbar-thumb {
          background: #3a3a3a;
          border-radius: 3px;
        }

        .panel-content::-webkit-scrollbar-thumb:hover {
          background: #4a4a4a;
        }
      `}</style>
    </div>
  );
};
