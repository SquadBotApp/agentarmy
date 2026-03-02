/**
 * Meta‑Cognition & Self‑Reflection Layer — the OS reasons about itself.
 *
 * Evaluates ZPE routing optimality, agent collaboration effectiveness,
 * safety posture appropriateness, economy efficiency, mission structure
 * quality, and runner allocation. Produces self-critique reports,
 * optimization proposals, and governance recommendations.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

function computeUtilScore(utilization: number): number {
  if (utilization > 0.9) return 0.5;
  if (utilization < 0.1) return 0.3;
  return 1 - Math.abs(utilization - 0.6);
}

export type ReflectionDomain =
  | 'zpe_routing'
  | 'agent_collaboration'
  | 'safety_posture'
  | 'economy_usage'
  | 'mission_structure'
  | 'runner_allocation';

export interface SelfCritiqueReport {
  id: string;
  domain: ReflectionDomain;
  assessment: string;
  score: number;            // 0‑1 (1 = optimal)
  issues: ReflectionIssue[];
  proposals: OptimizationProposal[];
  evaluatedAt: string;
}

export interface ReflectionIssue {
  id: string;
  domain: ReflectionDomain;
  severity: 'minor' | 'moderate' | 'significant' | 'critical';
  description: string;
  evidence: string;
  impact: string;
}

export interface OptimizationProposal {
  id: string;
  domain: ReflectionDomain;
  title: string;
  description: string;
  expectedImprovement: number;    // 0‑1 relative
  risk: 'low' | 'medium' | 'high';
  autoApplicable: boolean;
}

export interface MetaCognitionSummary {
  totalReflections: number;
  avgScore: number;
  issuesFound: number;
  proposalsGenerated: number;
  domainScores: Record<ReflectionDomain, number>;
  lastReflectionAt: string | null;
}

// Metrics snapshot from external systems
export interface SystemMetricsSnapshot {
  zpeAvgScore: number;
  agentCount: number;
  agentSuccessRate: number;
  safetyPosture: string;
  safetyViolations: number;
  economyBalance: number;
  economySpendRate: number;
  missionSuccessRate: number;
  avgMissionCost: number;
  runnerUtilization: number;
  runnerErrorRate: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class MetaCognitionEngine {
  private reports: SelfCritiqueReport[] = [];
  private listeners: Array<(r: SelfCritiqueReport) => void> = [];

  // ---- Full reflection cycle ----

  /** Run a complete self-reflection across all domains. */
  reflect(metrics: SystemMetricsSnapshot): SelfCritiqueReport[] {
    const domains: ReflectionDomain[] = [
      'zpe_routing', 'agent_collaboration', 'safety_posture',
      'economy_usage', 'mission_structure', 'runner_allocation',
    ];

    const reports = domains.map((d) => this.reflectDomain(d, metrics));
    this.reports.push(...reports);

    // Trim history
    if (this.reports.length > 5000) this.reports = this.reports.slice(-5000);

    for (const r of reports) {
      for (const fn of this.listeners) fn(r);
    }

    return reports;
  }

  // ---- Per-domain reflection ----

  private reflectDomain(domain: ReflectionDomain, m: SystemMetricsSnapshot): SelfCritiqueReport {
    const { score, issues, proposals, assessment } = domainReflectors[domain](m);

    return {
      id: `refl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      domain,
      assessment,
      score,
      issues,
      proposals,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // ---- Query ----

  getReports(limit = 50): SelfCritiqueReport[] {
    return this.reports.slice(-limit);
  }

  getByDomain(domain: ReflectionDomain, limit = 20): SelfCritiqueReport[] {
    return this.reports.filter((r) => r.domain === domain).slice(-limit);
  }

  getProposals(autoOnly = false): OptimizationProposal[] {
    const all = this.reports.flatMap((r) => r.proposals);
    return autoOnly ? all.filter((p) => p.autoApplicable) : all;
  }

  getSummary(): MetaCognitionSummary {
    const recent = this.reports.slice(-100);
    const domainScores: Record<string, number[]> = {};
    for (const r of recent) {
      if (!domainScores[r.domain]) domainScores[r.domain] = [];
      domainScores[r.domain].push(r.score);
    }
    const avgDomainScores: Record<ReflectionDomain, number> = {} as any;
    for (const [d, scores] of Object.entries(domainScores)) {
      avgDomainScores[d as ReflectionDomain] = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3));
    }

    return {
      totalReflections: this.reports.length,
      avgScore: recent.length > 0
        ? Number((recent.reduce((s, r) => s + r.score, 0) / recent.length).toFixed(3))
        : 0,
      issuesFound: recent.reduce((s, r) => s + r.issues.length, 0),
      proposalsGenerated: recent.reduce((s, r) => s + r.proposals.length, 0),
      domainScores: avgDomainScores,
      lastReflectionAt: this.reports.length > 0 ? (this.reports.at(-1)?.evaluatedAt ?? null) : null,
    };
  }

  // ---- Events ----

  on(listener: (r: SelfCritiqueReport) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }
}

// ---------------------------------------------------------------------------
// Domain reflectors
// ---------------------------------------------------------------------------

type ReflectorResult = {
  score: number;
  assessment: string;
  issues: ReflectionIssue[];
  proposals: OptimizationProposal[];
};

type ReflectorFn = (m: SystemMetricsSnapshot) => ReflectorResult;

function uid(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

const domainReflectors: Record<ReflectionDomain, ReflectorFn> = {
  zpe_routing: (m) => {
    const score = Math.min(1, m.zpeAvgScore / 2);
    const issues: ReflectionIssue[] = [];
    const proposals: OptimizationProposal[] = [];
    if (score < 0.5) {
      issues.push({ id: uid(), domain: 'zpe_routing', severity: 'significant', description: 'ZPE average score is low', evidence: `avg=${m.zpeAvgScore}`, impact: 'Suboptimal routing decisions' });
      proposals.push({ id: uid(), domain: 'zpe_routing', title: 'Retrain ZPE weights', description: 'Use recent mission data to update ZPE weight set', expectedImprovement: 0.2, risk: 'medium', autoApplicable: true });
    }
    return { score, assessment: score >= 0.7 ? 'ZPE routing is performing well' : 'ZPE routing needs improvement', issues, proposals };
  },

  agent_collaboration: (m) => {
    const score = m.agentSuccessRate;
    const issues: ReflectionIssue[] = [];
    const proposals: OptimizationProposal[] = [];
    if (m.agentSuccessRate < 0.7) {
      issues.push({ id: uid(), domain: 'agent_collaboration', severity: 'moderate', description: 'Agent success rate below threshold', evidence: `rate=${m.agentSuccessRate}`, impact: 'Mission reliability affected' });
      proposals.push({ id: uid(), domain: 'agent_collaboration', title: 'Review agent assignments', description: 'Reassess agent-to-task matching using specialization data', expectedImprovement: 0.15, risk: 'low', autoApplicable: true });
    }
    return { score, assessment: score >= 0.8 ? 'Agents collaborating effectively' : 'Agent collaboration needs attention', issues, proposals };
  },

  safety_posture: (m) => {
    const violations = m.safetyViolations;
    const score = violations === 0 ? 1 : Math.max(0, 1 - violations * 0.1);
    const issues: ReflectionIssue[] = [];
    const proposals: OptimizationProposal[] = [];
    if (violations > 0) {
      issues.push({ id: uid(), domain: 'safety_posture', severity: violations > 5 ? 'critical' : 'moderate', description: `${violations} safety violations detected`, evidence: `posture=${m.safetyPosture}`, impact: 'System alignment risk' });
      proposals.push({ id: uid(), domain: 'safety_posture', title: 'Tighten safety posture', description: 'Escalate to strict mode and review constitutional rules', expectedImprovement: 0.3, risk: 'low', autoApplicable: violations <= 3 });
    }
    return { score, assessment: score >= 0.9 ? 'Safety posture is appropriate' : 'Safety posture requires tightening', issues, proposals };
  },

  economy_usage: (m) => {
    const balanceHealth = m.economyBalance > 100 ? 1 : m.economyBalance / 100;
    const spendHealth = m.economySpendRate < 20 ? 1 : Math.max(0, 1 - (m.economySpendRate - 20) / 80);
    const score = (balanceHealth + spendHealth) / 2;
    const issues: ReflectionIssue[] = [];
    const proposals: OptimizationProposal[] = [];
    if (score < 0.5) {
      issues.push({ id: uid(), domain: 'economy_usage', severity: 'significant', description: 'Economy under stress', evidence: `balance=${m.economyBalance}, rate=${m.economySpendRate}`, impact: 'Budget exhaustion risk' });
      proposals.push({ id: uid(), domain: 'economy_usage', title: 'Switch to cheaper tools', description: 'Route non-critical tasks to lower-cost runners and tools', expectedImprovement: 0.25, risk: 'low', autoApplicable: true });
    }
    return { score, assessment: score >= 0.7 ? 'Economy usage is efficient' : 'Economy usage needs optimization', issues, proposals };
  },

  mission_structure: (m) => {
    const score = m.missionSuccessRate;
    const issues: ReflectionIssue[] = [];
    const proposals: OptimizationProposal[] = [];
    if (m.avgMissionCost > 50) {
      issues.push({ id: uid(), domain: 'mission_structure', severity: 'moderate', description: 'High average mission cost', evidence: `avg=${m.avgMissionCost}`, impact: 'Economy drain' });
      proposals.push({ id: uid(), domain: 'mission_structure', title: 'Optimize mission graphs', description: 'Prune redundant nodes and tighten loop bounds', expectedImprovement: 0.15, risk: 'medium', autoApplicable: true });
    }
    return { score, assessment: score >= 0.8 ? 'Mission structures are well optimized' : 'Mission structure could be improved', issues, proposals };
  },

  runner_allocation: (m) => {
    const utilScore = computeUtilScore(m.runnerUtilization);
    const errorScore = 1 - m.runnerErrorRate;
    const score = (utilScore + errorScore) / 2;
    const issues: ReflectionIssue[] = [];
    const proposals: OptimizationProposal[] = [];
    if (m.runnerUtilization > 0.85) {
      issues.push({ id: uid(), domain: 'runner_allocation', severity: 'moderate', description: 'Runner swarm near capacity', evidence: `util=${m.runnerUtilization}`, impact: 'Latency and reliability risk' });
      proposals.push({ id: uid(), domain: 'runner_allocation', title: 'Scale runner pool', description: 'Add cloud runners to reduce load per runner', expectedImprovement: 0.2, risk: 'low', autoApplicable: true });
    }
    if (m.runnerErrorRate > 0.1) {
      issues.push({ id: uid(), domain: 'runner_allocation', severity: 'significant', description: 'High runner error rate', evidence: `rate=${m.runnerErrorRate}`, impact: 'Mission reliability' });
      proposals.push({ id: uid(), domain: 'runner_allocation', title: 'Quarantine unhealthy runners', description: 'Isolate runners with >20% error rates', expectedImprovement: 0.2, risk: 'low', autoApplicable: true });
    }
    return { score, assessment: score >= 0.7 ? 'Runner allocation is efficient' : 'Runner allocation needs rebalancing', issues, proposals };
  },
};
