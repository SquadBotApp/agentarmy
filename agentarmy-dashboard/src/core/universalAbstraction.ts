// ---------------------------------------------------------------------------
// Universal Abstraction Layer
// ---------------------------------------------------------------------------
// Translates every concept—tools, missions, agents, data, physics,
// governance, economy—into a single, unified abstraction language.
// Acts as the "type system" of the entire OS: every entity is a
// UniversalConcept with a canonical form, enabling cross‑domain
// reasoning, automatic translation, and seamless integration of new
// domains.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConceptKind =
  | 'action'
  | 'goal'
  | 'constraint'
  | 'resource'
  | 'safety-rule'
  | 'temporal-pattern'
  | 'semantic-knowledge'
  | 'environment'
  | 'entity'
  | 'relation';

export type DomainTag =
  | 'orchestration'
  | 'economy'
  | 'governance'
  | 'physics'
  | 'cognition'
  | 'memory'
  | 'mission'
  | 'agent'
  | 'tool'
  | 'external';

export interface UniversalConcept {
  id: string;
  kind: ConceptKind;
  domain: DomainTag;
  name: string;
  description: string;
  properties: Record<string, unknown>;
  relations: ConceptRelation[];
  canonicalForm: string;    // normalized string representation
  createdAt: string;
  updatedAt: string;
}

export interface ConceptRelation {
  targetId: string;
  relationType: 'is-a' | 'has' | 'uses' | 'depends-on' | 'conflicts-with' | 'transforms-to' | 'synonym';
  weight: number;           // 0‑1, strength of relation
  metadata: Record<string, unknown>;
}

export interface TranslationRule {
  id: string;
  fromDomain: DomainTag;
  toDomain: DomainTag;
  fromKind: ConceptKind;
  toKind: ConceptKind;
  transform: (concept: UniversalConcept) => UniversalConcept;
  bidirectional: boolean;
  createdAt: string;
}

export interface AbstractionQuery {
  kind?: ConceptKind;
  domain?: DomainTag;
  namePattern?: string;
  relatedTo?: string;
  maxResults?: number;
}

export interface AbstractionSummary {
  totalConcepts: number;
  byKind: Record<ConceptKind, number>;
  byDomain: Record<string, number>;
  totalRelations: number;
  translationRuleCount: number;
  domainCount: number;
}

// ---------------------------------------------------------------------------
// All concept kinds (for iteration)
// ---------------------------------------------------------------------------

const ALL_KINDS: ConceptKind[] = [
  'action', 'goal', 'constraint', 'resource', 'safety-rule',
  'temporal-pattern', 'semantic-knowledge', 'environment', 'entity', 'relation',
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class UniversalAbstractionLayer {
  private readonly concepts: Map<string, UniversalConcept> = new Map();
  private readonly translations: TranslationRule[] = [];

  // ---- Concept Management ----

  registerConcept(
    kind: ConceptKind,
    domain: DomainTag,
    name: string,
    description: string,
    properties: Record<string, unknown> = {},
  ): UniversalConcept {
    const id = `uc-${domain}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const concept: UniversalConcept = {
      id,
      kind,
      domain,
      name,
      description,
      properties,
      relations: [],
      canonicalForm: this.canonicalize(kind, domain, name, properties),
      createdAt: now,
      updatedAt: now,
    };
    this.concepts.set(id, concept);
    return concept;
  }

  getConcept(id: string): UniversalConcept | undefined {
    return this.concepts.get(id);
  }

  removeConcept(id: string): boolean {
    // Also remove relations pointing to this concept
    for (const c of this.concepts.values()) {
      c.relations = c.relations.filter((r) => r.targetId !== id);
    }
    return this.concepts.delete(id);
  }

  // ---- Relations ----

  addRelation(
    conceptId: string,
    targetId: string,
    relationType: ConceptRelation['relationType'],
    weight = 1,
    metadata: Record<string, unknown> = {},
  ): boolean {
    const concept = this.concepts.get(conceptId);
    if (!concept || !this.concepts.has(targetId)) return false;

    // Prevent duplicates
    const exists = concept.relations.some((r) => r.targetId === targetId && r.relationType === relationType);
    if (exists) return false;

    concept.relations.push({ targetId, relationType, weight, metadata });
    concept.updatedAt = new Date().toISOString();
    return true;
  }

  getRelated(conceptId: string, relationType?: ConceptRelation['relationType']): UniversalConcept[] {
    const concept = this.concepts.get(conceptId);
    if (!concept) return [];

    return concept.relations
      .filter((r) => (relationType ? r.relationType === relationType : true))
      .map((r) => this.concepts.get(r.targetId))
      .filter((c): c is UniversalConcept => c !== undefined);
  }

  // ---- Cross‑Domain Translation ----

  addTranslationRule(
    fromDomain: DomainTag,
    toDomain: DomainTag,
    fromKind: ConceptKind,
    toKind: ConceptKind,
    transform: TranslationRule['transform'],
    bidirectional = false,
  ): TranslationRule {
    const rule: TranslationRule = {
      id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromDomain,
      toDomain,
      fromKind,
      toKind,
      transform,
      bidirectional,
      createdAt: new Date().toISOString(),
    };
    this.translations.push(rule);
    return rule;
  }

  /**
   * Translate a concept from its current domain/kind to a target domain.
   * Returns a new concept (does not mutate the original).
   */
  translate(conceptId: string, targetDomain: DomainTag): UniversalConcept | null {
    const concept = this.concepts.get(conceptId);
    if (!concept) return null;
    if (concept.domain === targetDomain) return concept;

    const rule = this.findRule(concept.domain, targetDomain, concept.kind);
    if (!rule) return null;

    const translated = rule.transform({ ...concept, relations: [...concept.relations] });
    translated.id = `uc-${targetDomain}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    translated.domain = targetDomain;
    translated.kind = rule.toKind;
    translated.canonicalForm = this.canonicalize(translated.kind, translated.domain, translated.name, translated.properties);
    translated.createdAt = new Date().toISOString();
    translated.updatedAt = translated.createdAt;
    this.concepts.set(translated.id, translated);
    return translated;
  }

  // ---- Query ----

  query(q: AbstractionQuery): UniversalConcept[] {
    let results = Array.from(this.concepts.values());

    if (q.kind) results = results.filter((c) => c.kind === q.kind);
    if (q.domain) results = results.filter((c) => c.domain === q.domain);
    if (q.namePattern) {
      const re = new RegExp(q.namePattern, 'i');
      results = results.filter((c) => re.test(c.name));
    }
    if (q.relatedTo) {
      const targetId = q.relatedTo;
      results = results.filter((c) => c.relations.some((r) => r.targetId === targetId));
    }
    if (q.maxResults) results = results.slice(0, q.maxResults);
    return results;
  }

  // ---- Summary ----

  getSummary(): AbstractionSummary {
    const byKind: Record<string, number> = {};
    for (const k of ALL_KINDS) byKind[k] = 0;
    const byDomain: Record<string, number> = {};
    let totalRelations = 0;

    for (const c of this.concepts.values()) {
      byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
      byDomain[c.domain] = (byDomain[c.domain] ?? 0) + 1;
      totalRelations += c.relations.length;
    }

    return {
      totalConcepts: this.concepts.size,
      byKind: byKind as Record<ConceptKind, number>,
      byDomain,
      totalRelations,
      translationRuleCount: this.translations.length,
      domainCount: Object.keys(byDomain).length,
    };
  }

  // ---- Internals ----

  private canonicalize(kind: ConceptKind, domain: DomainTag, name: string, props: Record<string, unknown>): string {
    const propKeys = Object.keys(props).sort((a, b) => a.localeCompare(b)).join(',');
    return `[${kind}:${domain}] ${name.toLowerCase().trim()} {${propKeys}}`;
  }

  private findRule(fromDomain: DomainTag, toDomain: DomainTag, kind: ConceptKind): TranslationRule | undefined {
    return this.translations.find((r) => {
      if (r.fromDomain === fromDomain && r.toDomain === toDomain && r.fromKind === kind) return true;
      if (r.bidirectional && r.toDomain === fromDomain && r.fromDomain === toDomain && r.toKind === kind) return true;
      return false;
    });
  }
}
