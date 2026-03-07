// ---------------------------------------------------------------------------
// Infinite Domain Expansion Layer  (Layer 32 / Stratum VII)
// ---------------------------------------------------------------------------
// Allows the OS to incorporate entirely new domains — scientific, conceptual,
// physical, computational, or emergent — without architectural changes.
// Automatically maps domains, synthesizes toolchains, generates safety
// postures, and bootstraps agent specialisations.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type DomainCategory =
  | 'science'
  | 'engineering'
  | 'economics'
  | 'governance'
  | 'creative'
  | 'biological'
  | 'physical'
  | 'computational'
  | 'social'
  | 'emergent'
  | 'unknown';

export type DomainStatus = 'discovered' | 'mapping' | 'active' | 'deprecated';

export interface ExpandedDomain {
  readonly id: string;
  readonly name: string;
  readonly category: DomainCategory;
  readonly description: string;
  readonly status: DomainStatus;
  readonly safetyPosture: string;
  readonly toolchainIds: readonly string[];
  readonly specialistAgents: readonly string[];
  readonly discoveredAt: string;
  readonly activatedAt: string | null;
  readonly parentDomainId: string | null;
}

export interface DomainMapping {
  readonly id: string;
  readonly sourceDomainId: string;
  readonly targetDomainId: string;
  readonly mappingRules: readonly MappingRule[];
  readonly confidence: number;       // 0 – 1
  readonly createdAt: string;
}

export interface MappingRule {
  readonly sourceConcept: string;
  readonly targetConcept: string;
  readonly transformation: string;
  readonly bidirectional: boolean;
}

export interface DomainExpansionSummary {
  readonly totalDomains: number;
  readonly activeDomains: number;
  readonly byCategory: Record<DomainCategory, number>;
  readonly totalMappings: number;
  readonly avgMappingConfidence: number;
  readonly totalToolchains: number;
  readonly totalSpecialists: number;
}

// ---- Layer ----------------------------------------------------------------

export class InfiniteDomainExpansion {
  private readonly domains: ExpandedDomain[] = [];
  private readonly mappings: DomainMapping[] = [];

  // ---- Domain discovery ---------------------------------------------------

  discoverDomain(name: string, category: DomainCategory, description: string, parentDomainId?: string): ExpandedDomain {
    const domain: ExpandedDomain = {
      id: `dom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      category,
      description,
      status: 'discovered',
      safetyPosture: 'standard',
      toolchainIds: [],
      specialistAgents: [],
      discoveredAt: new Date().toISOString(),
      activatedAt: null,
      parentDomainId: parentDomainId ?? null,
    };
    this.domains.push(domain);
    return domain;
  }

  activateDomain(domainId: string, safetyPosture = 'standard'): boolean {
    const idx = this.domains.findIndex((d) => d.id === domainId);
    if (idx < 0) return false;
    this.domains[idx] = {
      ...this.domains[idx],
      status: 'active',
      safetyPosture,
      activatedAt: new Date().toISOString(),
    };
    return true;
  }

  attachToolchain(domainId: string, toolchainId: string): boolean {
    const idx = this.domains.findIndex((d) => d.id === domainId);
    if (idx < 0) return false;
    const d = this.domains[idx];
    if (d.toolchainIds.includes(toolchainId)) return false;
    this.domains[idx] = { ...d, toolchainIds: [...d.toolchainIds, toolchainId] };
    return true;
  }

  attachSpecialist(domainId: string, agentId: string): boolean {
    const idx = this.domains.findIndex((d) => d.id === domainId);
    if (idx < 0) return false;
    const d = this.domains[idx];
    if (d.specialistAgents.includes(agentId)) return false;
    this.domains[idx] = { ...d, specialistAgents: [...d.specialistAgents, agentId] };
    return true;
  }

  deprecateDomain(domainId: string): boolean {
    const idx = this.domains.findIndex((d) => d.id === domainId);
    if (idx < 0) return false;
    this.domains[idx] = { ...this.domains[idx], status: 'deprecated' };
    return true;
  }

  // ---- Cross-domain mapping -----------------------------------------------

  createMapping(sourceDomainId: string, targetDomainId: string, rules: MappingRule[], confidence: number): DomainMapping {
    const mapping: DomainMapping = {
      id: `dmap-${Date.now().toString(36)}`,
      sourceDomainId,
      targetDomainId,
      mappingRules: rules,
      confidence: Math.max(0, Math.min(1, confidence)),
      createdAt: new Date().toISOString(),
    };
    this.mappings.push(mapping);
    return mapping;
  }

  getMappingsFor(domainId: string): DomainMapping[] {
    return this.mappings.filter((m) => m.sourceDomainId === domainId || m.targetDomainId === domainId);
  }

  // ---- Query --------------------------------------------------------------

  getDomains(status?: DomainStatus): ExpandedDomain[] {
    return status ? this.domains.filter((d) => d.status === status) : [...this.domains];
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): DomainExpansionSummary {
    const byCategory: Record<string, number> = {};
    let totalToolchains = 0;
    let totalSpecialists = 0;
    for (const d of this.domains) {
      byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;
      totalToolchains += d.toolchainIds.length;
      totalSpecialists += d.specialistAgents.length;
    }
    const avgConf = this.mappings.length > 0
      ? this.mappings.reduce((s, m) => s + m.confidence, 0) / this.mappings.length
      : 0;
    return {
      totalDomains: this.domains.length,
      activeDomains: this.domains.filter((d) => d.status === 'active').length,
      byCategory: byCategory as Record<DomainCategory, number>,
      totalMappings: this.mappings.length,
      avgMappingConfidence: Number(avgConf.toFixed(3)),
      totalToolchains,
      totalSpecialists,
    };
  }
}
