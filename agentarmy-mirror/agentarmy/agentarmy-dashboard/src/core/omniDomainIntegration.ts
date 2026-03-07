// ---------------------------------------------------------------------------
// Omni‑Domain Integration Layer
// ---------------------------------------------------------------------------
// Connects the OS to all possible domains—digital, physical, biological,
// economic, social, legal, and conceptual. Acts as the universal
// interoperability layer that enables cross-domain mission execution,
// domain translation, multi-domain safety enforcement, and unified
// reasoning across heterogeneous systems.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DomainCategory =
  | 'enterprise'
  | 'robotics'
  | 'iot'
  | 'scientific'
  | 'legal'
  | 'financial'
  | 'biological'
  | 'creative'
  | 'social'
  | 'conceptual'
  | string;

export type DomainStatus = 'online' | 'degraded' | 'offline' | 'unknown';

export interface DomainConnector {
  id: string;
  category: DomainCategory;
  name: string;
  description: string;
  status: DomainStatus;
  capabilities: string[];
  safetyProfile: DomainSafetyProfile;
  metadata: Record<string, unknown>;
  connectedAt: string;
  lastHealthCheck: string;
}

export interface DomainSafetyProfile {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  constraints: string[];
  requiredApprovals: number;
  auditTrail: boolean;
}

export interface DomainTranslation {
  id: string;
  fromDomain: string;
  toDomain: string;
  entityType: string;
  mapping: Record<string, string>;
  bidirectional: boolean;
  createdAt: string;
}

export interface CrossDomainMission {
  id: string;
  domains: string[];
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  translations: string[];     // translation IDs used
  safetyCleared: boolean;
  startedAt: string;
  completedAt: string | null;
}

export interface OmniDomainSummary {
  totalConnectors: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  totalTranslations: number;
  activeMissions: number;
  completedMissions: number;
  domainCoverageScore: number; // 0-1
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class OmniDomainIntegration {
  private readonly connectors: Map<string, DomainConnector> = new Map();
  private readonly translations: DomainTranslation[] = [];
  private readonly missions: CrossDomainMission[] = [];

  // ---- Connector Management ----

  registerDomain(
    category: DomainCategory,
    name: string,
    description: string,
    capabilities: string[] = [],
    safetyProfile?: Partial<DomainSafetyProfile>,
  ): DomainConnector {
    const id = `dom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const connector: DomainConnector = {
      id,
      category,
      name,
      description,
      status: 'online',
      capabilities,
      safetyProfile: {
        riskLevel: safetyProfile?.riskLevel ?? 'medium',
        constraints: safetyProfile?.constraints ?? [],
        requiredApprovals: safetyProfile?.requiredApprovals ?? 0,
        auditTrail: safetyProfile?.auditTrail ?? true,
      },
      metadata: {},
      connectedAt: now,
      lastHealthCheck: now,
    };
    this.connectors.set(id, connector);
    return connector;
  }

  getConnector(id: string): DomainConnector | undefined {
    return this.connectors.get(id);
  }

  disconnectDomain(id: string): boolean {
    const c = this.connectors.get(id);
    if (!c) return false;
    c.status = 'offline';
    return true;
  }

  healthCheck(id: string): DomainStatus {
    const c = this.connectors.get(id);
    if (!c) return 'unknown';
    c.lastHealthCheck = new Date().toISOString();
    // Simulate health—online connectors stay online
    return c.status;
  }

  getOnlineDomains(): DomainConnector[] {
    return Array.from(this.connectors.values()).filter((c) => c.status === 'online');
  }

  // ---- Domain Translation ----

  addTranslation(
    fromDomain: string,
    toDomain: string,
    entityType: string,
    mapping: Record<string, string>,
    bidirectional = false,
  ): DomainTranslation {
    const t: DomainTranslation = {
      id: `dt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromDomain,
      toDomain,
      entityType,
      mapping,
      bidirectional,
      createdAt: new Date().toISOString(),
    };
    this.translations.push(t);
    return t;
  }

  translateEntity(
    entity: Record<string, unknown>,
    fromDomain: string,
    toDomain: string,
    entityType: string,
  ): Record<string, unknown> | null {
    const rule = this.translations.find((t) => {
      if (t.fromDomain === fromDomain && t.toDomain === toDomain && t.entityType === entityType) return true;
      if (t.bidirectional && t.toDomain === fromDomain && t.fromDomain === toDomain && t.entityType === entityType) return true;
      return false;
    });
    if (!rule) return null;

    const result: Record<string, unknown> = {};
    for (const [src, dst] of Object.entries(rule.mapping)) {
      if (entity[src] !== undefined) {
        result[dst] = entity[src];
      }
    }
    return result;
  }

  // ---- Cross‑Domain Mission ----

  launchCrossDomainMission(
    domains: string[],
    description: string,
  ): CrossDomainMission | null {
    // Verify all domains are online
    const connectorList = Array.from(this.connectors.values());
    const onlineCategories = new Set(connectorList.filter((c) => c.status === 'online').map((c) => c.category));
    const allAvailable = domains.every((d) => onlineCategories.has(d));
    if (!allAvailable) return null;

    const relevantTranslations = this.translations
      .filter((t) => domains.includes(t.fromDomain) || domains.includes(t.toDomain))
      .map((t) => t.id);

    const mission: CrossDomainMission = {
      id: `cdm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      domains,
      description,
      status: 'active',
      translations: relevantTranslations,
      safetyCleared: true,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    this.missions.push(mission);
    return mission;
  }

  completeMission(missionId: string, success: boolean): boolean {
    const m = this.missions.find((x) => x.id === missionId);
    if (!m || m.status !== 'active') return false;
    m.status = success ? 'completed' : 'failed';
    m.completedAt = new Date().toISOString();
    return true;
  }

  // ---- Summary ----

  getSummary(): OmniDomainSummary {
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const c of this.connectors.values()) {
      byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    }

    const active = this.missions.filter((m) => m.status === 'active').length;
    const completed = this.missions.filter((m) => m.status === 'completed').length;
    const totalCategories = new Set(Array.from(this.connectors.values()).map((c) => c.category)).size;
    const coverage = Math.min(1, totalCategories / 10); // 10 known core categories

    return {
      totalConnectors: this.connectors.size,
      byCategory,
      byStatus,
      totalTranslations: this.translations.length,
      activeMissions: active,
      completedMissions: completed,
      domainCoverageScore: Number(coverage.toFixed(3)),
    };
  }
}
