/**
 * Multi-Tenant Isolation Layer — workspace sovereignty with global learning.
 *
 * Each user/org operates in a fully isolated TenantWorkspace.
 * Cross‑tenant learning is enabled only via privacy‑safe aggregation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TenantTier = 'free' | 'pro' | 'enterprise' | 'sovereign';

export interface TenantWorkspace {
  tenantId: string;
  name: string;
  tier: TenantTier;
  ownerId: string;
  createdAt: string;

  /** Resource quota envelope. */
  quotas: TenantQuotas;

  /** Current usage counters. */
  usage: TenantUsage;

  /** Privacy settings governing cross‑tenant sharing. */
  privacyPolicy: PrivacyPolicy;

  /** Whether this workspace is currently active. */
  active: boolean;
}

export interface TenantQuotas {
  maxAgents: number;
  maxConcurrentMissions: number;
  maxRunners: number;
  maxStorageMb: number;
  maxQbPerCycle: number;
}

export interface TenantUsage {
  agents: number;
  concurrentMissions: number;
  runners: number;
  storageMb: number;
  qbSpent: number;
}

export interface PrivacyPolicy {
  /** Allow anonymized patterns to flow into federated learning. */
  allowFederatedLearning: boolean;
  /** Allow tool usage statistics to be shared. */
  allowToolStats: boolean;
  /** Regions where data may reside. */
  dataResidency: string[];
}

export interface IsolationViolation {
  id: string;
  sourceTenantId: string;
  targetTenantId: string;
  category: 'data_leak' | 'quota_breach' | 'cross_access' | 'policy_violation';
  description: string;
  detectedAt: string;
  resolved: boolean;
}

export interface GlobalAnonymizedInsight {
  insightId: string;
  domain: string;
  summary: string;
  sampleSize: number;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class MultiTenantIsolationLayer {
  private readonly workspaces: Map<string, TenantWorkspace> = new Map();
  private readonly violations: IsolationViolation[] = [];
  private insights: GlobalAnonymizedInsight[] = [];

  // ---- Workspace CRUD ----

  createWorkspace(ws: TenantWorkspace): void {
    if (this.workspaces.has(ws.tenantId)) throw new Error(`Tenant ${ws.tenantId} already exists`);
    this.workspaces.set(ws.tenantId, ws);
  }

  getWorkspace(tenantId: string): TenantWorkspace | undefined {
    return this.workspaces.get(tenantId);
  }

  listWorkspaces(): TenantWorkspace[] {
    return Array.from(this.workspaces.values());
  }

  deactivateWorkspace(tenantId: string): void {
    const ws = this.workspaces.get(tenantId);
    if (ws) ws.active = false;
  }

  // ---- Quota enforcement ----

  checkQuota(tenantId: string, resource: keyof TenantQuotas, requested: number): boolean {
    const ws = this.workspaces.get(tenantId);
    if (!ws) return false;

    const usageKey = quotaToUsageMap[resource];
    if (!usageKey) return false;

    const current = ws.usage[usageKey];
    return current + requested <= ws.quotas[resource];
  }

  consumeQuota(tenantId: string, resource: keyof TenantQuotas, amount: number): boolean {
    if (!this.checkQuota(tenantId, resource, amount)) return false;
    const ws = this.workspaces.get(tenantId)!;
    const usageKey = quotaToUsageMap[resource];
    if (!usageKey) return false;
    (ws.usage as any)[usageKey] += amount;
    return true;
  }

  // ---- Cross‑tenant isolation checks ----

  /**
   * Validate that an operation stays within its tenant boundary.
   * Returns an IsolationViolation if boundaries would be crossed, else null.
   */
  validateAccess(sourceTenant: string, targetTenant: string, action: string): IsolationViolation | null {
    if (sourceTenant === targetTenant) return null;

    const violation: IsolationViolation = {
      id: `viol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceTenantId: sourceTenant,
      targetTenantId: targetTenant,
      category: 'cross_access',
      description: `Cross-tenant access attempt: ${action}`,
      detectedAt: new Date().toISOString(),
      resolved: false,
    };
    this.violations.push(violation);
    return violation;
  }

  getViolations(tenantId?: string): IsolationViolation[] {
    if (!tenantId) return [...this.violations];
    return this.violations.filter(
      (v) => v.sourceTenantId === tenantId || v.targetTenantId === tenantId,
    );
  }

  // ---- Privacy-safe global learning ----

  /** Generate anonymized insight from aggregated tenant data. */
  contributeInsight(domain: string, summary: string, sampleSize: number): void {
    this.insights.push({
      insightId: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      domain,
      summary,
      sampleSize,
      generatedAt: new Date().toISOString(),
    });
    if (this.insights.length > 2000) this.insights = this.insights.slice(-2000);
  }

  getInsights(domain?: string): GlobalAnonymizedInsight[] {
    if (!domain) return [...this.insights];
    return this.insights.filter((i) => i.domain === domain);
  }

  // ---- Summary ----

  getSummary() {
    return {
      totalTenants: this.workspaces.size,
      activeTenants: Array.from(this.workspaces.values()).filter((w) => w.active).length,
      violations: this.violations.length,
      unresolvedViolations: this.violations.filter((v) => !v.resolved).length,
      insights: this.insights.length,
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const quotaToUsageMap: Record<keyof TenantQuotas, keyof TenantUsage | null> = {
  maxAgents: 'agents',
  maxConcurrentMissions: 'concurrentMissions',
  maxRunners: 'runners',
  maxStorageMb: 'storageMb',
  maxQbPerCycle: 'qbSpent',
};
