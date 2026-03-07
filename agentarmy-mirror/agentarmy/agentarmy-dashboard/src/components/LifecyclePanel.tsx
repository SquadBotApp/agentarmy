import React, { useState, useEffect, useCallback } from 'react';
import { useLifecycleStore, ManagedAgentInfo, LifecycleStage } from '../store/lifecycleStore';
import styles from './LifecyclePanel.module.css';

// ─── Helpers ────────────────────────────────────────────────────────

const STAGE_BADGE: Record<LifecycleStage, string> = {
  active: styles.badgeActive,
  candidate: styles.badgeCandidate,
  staging: styles.badgeCandidate,
  evolving: styles.badgeActive,
  frozen: styles.badgeFrozen,
  retired: styles.badgeRetired,
  merged: styles.badgeMerged,
  forked: styles.badgeForked,
};

function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function severityClass(severity: string): string {
  if (severity === 'critical') return styles.severityCritical;
  if (severity === 'high') return styles.severityHigh;
  return styles.severityMedium;
}

// ─── Component ──────────────────────────────────────────────────────

export const LifecyclePanel: React.FC = () => {
  const {
    agents, auditLog, constitutionalStatus, loading, error,
    fetchAll, createAgent, deployAgent, freezeAgent, unfreezeAgent,
    retireAgent, lockTools, unlockTools, forkAgent,
  } = useLifecycleStore();

  const [expanded, setExpanded] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('executor');

  // Fetch on mount + poll every 8s while expanded
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!expanded) return;
    const id = setInterval(fetchAll, 8000);
    return () => clearInterval(id);
  }, [expanded, fetchAll]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    await createAgent(newName.trim(), newRole);
    setNewName('');
  }, [newName, newRole, createAgent]);

  const agentList = Object.values(agents);

  return (
    <div className={styles.lifecyclePanel}>
      {/* Header */}
      <button
        type="button"
        className={styles.panelHeader}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={!!expanded}
      >
        <h3>🛡️ Lifecycle Manager</h3>
        <span className={styles.toggleBtn}>{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className={styles.panelContent}>
          {error && <p className={styles.errorText}>⚠ {error}</p>}

          {/* Constitutional Status */}
          {constitutionalStatus && (
            <div className={styles.statusBanner}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{constitutionalStatus.total_agents}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{constitutionalStatus.active_agents}</span>
                <span className={styles.statLabel}>Active</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{constitutionalStatus.frozen_agents}</span>
                <span className={styles.statLabel}>Frozen</span>
              </div>
              <div className={`${styles.statBox} ${constitutionalStatus.high_risk_agents > 0 ? styles.statWarning : ''}`}>
                <span className={styles.statValue}>{constitutionalStatus.high_risk_agents}</span>
                <span className={styles.statLabel}>High-Risk</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{(constitutionalStatus.avg_performance * 100).toFixed(0)}%</span>
                <span className={styles.statLabel}>Avg Perf</span>
              </div>
              <div className={`${styles.statBox} ${constitutionalStatus.recent_violations > 0 ? styles.statWarning : ''}`}>
                <span className={styles.statValue}>{constitutionalStatus.recent_violations}</span>
                <span className={styles.statLabel}>Violations</span>
              </div>
            </div>
          )}

          {/* Agent List */}
          <div className={styles.section}>
            <h4>Managed Agents ({agentList.length})</h4>
            {agentList.length === 0 && <p className={styles.emptyState}>No agents yet</p>}
            {agentList.map((a) => (
              <AgentRow
                key={a.agent_id}
                agent={a}
                onDeploy={() => deployAgent(a.agent_id)}
                onFreeze={() => freezeAgent(a.agent_id)}
                onUnfreeze={() => unfreezeAgent(a.agent_id)}
                onRetire={() => retireAgent(a.agent_id)}
                onLockTools={() => lockTools(a.agent_id)}
                onUnlockTools={() => unlockTools(a.agent_id)}
                onFork={() => forkAgent(a.agent_id, `${a.name} (fork)`)}
              />
            ))}
          </div>

          {/* Create Agent */}
          <div className={styles.section}>
            <h4>Create Agent</h4>
            <div className={styles.createForm}>
              <input
                placeholder="Agent name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} aria-label="Agent role">
                <option value="planner">Planner</option>
                <option value="executor">Executor</option>
                <option value="critic">Critic</option>
                <option value="governor">Governor</option>
                <option value="synthesizer">Synthesizer</option>
              </select>
              <button className={styles.createBtn} onClick={handleCreate} disabled={loading}>
                {loading ? '...' : '+ Create'}
              </button>
            </div>
          </div>

          {/* Constitutional Rules */}
          {constitutionalStatus && constitutionalStatus.rules.length > 0 && (
            <div className={styles.section}>
              <h4>Constitutional Rules ({constitutionalStatus.rules_count})</h4>
              {constitutionalStatus.rules.map((r) => (
                <div key={r.id} className={styles.ruleRow}>
                  <span className={styles.ruleId}>{r.id}</span>
                  <span className={styles.ruleDesc}>{r.desc}</span>
                  <span className={`${styles.ruleSeverity} ${severityClass(r.severity)}`}>{r.severity}</span>
                </div>
              ))}
            </div>
          )}

          {/* Audit Log */}
          <div className={styles.section}>
            <h4>Audit Log (latest {auditLog.length})</h4>
            {auditLog.length === 0 && <p className={styles.emptyState}>No events yet</p>}
            {[...auditLog].reverse().slice(0, 20).map((e) => (
              <div key={e.event_id} className={styles.auditRow}>
                <span className={styles.auditTime}>{fmtTime(e.timestamp)}</span>
                <span className={styles.auditType}>{e.event_type}</span>
                <span className={styles.auditAgent}>{e.agent_name}</span>
                <span className={e.safety_check_passed ? styles.safetyPass : styles.safetyFail}>
                  {e.safety_check_passed ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AgentRow sub-component ─────────────────────────────────────────

interface AgentRowProps {
  agent: ManagedAgentInfo;
  onDeploy: () => void;
  onFreeze: () => void;
  onUnfreeze: () => void;
  onRetire: () => void;
  onLockTools: () => void;
  onUnlockTools: () => void;
  onFork: () => void;
}

const AgentRow: React.FC<AgentRowProps> = ({
  agent, onDeploy, onFreeze, onUnfreeze, onRetire, onLockTools, onUnlockTools, onFork,
}) => {
  const v = agent.current_version;
  return (
    <div className={styles.agentRow}>
      <div className={styles.agentInfo}>
        <span className={styles.agentName}>{agent.name}</span>
        <div className={styles.agentMeta}>
          <span className={`${styles.badge} ${STAGE_BADGE[agent.stage] || ''}`}>{agent.stage}</span>
          <span>{agent.role}</span>
          {v && <span>v{v.version_number}</span>}
          {v && <span>ZPE {v.zpe_baseline.toFixed(2)}</span>}
          <span>perf {(agent.performance_score * 100).toFixed(0)}%</span>
          <span>{agent.total_missions} missions</span>
          {agent.tools_locked && <span className={styles.toolsLocked}>🔒 tools</span>}
          {agent.governance_required && <span className={styles.govRequired}>⚖️ gov</span>}
        </div>
      </div>
      <div className={styles.agentActions}>
        {agent.stage === 'candidate' && (
          <button className={styles.actionBtn} onClick={onDeploy} title="Deploy">▶</button>
        )}
        {!agent.frozen && agent.stage !== 'retired' && (
          <button className={styles.actionBtn} onClick={onFreeze} title="Freeze">❄</button>
        )}
        {agent.frozen && (
          <button className={styles.actionBtn} onClick={onUnfreeze} title="Unfreeze">☀</button>
        )}
        {agent.tools_locked ? (
          <button className={styles.actionBtn} onClick={onUnlockTools} title="Unlock tools">🔓</button>
        ) : (
          <button className={styles.actionBtn} onClick={onLockTools} title="Lock tools">🔒</button>
        )}
        <button className={styles.actionBtn} onClick={onFork} title="Fork">⑂</button>
        {agent.stage !== 'retired' && (
          <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={onRetire} title="Retire">✕</button>
        )}
      </div>
    </div>
  );
};

export default LifecyclePanel;
