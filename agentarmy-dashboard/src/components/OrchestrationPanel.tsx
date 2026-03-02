import React, { useState } from 'react';
import styles from './OrchestrationPanel.module.css';

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
    <div className={styles.orchestrationPanel}>
      <div className={styles.panelHeader}>
        <h3>🧠 Brain (Orchestration)</h3>
        <button
          className={styles.toggleBtn}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className={styles.panelContent}>
          {/* Task Submission */}
          <div className={`${styles.section} ${styles.taskSubmission}`}>
            <h4>Submit Task</h4>
            <input
              type="text"
              placeholder="Enter task goal (e.g., 'Create marketing plan')"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => {
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
              <div className={`${styles.section} ${styles.decisionSummary}`}>
                <h4>Decision</h4>
                {decision.nextTaskId ? (
                  <div className={styles.decisionMain}>
                    <div className={styles.decisionItem}>
                      <span>Next Task:</span>
                      <code>{decision.nextTaskId}</code>
                    </div>
                    <div className={styles.decisionItem}>
                      <span>Assigned Agent:</span>
                      <code>{decision.nextAgentId}</code>
                    </div>
                  </div>
                ) : (
                  <div className={styles.completionMessage}>
                    ✓ All tasks completed. Workflow finished.
                  </div>
                )}
                <p className={styles.rationale}>{decision.rationale}</p>
              </div>

              {/* ZPE Score Breakdown */}
              <div className={`${styles.section} ${styles.zpeBreakdown}`}>
                <h4>ZPE Score</h4>
                <div className={styles.zpeTotal}>
                  <span className={styles.scoreValue}>{decision.zpe.total.toFixed(3)}</span>
                  <span className={styles.scoreLabel}>/ 1.0</span>
                </div>
                <div className={styles.zpeComponents}>
                  {Object.entries(decision.zpe.components).map(([key, value]) => (
                    <div key={key} className={styles.componentBar}>
                      <span>{key}</span>
                      <div className={styles.barContainer}>
                        <div
                          className={styles.barFill}
                          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
                        />
                      </div>
                      <span className={styles.componentValue}>{value.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CPM Summary */}
              <div className={`${styles.section} ${styles.cpmSummary}`}>
                <h4>Critical Path Method (CPM)</h4>
                <div className={styles.cpmStats}>
                  <div className={styles.stat}>
                    <span>Project Duration:</span>
                    <span>{decision.cpm.project_duration.toFixed(2)} hours</span>
                  </div>
                  <div className={styles.stat}>
                    <span>Critical Tasks:</span>
                    <span>{decision.cpm.critical_tasks.length}</span>
                  </div>
                </div>
                {decision.cpm.critical_tasks.length > 0 && (
                  <div className={styles.criticalPath}>
                    <p>Critical Path:</p>
                    <code>{decision.cpm.critical_tasks.join(' → ')}</code>
                  </div>
                )}
              </div>

              {/* Alternatives */}
              <div className={styles.section}>
                <button
                  className={styles.alternativesToggle}
                  onClick={() => setShowAlternatives(!showAlternatives)}
                >
                  {showAlternatives ? '▼' : '▶'} View {decision.alternatives.length} Alternatives
                </button>
                {showAlternatives && (
                  <div className={styles.alternativesList}>
                    {decision.alternatives.map((alt) => (
                      <div key={`${alt.task_id}-${alt.agent_id}`} className={styles.alternativeItem}>
                        <div className={styles.altHeader}>
                          <span className={styles.altRank}>#{decision.alternatives.indexOf(alt) + 1}</span>
                          <span className={styles.altTask}>{alt.task_id}</span>
                          <span className={styles.altAgent}>{alt.agent_id}</span>
                          <span className={styles.altScore}>{alt.score.toFixed(3)}</span>
                          {alt.is_critical && <span className={styles.altCritical}>★ Critical</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {isLoading && (
            <div className={styles.loading}>
              <p>Orchestrating tasks...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
