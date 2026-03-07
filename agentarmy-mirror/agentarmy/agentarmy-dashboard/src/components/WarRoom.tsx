/**
 * WarRoom — Root-Owner Console
 *
 * A sealed cockpit layered on top of the standard UI. Mirrors the public
 * dashboard mental model but adds deep authority surfaces that only the
 * root-owner should ever see:
 *
 *   §1 System Overview     — subsystem health, version lineage, anomaly logs
 *   §2 Defensive Intel     — threat/opportunity maps, simulations, proposals
 *   §3 Upgrade Governance  — version freeze, rollback, packaging, scheduling
 *   §4 Economic Engine     — QubitCoin treasury, issuance, halving, activation
 *   §5 Master Control      — freeze, isolate, shutdown, ownership transfer
 *
 * This component is NEVER rendered for non-root users.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { TotalSystemUnification, SubsystemStatus } from '../core/totalSystemUnification';
import type {
  DISSummary,
  DefensiveIntelReport,
  UpgradeProposal,
  VersionRecord,
  ThreatInsight,
  OpportunityInsight,
  SimulationResult,
  QCSummary,
  QCSupplyMetrics,
  QCTreasurySnapshot,
  HalvingEpoch,
  QCTreasuryInvestment,
  GlobalRiskLevel,
} from '../core/defensiveIntelligenceSubstructure';
import styles from './WarRoom.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WarRoomTab = 'overview' | 'intel' | 'upgrades' | 'economy' | 'control';

interface WarRoomProps {
  /** Pre-constructed TSU instance (the entire OS kernel). */
  tsu: TotalSystemUnification;
  /** Close callback. */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskBadge(level: GlobalRiskLevel): string {
  const map: Record<GlobalRiskLevel, string> = {
    calm: '🟢 CALM',
    watch: '🟡 WATCH',
    elevated: '🟠 ELEVATED',
    critical: '🔴 CRITICAL',
  };
  return map[level];
}

function riskClass(level: GlobalRiskLevel): string {
  const map: Record<GlobalRiskLevel, string> = {
    calm: styles.riskCalm,
    watch: styles.riskWatch,
    elevated: styles.riskElevated,
    critical: styles.riskCritical,
  };
  return map[level];
}

function statusIcon(status: string): string {
  const map: Record<string, string> = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌',
    deferred: '⏸️',
    implemented: '🚀',
  };
  return map[status] ?? '❓';
}

function priorityClass(p: string): string {
  const map: Record<string, string> = {
    low: styles.priLow,
    medium: styles.priMedium,
    high: styles.priHigh,
    critical: styles.priCritical,
  };
  return map[p] ?? '';
}

function formatQC(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toFixed(2);
}

function formatMs(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const d = Math.floor(hr / 24);
  if (d > 0) return `${d}d ${hr % 24}h`;
  if (hr > 0) return `${hr}h ${min % 60}m`;
  if (min > 0) return `${min}m ${sec % 60}s`;
  return `${sec}s`;
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

// ---------------------------------------------------------------------------
// Sub-panels
// ---------------------------------------------------------------------------

/** §1 System Overview */
function OverviewPanel({ tsu }: Readonly<{ tsu: TotalSystemUnification }>) {
  const snapshot = useMemo(() => tsu.getSnapshot(), [tsu]);
  const disSummary: DISSummary = useMemo(
    () => tsu.defensiveIntel.getSummary(),
    [tsu],
  );

  return (
    <div className={styles.panel}>
      {/* Global integrity banner */}
      <div className={`${styles.integrityBanner} ${riskClass(disSummary.globalRiskLevel)}`}>
        <span className={styles.integrityLabel}>GLOBAL INTEGRITY</span>
        <span className={styles.integrityValue}>{riskBadge(disSummary.globalRiskLevel)}</span>
        <span className={styles.integrityMeta}>
          {snapshot.healthyCount}/{snapshot.totalSubsystems} healthy &bull; v{disSummary.currentVersion} &bull; uptime {formatMs(disSummary.uptime)}
        </span>
      </div>

      {/* Subsystem grid */}
      <h4 className={styles.sectionTitle}>Active Subsystems ({snapshot.totalSubsystems})</h4>
      <div className={styles.subsystemGrid}>
        {snapshot.subsystems.map((s: SubsystemStatus) => (
          <div
            key={s.name}
            className={`${styles.subsystemChip} ${s.healthy ? styles.chipHealthy : styles.chipUnhealthy}`}
            title={JSON.stringify(s.summary, null, 2)}
          >
            <span className={styles.chipDot}>{s.healthy ? '●' : '○'}</span>
            <span className={styles.chipName}>{s.name}</span>
          </div>
        ))}
      </div>

      {/* Version lineage */}
      <h4 className={styles.sectionTitle}>Version Lineage</h4>
      <VersionLineage versions={tsu.defensiveIntel.getVersionHistory()} />

      {/* Key metrics */}
      <h4 className={styles.sectionTitle}>Quick Metrics</h4>
      <div className={styles.metricsRow}>
        <MetricCard label="Cycle Tick" value={String(disSummary.cycleTick)} />
        <MetricCard label="Signals" value={String(disSummary.signalCount)} />
        <MetricCard label="Threats" value={String(disSummary.threatCount)} />
        <MetricCard label="Opportunities" value={String(disSummary.opportunityCount)} />
        <MetricCard label="Pending Proposals" value={String(disSummary.pendingProposals)} />
        <MetricCard label="DIS Events" value={String(disSummary.eventCount)} />
      </div>
    </div>
  );
}

/** §2 Defensive Intelligence */
function IntelPanel({ tsu }: Readonly<{ tsu: TotalSystemUnification }>) {
  const dis = tsu.defensiveIntel;
  const report: DefensiveIntelReport = useMemo(() => dis.generateReport(), [dis]);
  const anticipated: ThreatInsight[] = useMemo(() => dis.anticipateThreats(), [dis]);

  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const handleApprove = useCallback((id: string) => {
    const ok = dis.approveProposal(id);
    setActionLog(prev => [`✅ ${ok ? 'Approved' : 'Failed'}: ${id}`, ...prev].slice(0, 20));
    setSelectedProposal(null);
  }, [dis]);

  const handleReject = useCallback((id: string) => {
    const ok = dis.rejectProposal(id);
    setActionLog(prev => [`❌ ${ok ? 'Rejected' : 'Failed'}: ${id}`, ...prev].slice(0, 20));
    setSelectedProposal(null);
  }, [dis]);

  const handleDefer = useCallback((id: string) => {
    const ok = dis.deferProposal(id);
    setActionLog(prev => [`⏸️ ${ok ? 'Deferred' : 'Failed'}: ${id}`, ...prev].slice(0, 20));
    setSelectedProposal(null);
  }, [dis]);

  return (
    <div className={styles.panel}>
      {/* Risk map */}
      <div className={`${styles.integrityBanner} ${riskClass(report.globalRiskLevel)}`}>
        <span className={styles.integrityLabel}>AI ECOSYSTEM RISK</span>
        <span className={styles.integrityValue}>{riskBadge(report.globalRiskLevel)}</span>
        <span className={styles.integrityMeta}>
          {report.threats.length} threats &bull; {report.opportunities.length} opportunities &bull; {report.simulations.length} simulations
        </span>
      </div>

      {/* Threat map */}
      <h4 className={styles.sectionTitle}>Threat Map</h4>
      <div className={styles.scrollList}>
        {report.threats.length === 0 && <p className={styles.muted}>No active threats detected.</p>}
        {report.threats.map((t: ThreatInsight) => (
          <div key={t.signalId} className={styles.threatRow}>
            <span className={styles.threatBullet}>⚠️</span>
            <div className={styles.threatBody}>
              <span className={styles.threatId}>{t.signalId}</span>
              <span>Likelihood&nbsp;{pct(t.threatLikelihood)} &bull; Impact&nbsp;{pct(t.threatImpact)} &bull; Risk&nbsp;{pct(t.compoundRisk)}</span>
              <span className={styles.muted}>{t.mitigationStrategy}</span>
              <span className={styles.muted}>Timeline: {t.anticipatedTimeline}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Opportunity map */}
      <h4 className={styles.sectionTitle}>Opportunity Map</h4>
      <div className={styles.scrollList}>
        {report.opportunities.length === 0 && <p className={styles.muted}>No opportunities identified yet.</p>}
        {report.opportunities.map((o: OpportunityInsight) => (
          <div key={o.signalId} className={styles.oppRow}>
            <span className={styles.oppBullet}>💎</span>
            <div className={styles.oppBody}>
              <span className={styles.oppId}>{o.signalId}</span>
              <span>Value&nbsp;{pct(o.opportunityValue)} &bull; Cost&nbsp;{pct(o.integrationCost)} &bull; Safety&nbsp;{pct(o.safetyAlignment)}</span>
              <span className={styles.muted}>{o.recommendedAction}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Anticipated threats (predictive) */}
      <h4 className={styles.sectionTitle}>Predicted Capability Jumps</h4>
      <div className={styles.scrollList}>
        {anticipated.length === 0 && <p className={styles.muted}>Insufficient data for anticipation.</p>}
        {anticipated.map((t: ThreatInsight) => (
          <div key={t.signalId} className={styles.threatRow}>
            <span className={styles.threatBullet}>🔮</span>
            <div className={styles.threatBody}>
              <span className={styles.threatId}>{t.signalId}</span>
              <span>Projected risk&nbsp;{pct(t.compoundRisk)}</span>
              <span className={styles.muted}>{t.mitigationStrategy}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Simulation results */}
      <h4 className={styles.sectionTitle}>Simulation Results</h4>
      <div className={styles.scrollList}>
        {report.simulations.map((sim: SimulationResult) => (
          <div key={sim.signalId} className={styles.simRow}>
            <span className={sim.netScore > 0 ? styles.simPositive : styles.simNegative}>
              {sim.netScore > 0 ? '↑' : '↓'} {sim.netScore.toFixed(2)}
            </span>
            <span className={styles.simSummary}>{sim.summary}</span>
          </div>
        ))}
      </div>

      {/* Proposals with governance */}
      <h4 className={styles.sectionTitle}>Upgrade Proposals ({report.proposals.length})</h4>
      <div className={styles.scrollList}>
        {report.proposals.map((p: UpgradeProposal) => (
          <button
            type="button"
            key={p.id}
            className={`${styles.proposalRow} ${selectedProposal === p.id ? styles.proposalSelected : ''} ${priorityClass(p.recommendedPriority)}`}
            onClick={() => setSelectedProposal(selectedProposal === p.id ? null : p.id)}
          >
            <div className={styles.proposalHeader}>
              <span>{statusIcon(p.status)} {p.title}</span>
              <span className={styles.proposalPri}>{p.recommendedPriority.toUpperCase()}</span>
            </div>
            {selectedProposal === p.id && (
              <div className={styles.proposalDetail}>
                <p>{p.description}</p>
                <div className={styles.proposalMeta}>
                  <span>Threat: {pct(p.threatScore)}</span>
                  <span>Opportunity: {pct(p.opportunityScore)}</span>
                  <span>Risk: {pct(p.riskScore)}</span>
                  <span>Effort: {pct(p.effortScore)}</span>
                  <span>Gain: {p.expectedGain}</span>
                </div>
                {p.status === 'pending' && (
                  <div className={styles.proposalActions}>
                    <button className={`${styles.btn} ${styles.btnApprove}`} onClick={e => { e.stopPropagation(); handleApprove(p.id); }}>Approve</button>
                    <button className={`${styles.btn} ${styles.btnReject}`} onClick={e => { e.stopPropagation(); handleReject(p.id); }}>Reject</button>
                    <button className={`${styles.btn} ${styles.btnDefer}`} onClick={e => { e.stopPropagation(); handleDefer(p.id); }}>Defer</button>
                  </div>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Strategic notes */}
      {report.notes.length > 0 && (
        <>
          <h4 className={styles.sectionTitle}>Strategic Notes</h4>
          <ul className={styles.notesList}>
            {report.notes.map((n, i) => (
              <li key={`note-${n.slice(0, 20)}`} className={styles.noteItem}>📌 {n}</li>
            ))}
          </ul>
        </>
      )}

      {/* Action log */}
      {actionLog.length > 0 && (
        <>
          <h4 className={styles.sectionTitle}>Governance Log</h4>
          <div className={styles.logBox}>
            {actionLog.map((entry) => (
              <div key={entry} className={styles.logEntry}>{entry}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** §3 Upgrade Governance */
function UpgradePanel({ tsu }: Readonly<{ tsu: TotalSystemUnification }>) {
  const dis = tsu.defensiveIntel;
  const [rolloutTag, setRolloutTag] = useState('');
  const [rolloutLog, setRolloutLog] = useState('');
  const [rolloutResult, setRolloutResult] = useState<string | null>(null);

  const pending = useMemo(() => dis.getPendingProposals(), [dis]);
  const approved = useMemo(() => dis.getApprovedProposals(), [dis]);
  const all = useMemo(() => dis.getAllProposals(), [dis]);
  const versions = useMemo(() => dis.getVersionHistory(), [dis]);

  const handleRollout = useCallback(() => {
    if (!rolloutTag.trim()) return;
    const record = dis.rolloutVersion(rolloutTag.trim(), rolloutLog.trim() || 'No changelog provided');
    if (record) {
      setRolloutResult(`✅ Released v${record.version} with ${record.proposalIds.length} improvements`);
    } else {
      setRolloutResult('⚠️ No approved proposals to release');
    }
    setRolloutTag('');
    setRolloutLog('');
  }, [dis, rolloutTag, rolloutLog]);

  return (
    <div className={styles.panel}>
      {/* Status summary */}
      <div className={styles.metricsRow}>
        <MetricCard label="Pending" value={String(pending.length)} />
        <MetricCard label="Approved" value={String(approved.length)} />
        <MetricCard label="Implemented" value={String(all.filter(p => p.status === 'implemented').length)} />
        <MetricCard label="Rejected" value={String(all.filter(p => p.status === 'rejected').length)} />
        <MetricCard label="Versions Released" value={String(versions.length)} />
        <MetricCard label="Current" value={dis.getCurrentVersion()} />
      </div>

      {/* Approved awaiting rollout */}
      <h4 className={styles.sectionTitle}>Approved — Awaiting Rollout ({approved.length})</h4>
      <div className={styles.scrollList}>
        {approved.length === 0 && <p className={styles.muted}>No approved proposals pending rollout.</p>}
        {approved.map((p: UpgradeProposal) => (
          <div key={p.id} className={styles.proposalRow}>
            <span>✅ {p.title}</span>
            <span className={styles.proposalPri}>{p.recommendedPriority.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Rollout controls */}
      <h4 className={styles.sectionTitle}>Release Version</h4>
      <div className={styles.rolloutForm}>
        <input
          className={styles.input}
          type="text"
          placeholder="Version tag (e.g. 2.1.0)"
          value={rolloutTag}
          onChange={e => setRolloutTag(e.target.value)}
        />
        <textarea
          className={styles.textarea}
          placeholder="Changelog..."
          value={rolloutLog}
          onChange={e => setRolloutLog(e.target.value)}
          rows={3}
        />
        <button
          className={`${styles.btn} ${styles.btnApprove}`}
          onClick={handleRollout}
          disabled={!rolloutTag.trim() || approved.length === 0}
        >
          Release
        </button>
        {rolloutResult && <p className={styles.rolloutResult}>{rolloutResult}</p>}
      </div>

      {/* Version lineage */}
      <h4 className={styles.sectionTitle}>Version Lineage</h4>
      <VersionLineage versions={versions} />

      {/* Rollback points */}
      <h4 className={styles.sectionTitle}>Rollback Points</h4>
      <div className={styles.scrollList}>
        {versions.filter(v => v.rollbackAvailable).map((v: VersionRecord) => (
          <div key={v.version} className={styles.rollbackRow}>
            <span>v{v.version}</span>
            <span className={styles.muted}>{new Date(v.releasedAt).toLocaleString()}</span>
            <span className={styles.rollbackBadge}>Rollback Available</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** §4 Economic Engine (QubitCoin) */
function EconomyPanel({ tsu }: Readonly<{ tsu: TotalSystemUnification }>) {
  const qc = tsu.defensiveIntel.getQubitCoinEngine();
  const summary: QCSummary = useMemo(() => qc.getSummary(), [qc]);
  const supply: QCSupplyMetrics = useMemo(() => qc.getSupplyMetrics(), [qc]);
  const treasury: QCTreasurySnapshot = useMemo(() => qc.getTreasurySnapshot(), [qc]);
  const schedule: HalvingEpoch[] = useMemo(() => qc.getHalvingSchedule(), [qc]);
  const investments: QCTreasuryInvestment[] = useMemo(() => qc.getInvestments(), [qc]);

  const [activationKey, setActivationKey] = useState('');
  const [activationResult, setActivationResult] = useState<string | null>(null);

  const handleActivate = useCallback(() => {
    if (!activationKey.trim()) return;
    const ok = qc.activate(activationKey.trim());
    setActivationResult(ok ? '✅ QubitCoin engine ACTIVATED' : '⚠️ Activation failed — check key length (min 8)');
    setActivationKey('');
  }, [qc, activationKey]);

  const handleFreeze = useCallback(() => {
    if (!activationKey.trim()) return;
    const ok = qc.freeze(activationKey.trim());
    setActivationResult(ok ? '🧊 Engine FROZEN' : '⚠️ Freeze failed — wrong key or not active');
    setActivationKey('');
  }, [qc, activationKey]);

  const handleUnfreeze = useCallback(() => {
    if (!activationKey.trim()) return;
    const ok = qc.unfreeze(activationKey.trim());
    setActivationResult(ok ? '🔓 Engine UNFROZEN' : '⚠️ Unfreeze failed — wrong key or not frozen');
    setActivationKey('');
  }, [qc, activationKey]);

  const isDormant = summary.status === 'dormant';
  const statusLabel: Record<string, string> = {
    dormant: '💤 DORMANT',
    activating: '⏳ ACTIVATING',
    active: '⚡ ACTIVE',
    frozen: '🧊 FROZEN',
  };

  return (
    <div className={styles.panel}>
      {/* Status banner */}
      <div className={`${styles.integrityBanner} ${isDormant ? styles.qcDormant : styles.qcActive}`}>
        <span className={styles.integrityLabel}>QUBITCOIN ENGINE</span>
        <span className={styles.integrityValue}>{statusLabel[summary.status] ?? summary.status}</span>
        <span className={styles.integrityMeta}>
          Max Supply: {formatQC(summary.totalSupplyCap)} QC &bull; Epoch {summary.currentEpoch}
        </span>
      </div>

      {/* Activation gate */}
      <h4 className={styles.sectionTitle}>Activation Gate (Root-Owner Only)</h4>
      <div className={styles.activationForm}>
        <input
          className={styles.input}
          type="password"
          placeholder="Root-owner private key"
          value={activationKey}
          onChange={e => setActivationKey(e.target.value)}
        />
        <div className={styles.activationButtons}>
          {isDormant && (
            <button
              className={`${styles.btn} ${styles.btnActivate}`}
              onClick={handleActivate}
              disabled={!activationKey.trim()}
            >
              Activate Engine
            </button>
          )}
          {summary.status === 'active' && (
            <button
              className={`${styles.btn} ${styles.btnFreeze}`}
              onClick={handleFreeze}
              disabled={!activationKey.trim()}
            >
              Freeze Engine
            </button>
          )}
          {summary.status === 'frozen' && (
            <button
              className={`${styles.btn} ${styles.btnApprove}`}
              onClick={handleUnfreeze}
              disabled={!activationKey.trim()}
            >
              Unfreeze Engine
            </button>
          )}
        </div>
        {activationResult && <p className={styles.activationResult}>{activationResult}</p>}
      </div>

      {/* Treasury */}
      <h4 className={styles.sectionTitle}>Treasury</h4>
      <div className={styles.metricsRow}>
        <MetricCard label="Balance" value={formatQC(treasury.balance)} unit="QC" />
        <MetricCard label="Total Deposited" value={formatQC(treasury.totalDeposited)} unit="QC" />
        <MetricCard label="Total Invested" value={formatQC(treasury.totalInvested)} unit="QC" />
        <MetricCard label="Total Buyback" value={formatQC(treasury.totalBuyback)} unit="QC" />
        <MetricCard label="Reserve Ratio" value={pct(treasury.reserveRatio)} />
        <MetricCard label="Total Burned" value={formatQC(treasury.totalBurned)} unit="QC" />
      </div>

      {/* Supply metrics */}
      <h4 className={styles.sectionTitle}>Issuance Curve</h4>
      <div className={styles.metricsRow}>
        <MetricCard label="Issued" value={formatQC(supply.totalIssued)} unit="QC" />
        <MetricCard label="Circulating" value={formatQC(supply.circulatingSupply)} unit="QC" />
        <MetricCard label="Burned" value={formatQC(supply.totalBurned)} unit="QC" />
        <MetricCard label="Scarcity" value={pct(supply.scarcityIndex)} />
        <MetricCard label="Block Reward" value={formatQC(supply.currentBlockReward)} unit="QC" />
        <MetricCard label="Next Halving" value={supply.nextHalvingIn > 0 ? formatMs(supply.nextHalvingIn) : 'N/A'} />
      </div>

      {/* Halving schedule */}
      <h4 className={styles.sectionTitle}>10-Year Halving Schedule</h4>
      <div className={styles.halvingTable}>
        <div className={styles.halvingHeader}>
          <span>Epoch</span>
          <span>Period</span>
          <span>Multiplier</span>
          <span>Block Reward</span>
          <span>Cumulative Supply</span>
        </div>
        {schedule.map((epoch: HalvingEpoch) => (
          <div
            key={epoch.epochIndex}
            className={`${styles.halvingRow} ${epoch.epochIndex === supply.currentEpoch ? styles.halvingCurrent : ''}`}
          >
            <span>{epoch.epochIndex}</span>
            <span>{epoch.epochLabel}</span>
            <span>{epoch.halvingMultiplier}×</span>
            <span>{formatQC(epoch.blockReward)} QC</span>
            <span>{formatQC(epoch.cumulativeSupplyAtEnd)} QC</span>
          </div>
        ))}
      </div>

      {/* User reward distribution */}
      <h4 className={styles.sectionTitle}>Reward Distribution</h4>
      <div className={styles.metricsRow}>
        <MetricCard label="Wallets" value={String(summary.walletCount)} />
        <MetricCard label="Transactions" value={String(summary.transactionCount)} />
        <MetricCard label="Platform Revenue" value={formatQC(summary.platformRevenueQC)} unit="QC" />
        <MetricCard label="User Rewards" value={formatQC(summary.userRewardsQC)} unit="QC" />
        <MetricCard label="Blocks Mined" value={String(summary.blocksMined)} />
      </div>

      {/* Funding proposals (treasury investments) */}
      <h4 className={styles.sectionTitle}>Treasury Investments ({investments.length})</h4>
      <div className={styles.scrollList}>
        {investments.length === 0 && <p className={styles.muted}>No treasury investments yet.</p>}
        {investments.map((inv: QCTreasuryInvestment) => (
          <div key={inv.id} className={styles.investmentRow}>
            <span className={styles.investCat}>{inv.category.toUpperCase()}</span>
            <span>{formatQC(inv.amount)} QC — {inv.description}</span>
            <span className={styles.muted}>ROI: {inv.expectedROI}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** §5 Master Control */
function ControlPanel({ tsu }: Readonly<{ tsu: TotalSystemUnification }>) {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);

  const executeAction = useCallback((action: string) => {
    const timestamp = new Date().toLocaleTimeString();
    // In a real deployment these would wire to actual subsystem controls.
    // For now they log the intent and broadcast a status update.
    switch (action) {
      case 'freeze-subsystem':
        setActionLog(prev => [`[${timestamp}] 🧊 Subsystem freeze initiated`, ...prev]);
        break;
      case 'isolate-subsystem':
        setActionLog(prev => [`[${timestamp}] 🔒 Subsystem isolation initiated`, ...prev]);
        break;
      case 'full-freeze':
        setActionLog(prev => [`[${timestamp}] ❄️ FULL SYSTEM FREEZE initiated`, ...prev]);
        break;
      case 'safe-shutdown':
        setActionLog(prev => [`[${timestamp}] 🛑 Safe shutdown sequence initiated`, ...prev]);
        break;
      case 'hard-shutdown':
        setActionLog(prev => [`[${timestamp}] ⛔ HARD SHUTDOWN — emergency`, ...prev]);
        break;
      case 'recovery':
        setActionLog(prev => [`[${timestamp}] 🔧 Recovery mode entered`, ...prev]);
        break;
      case 'ownership-transfer':
        setActionLog(prev => [`[${timestamp}] 🔑 Ownership transfer initiated`, ...prev]);
        break;
      case 'compliance-export':
        setActionLog(prev => [`[${timestamp}] 📦 Compliance bundle exported`, ...prev]);
        break;
      default:
        break;
    }
    tsu.broadcastStatus();
    setConfirmAction(null);
  }, [tsu]);

  const controls: Array<{ id: string; icon: string; label: string; desc: string; danger: boolean }> = [
    { id: 'freeze-subsystem', icon: '🧊', label: 'Subsystem Freeze', desc: 'Freeze a specific subsystem in place', danger: false },
    { id: 'isolate-subsystem', icon: '🔒', label: 'Subsystem Isolation', desc: 'Isolate a component from cross-system communication', danger: false },
    { id: 'full-freeze', icon: '❄️', label: 'Full System Freeze', desc: 'Freeze all subsystems simultaneously', danger: true },
    { id: 'safe-shutdown', icon: '🛑', label: 'Safe Shutdown', desc: 'Graceful shutdown with state preservation', danger: true },
    { id: 'hard-shutdown', icon: '⛔', label: 'Hard Shutdown', desc: 'Emergency shutdown — no state preservation', danger: true },
    { id: 'recovery', icon: '🔧', label: 'Recovery Mode', desc: 'Enter recovery mode for diagnostics', danger: false },
    { id: 'ownership-transfer', icon: '🔑', label: 'Ownership Transfer', desc: 'Initiate root-owner transfer protocol', danger: true },
    { id: 'compliance-export', icon: '📦', label: 'Compliance Export', desc: 'Export full compliance bundle for licensing or audit', danger: false },
  ];

  return (
    <div className={styles.panel}>
      <h4 className={styles.sectionTitle}>Master Controls</h4>
      <p className={styles.muted}>These controls affect the entire AgentArmy OS. Dangerous actions require confirmation.</p>

      <div className={styles.controlGrid}>
        {controls.map(ctrl => (
          <button
            key={ctrl.id}
            className={`${styles.controlBtn} ${ctrl.danger ? styles.controlDanger : styles.controlNormal}`}
            onClick={() => {
              if (ctrl.danger) {
                setConfirmAction(ctrl.id);
              } else {
                executeAction(ctrl.id);
              }
            }}
          >
            <span className={styles.controlIcon}>{ctrl.icon}</span>
            <span className={styles.controlLabel}>{ctrl.label}</span>
            <span className={styles.controlDesc}>{ctrl.desc}</span>
          </button>
        ))}
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <h4>⚠️ Confirm Dangerous Action</h4>
            <p>You are about to execute: <strong>{controls.find(c => c.id === confirmAction)?.label}</strong></p>
            <p className={styles.muted}>{controls.find(c => c.id === confirmAction)?.desc}</p>
            <div className={styles.confirmActions}>
              <button className={`${styles.btn} ${styles.btnReject}`} onClick={() => executeAction(confirmAction)}>
                Confirm Execute
              </button>
              <button className={`${styles.btn} ${styles.btnDefer}`} onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action log */}
      {actionLog.length > 0 && (
        <>
          <h4 className={styles.sectionTitle}>Control Log</h4>
          <div className={styles.logBox}>
            {actionLog.map((entry) => (
              <div key={entry} className={styles.logEntry}>{entry}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared micro-components
// ---------------------------------------------------------------------------

function MetricCard({ label, value, unit }: Readonly<{ label: string; value: string; unit?: string }>) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricValue}>{value}{unit ? <span className={styles.metricUnit}> {unit}</span> : null}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  );
}

function VersionLineage({ versions }: Readonly<{ versions: VersionRecord[] }>) {
  return (
    <div className={styles.versionList}>
      {versions.map((v: VersionRecord) => (
        <div key={v.version} className={styles.versionRow}>
          <span className={styles.versionTag}>v{v.version}</span>
          <span className={styles.versionDate}>{new Date(v.releasedAt).toLocaleString()}</span>
          <span className={styles.versionChangelog}>{v.changelog}</span>
          <span className={styles.versionBadge}>
            {v.proposalIds.length} proposal{v.proposalIds.length === 1 ? '' : 's'}
            {v.rollbackAvailable ? ' • rollback ✓' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main WarRoom component
// ---------------------------------------------------------------------------

export const WarRoom: React.FC<WarRoomProps> = ({ tsu, onClose }) => {
  const [activeTab, setActiveTab] = useState<WarRoomTab>('overview');

  const tabs: Array<{ id: WarRoomTab; icon: string; label: string }> = [
    { id: 'overview', icon: '📊', label: 'System Overview' },
    { id: 'intel', icon: '🛡️', label: 'Defensive Intel' },
    { id: 'upgrades', icon: '⬆️', label: 'Upgrade Governance' },
    { id: 'economy', icon: '💰', label: 'Economic Engine' },
    { id: 'control', icon: '🎛️', label: 'Master Control' },
  ];

  return (
    <div className={styles.warRoom}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>🏛️</span>
          <h2 className={styles.headerTitle}>War Room — Root-Owner Console</h2>
        </div>
        <button className={styles.closeBtn} onClick={onClose} title="Close War Room">✕</button>
      </div>

      {/* Tab bar */}
      <nav className={styles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Panel area */}
      <div className={styles.panelArea}>
        {activeTab === 'overview' && <OverviewPanel tsu={tsu} />}
        {activeTab === 'intel' && <IntelPanel tsu={tsu} />}
        {activeTab === 'upgrades' && <UpgradePanel tsu={tsu} />}
        {activeTab === 'economy' && <EconomyPanel tsu={tsu} />}
        {activeTab === 'control' && <ControlPanel tsu={tsu} />}
      </div>
    </div>
  );
};
