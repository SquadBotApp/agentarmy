import React, { useState, useEffect, useCallback } from 'react';
import {
  useDeploymentStore,
  MissionInfo,
  MissionStatus,
  RunnerInfo,
} from '../store/deploymentStore';
import styles from './DeploymentPanel.module.css';

// ─── Helpers ────────────────────────────────────────────────────────

const STATUS_CLASS: Record<MissionStatus, string> = {
  completed: styles.statusCompleted,
  running: styles.statusRunning,
  failed: styles.statusFailed,
  planning: styles.statusPlanning,
  deploying: styles.statusDeploying,
  adapting: styles.statusAdapting,
  aborted: styles.statusFailed,
};

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/** Map a node status to the extra CSS class for the chip. */
function nodeChipClass(status: string, base: string): string {
  if (status === 'completed') return `${base} completed`;
  if (status === 'failed') return `${base} failed`;
  if (status === 'running') return `${base} running`;
  return '';
}

/** Map a node status to its icon glyph. */
function nodeStatusIcon(status: string): string {
  if (status === 'completed') return '✓';
  if (status === 'failed') return '✗';
  return '';
}

/** Safely stringify an unknown value to display as text. */
function safeString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

// ─── Component ──────────────────────────────────────────────────────

export const DeploymentPanel: React.FC = () => {
  const {
    stats, missions, runners, recentEvents,
    loading, error,
    fetchAll, deployMission,
  } = useDeploymentStore();

  const [expanded, setExpanded] = useState(false);
  const [goal, setGoal] = useState('');
  const [domain, setDomain] = useState('');
  const [risk, setRisk] = useState('0.5');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!expanded) return;
    const id = setInterval(fetchAll, 8000);
    return () => clearInterval(id);
  }, [expanded, fetchAll]);

  const handleDeploy = useCallback(async () => {
    if (!goal.trim()) return;
    await deployMission(goal.trim(), domain.trim(), Number.parseFloat(risk));
    setGoal('');
    setDomain('');
  }, [goal, domain, risk, deployMission]);

  const missionList = Object.values(missions).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const runnerList = Object.values(runners);

  return (
    <div className={styles.deploymentPanel}>
      {/* Header */}
      <button
        type="button"
        className={styles.panelHeader}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded ? 'true' : 'false'}
      >
        <h3>🚀 Deployment Orchestrator</h3>
        <span className={styles.toggleBtn}>{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className={styles.panelContent}>
          {error && <p className={styles.errorText}>⚠ {error}</p>}

          {/* Stats Banner */}
          {stats && (
            <div className={styles.statsBanner}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{stats.total_missions}</span>
                <span className={styles.statLabel}>Missions</span>
              </div>
              <div className={`${styles.statBox} ${styles.statGood}`}>
                <span className={styles.statValue}>{stats.completed}</span>
                <span className={styles.statLabel}>Completed</span>
              </div>
              <div className={`${styles.statBox} ${stats.failed > 0 ? styles.statBad : ''}`}>
                <span className={styles.statValue}>{stats.failed}</span>
                <span className={styles.statLabel}>Failed</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{stats.running}</span>
                <span className={styles.statLabel}>Running</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{stats.total_cost_qb.toFixed(2)}</span>
                <span className={styles.statLabel}>Total Qb</span>
              </div>
              <div className={`${styles.statBox} ${styles.statWarn}`}>
                <span className={styles.statValue}>{stats.total_adaptations}</span>
                <span className={styles.statLabel}>Adaptations</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{stats.runners}</span>
                <span className={styles.statLabel}>Runners</span>
              </div>
            </div>
          )}

          {/* Deploy Form */}
          <div className={styles.section}>
            <h4>Deploy Mission</h4>
            <div className={styles.deployForm}>
              <input
                placeholder="Mission goal (e.g. 'Create marketing plan')"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
              />
              <input
                placeholder="Domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className={styles.domainInput}
              />
              <select value={risk} onChange={(e) => setRisk(e.target.value)} aria-label="Risk level">
                <option value="0.2">Low Risk</option>
                <option value="0.5">Standard</option>
                <option value="0.8">High Risk</option>
              </select>
              <button className={styles.deployBtn} onClick={handleDeploy} disabled={loading || !goal.trim()}>
                {loading ? '...' : '🚀 Deploy'}
              </button>
            </div>
          </div>

          {/* Mission List */}
          <div className={styles.section}>
            <h4>Missions ({missionList.length})</h4>
            {missionList.length === 0 && <p className={styles.emptyState}>No missions yet — deploy one above</p>}
            {missionList.slice(0, 10).map((m) => (
              <MissionCard key={m.mission_id} mission={m} />
            ))}
          </div>

          {/* Runners */}
          {runnerList.length > 0 && (
            <div className={styles.section}>
              <h4>Swarm Runners ({runnerList.length})</h4>
              <div className={styles.runnerGrid}>
                {runnerList.map((r) => (
                  <RunnerCard key={r.runner_id} runner={r} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Events */}
          {recentEvents.length > 0 && (
            <div className={styles.section}>
              <h4>Recent Events ({recentEvents.length})</h4>
              {[...recentEvents].reverse().slice(0, 15).map((e) => (
                <div key={e.event_id} className={styles.eventRow}>
                  <span className={styles.eventTime}>{fmtTime(e.timestamp)}</span>
                  <span className={styles.eventType}>{e.event_type}</span>
                  <span className={styles.eventDetail}>
                    {e.mission_id.slice(0, 18)}
                    {e.details.strategy ? ` — ${safeString(e.details.strategy)}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── MissionCard ────────────────────────────────────────────────────

const MissionCard: React.FC<{ mission: MissionInfo }> = ({ mission }) => {
  const nodes = Object.entries(mission.nodes);
  return (
    <div className={styles.missionCard}>
      <div className={styles.missionHeader}>
        <span className={styles.missionGoal}>{mission.goal}</span>
        <span className={`${styles.missionStatus} ${STATUS_CLASS[mission.status] || ''}`}>
          {mission.status}
        </span>
      </div>
      <div className={styles.missionMeta}>
        {mission.domain && <span>🏷 {mission.domain}</span>}
        <span>💰 {mission.spent_qb.toFixed(3)} / {mission.budget_qb} Qb</span>
        <span>📊 {nodes.length} nodes</span>
        {mission.adaptation_count > 0 && <span>🔄 {mission.adaptation_count} adaptations</span>}
        <span>⚖ risk {mission.risk_tolerance}</span>
      </div>
      {nodes.length > 0 && (
        <div className={styles.nodeList}>
          {nodes.map(([nid, n]) => (
            <span
              key={nid}
              className={`${styles.nodeChip} ${nodeChipClass(n.status, styles.nodeChip)}`}
              title={`${n.label}\nAgent: ${n.agent || '—'}\nRunner: ${n.runner || '—'}\nZPE: ${n.zpe}`}
            >
              {n.role || n.type} {nodeStatusIcon(n.status)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── RunnerCard ─────────────────────────────────────────────────────

const RunnerCard: React.FC<{ runner: RunnerInfo }> = ({ runner }) => (
  <div className={styles.runnerCard}>
    <div className={styles.runnerId}>{runner.runner_id}</div>
    <div className={styles.runnerMeta}>
      <span>⚡ {runner.latency_avg_ms}ms avg</span>
      <span>💰 {runner.cost_per_call} Qb/call</span>
      <span>🔧 {runner.tools.join(', ')}</span>
      <span>📊 {runner.load}/{runner.max_concurrent} load</span>
      {!runner.safety_cleared && <span className={styles.safetyWarning}>⚠ not safety-cleared</span>}
    </div>
  </div>
);

export default DeploymentPanel;
