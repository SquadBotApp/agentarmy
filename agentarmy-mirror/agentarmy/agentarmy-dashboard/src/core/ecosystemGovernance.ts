// ---------------------------------------------------------------------------
// Ecosystem Governance & Reputation Layer
// ---------------------------------------------------------------------------
// Tracks reputation scores for agents, tools, and runners across the platform.
// Enforces ecosystem policies, manages trust levels, and handles
// violations / promotions based on historical performance.
// ---------------------------------------------------------------------------

export type ReputationEntity = 'agent' | 'tool' | 'runner' | 'mission' | 'tenant';

export interface ReputationRecord {
  entityType: ReputationEntity;
  entityId: string;
  score: number;           // 0‑100
  trustLevel: TrustLevel;
  successCount: number;
  failureCount: number;
  violationCount: number;
  lastEvaluatedAt: string;
  tags: string[];
}

export type TrustLevel = 'untrusted' | 'probationary' | 'standard' | 'trusted' | 'exemplary';

export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  scope: ReputationEntity[];
  minTrustLevel: TrustLevel;
  consequence: GovernanceConsequence;
  active: boolean;
  createdAt: string;
}

export type GovernanceConsequence =
  | 'warn'
  | 'throttle'
  | 'suspend'
  | 'quarantine'
  | 'revoke';

export interface Violation {
  id: string;
  entityType: ReputationEntity;
  entityId: string;
  policyId: string;
  description: string;
  consequence: GovernanceConsequence;
  timestamp: string;
  resolved: boolean;
}

export interface GovernanceSummary {
  totalEntities: number;
  byTrustLevel: Record<TrustLevel, number>;
  totalPolicies: number;
  activePolicies: number;
  totalViolations: number;
  unresolvedViolations: number;
}

// ---------------------------------------------------------------------------
// Trust‑level thresholds
// ---------------------------------------------------------------------------

const TRUST_THRESHOLDS: { level: TrustLevel; min: number }[] = [
  { level: 'exemplary', min: 90 },
  { level: 'trusted', min: 70 },
  { level: 'standard', min: 40 },
  { level: 'probationary', min: 15 },
  { level: 'untrusted', min: 0 },
];

function trustLevelForScore(score: number): TrustLevel {
  for (const t of TRUST_THRESHOLDS) {
    if (score >= t.min) return t.level;
  }
  return 'untrusted';
}

// ---------------------------------------------------------------------------
// Ecosystem Governance
// ---------------------------------------------------------------------------

export class EcosystemGovernance {
  private readonly reputation: Map<string, ReputationRecord> = new Map();
  private readonly policies: Map<string, GovernancePolicy> = new Map();
  private readonly violations: Violation[] = [];
  private listeners: Array<(v: Violation) => void> = [];

  // ---- Reputation ----

  registerEntity(entityType: ReputationEntity, entityId: string, tags: string[] = []): ReputationRecord {
    const key = `${entityType}:${entityId}`;
    if (this.reputation.has(key)) return this.reputation.get(key)!;

    const record: ReputationRecord = {
      entityType,
      entityId,
      score: 50,
      trustLevel: 'standard',
      successCount: 0,
      failureCount: 0,
      violationCount: 0,
      lastEvaluatedAt: new Date().toISOString(),
      tags,
    };
    this.reputation.set(key, record);
    return record;
  }

  recordSuccess(entityType: ReputationEntity, entityId: string, weight = 1): void {
    const rec = this.getOrCreate(entityType, entityId);
    rec.successCount += 1;
    rec.score = Math.min(100, rec.score + weight * 2);
    rec.trustLevel = trustLevelForScore(rec.score);
    rec.lastEvaluatedAt = new Date().toISOString();
  }

  recordFailure(entityType: ReputationEntity, entityId: string, weight = 1): void {
    const rec = this.getOrCreate(entityType, entityId);
    rec.failureCount += 1;
    rec.score = Math.max(0, rec.score - weight * 5);
    rec.trustLevel = trustLevelForScore(rec.score);
    rec.lastEvaluatedAt = new Date().toISOString();
  }

  getReputation(entityType: ReputationEntity, entityId: string): ReputationRecord | null {
    return this.reputation.get(`${entityType}:${entityId}`) ?? null;
  }

  getAllReputation(): ReputationRecord[] {
    return Array.from(this.reputation.values());
  }

  // ---- Policies ----

  addPolicy(policy: Omit<GovernancePolicy, 'createdAt'>): GovernancePolicy {
    const full: GovernancePolicy = { ...policy, createdAt: new Date().toISOString() };
    this.policies.set(full.id, full);
    return full;
  }

  removePolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }

  getPolicies(): GovernancePolicy[] {
    return Array.from(this.policies.values());
  }

  // ---- Enforcement ----

  /** Evaluate all policies against all entities; records violations for any breaches. */
  enforce(): Violation[] {
    const newViolations: Violation[] = [];

    for (const policy of this.policies.values()) {
      if (!policy.active) continue;

      for (const rec of this.reputation.values()) {
        if (!policy.scope.includes(rec.entityType)) continue;

        const meetsMinTrust = this.trustMeetsMinimum(rec.trustLevel, policy.minTrustLevel);
        if (!meetsMinTrust) {
          const violation: Violation = {
            id: `viol-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            entityType: rec.entityType,
            entityId: rec.entityId,
            policyId: policy.id,
            description: `Entity ${rec.entityId} trust level ${rec.trustLevel} below policy minimum ${policy.minTrustLevel}`,
            consequence: policy.consequence,
            timestamp: new Date().toISOString(),
            resolved: false,
          };
          this.violations.push(violation);
          newViolations.push(violation);
          rec.violationCount += 1;
          rec.score = Math.max(0, rec.score - 10);
          rec.trustLevel = trustLevelForScore(rec.score);
          for (const fn of this.listeners) fn(violation);
        }
      }
    }

    return newViolations;
  }

  resolveViolation(violationId: string): boolean {
    const v = this.violations.find((x) => x.id === violationId);
    if (!v) return false;
    v.resolved = true;
    return true;
  }

  getViolations(): Violation[] {
    return [...this.violations];
  }

  getUnresolvedViolations(): Violation[] {
    return this.violations.filter((v) => !v.resolved);
  }

  // ---- Summary ----

  getSummary(): GovernanceSummary {
    const byTrust: Record<TrustLevel, number> = { untrusted: 0, probationary: 0, standard: 0, trusted: 0, exemplary: 0 };
    for (const rec of this.reputation.values()) {
      byTrust[rec.trustLevel] = (byTrust[rec.trustLevel] ?? 0) + 1;
    }

    const policies = Array.from(this.policies.values());
    return {
      totalEntities: this.reputation.size,
      byTrustLevel: byTrust,
      totalPolicies: policies.length,
      activePolicies: policies.filter((p) => p.active).length,
      totalViolations: this.violations.length,
      unresolvedViolations: this.violations.filter((v) => !v.resolved).length,
    };
  }

  // ---- Events ----

  on(listener: (v: Violation) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  // ---- Internals ----

  private getOrCreate(entityType: ReputationEntity, entityId: string): ReputationRecord {
    const key = `${entityType}:${entityId}`;
    if (!this.reputation.has(key)) this.registerEntity(entityType, entityId);
    return this.reputation.get(key)!;
  }

  private trustMeetsMinimum(actual: TrustLevel, minimum: TrustLevel): boolean {
    const order: TrustLevel[] = ['untrusted', 'probationary', 'standard', 'trusted', 'exemplary'];
    return order.indexOf(actual) >= order.indexOf(minimum);
  }
}
