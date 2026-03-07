/**
 * Cultural-Historical Contextualization Layer
 *
 * Evaluates information from ancient texts, oral traditions, mythological
 * systems, archaeological findings, and anthropological research. Assigns
 * each piece of information a context type and a methodological confidence
 * score based on the standards of its originating discipline.
 *
 * This is NOT about validating beliefs. It is about contextual classification
 * so the OS knows how to treat each type of information — ensuring empirical
 * data is not conflated with symbolic narratives, and cultural significance
 * is respected without being over‑weighted in empirical reasoning.
 *
 * Cross‑cutting integration points:
 *   EpistemicIntegrity    → feeds discipline‑specific reliability models
 *   UnifiedCognitiveField → stores contextual metadata in global knowledge
 *   MissionCompiler       → prevents domain‑inappropriate data usage
 *   ZPE routing           → context‑weighted path cost
 *   SymbolicInterpretation→ provides categorization for symbolic engine
 */

// ---------------------------------------------------------------------------
// Enums & Literal Types
// ---------------------------------------------------------------------------

/** The primary knowledge domain of a piece of information. */
export type ContextType =
  | 'empirical'        // Archaeology, carbon dating, stratigraphy
  | 'historical'       // Ancient texts, chronicles, inscriptions
  | 'cultural'         // Myths, rituals, symbolic systems
  | 'philosophical'    // Metaphysics, ontology, conceptual frameworks
  | 'anthropological'  // Ethnography, observed cultural patterns
  | 'symbolic';        // Explicitly symbolic/metaphorical content

/** The source category for cultural-historical material. */
export type CulturalSourceType =
  | 'archaeological_evidence'
  | 'ancient_text'
  | 'religious_literature'
  | 'mythological_narrative'
  | 'metaphysical_concept'
  | 'anthropological_data'
  | 'oral_tradition'
  | 'epigraphic_record';

/** Interpretive confidence level. */
export type InterpretiveConfidence = 'high' | 'moderate' | 'low' | 'speculative';

/** Context badge displayed in the UI. */
export type ContextBadge =
  | 'Archaeological Evidence'
  | 'Ancient Textual Source'
  | 'Cultural Narrative'
  | 'Mythological Framework'
  | 'Philosophical Concept'
  | 'Anthropological Observation';

/** Mission compatibility constraint. */
export type MissionDomainConstraint =
  | 'empirical_only'
  | 'cultural_allowed'
  | 'symbolic_allowed'
  | 'philosophical_allowed'
  | 'any';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Methodological confidence factors for a cultural-historical item. */
export interface MethodologicalFactors {
  /** Reliability of dating methods (0–1). */
  datingReliability: number;
  /** Quality of textual transmission history (0–1). */
  textualTransmission: number;
  /** Archaeological context completeness (0–1). */
  archaeologicalContext: number;
  /** Internal cultural consistency of the narrative (0–1). */
  culturalConsistency: number;
  /** Depth and clarity of symbolic meaning (0–1). */
  symbolicMeaning: number;
  /** Degree of anthropological consensus (0–1). */
  anthropologicalConsensus: number;
}

/** A registered cultural-historical source. */
export interface CulturalSource {
  id: string;
  name: string;
  sourceType: CulturalSourceType;
  contextType: ContextType;
  /** Geographic or cultural origin. */
  origin: string;
  /** Approximate date or era description. */
  era: string;
  /** Methodological confidence factors. */
  factors: MethodologicalFactors;
  /** Composite methodological confidence 0–1. */
  confidence: number;
  /** Items assessed from this source. */
  itemsAssessed: number;
  registeredAt: string;
}

/** A single contextualized item of cultural-historical information. */
export interface CulturalItem {
  id: string;
  sourceId: string;
  content: string;
  contextType: ContextType;
  /** UI badge category. */
  badge: ContextBadge;
  /** Methodological confidence 0–1. */
  methodologicalConfidence: number;
  /** Empirical reliability 0–1 (high for archaeology, low for myth). */
  empiricalReliability: number;
  /** Cultural significance 0–1 (high for myth, low for raw artifact). */
  culturalSignificance: number;
  /** Interpretive notes for transparency. */
  interpretiveNotes: string[];
  /** Cross-disciplinary relevance tags. */
  crossDisciplinaryRelevance: string[];
  /** Mission domain constraints this item is suitable for. */
  suitableFor: MissionDomainConstraint[];
  /** ISO timestamp. */
  createdAt: string;
  /** Free-form metadata. */
  metadata: Record<string, unknown>;
}

/** Evaluation result returned by assess(). */
export interface CulturalAssessment {
  item: CulturalItem;
  factors: MethodologicalFactors;
  badge: ContextBadge;
  /** ZPE cost modifier: empirical → 1, symbolic → higher. */
  zpeCostModifier: number;
  /** Whether this item should be admitted to empirical reasoning. */
  admittedToEmpirical: boolean;
  /** Trace for transparency. */
  trace: string[];
}

/** Aggregate health summary. */
export interface CulturalLayerSummary {
  totalSources: number;
  totalItems: number;
  contextDistribution: Record<ContextType, number>;
  avgMethodologicalConfidence: number;
  avgEmpiricalReliability: number;
  avgCulturalSignificance: number;
  badgeDistribution: Partial<Record<ContextBadge, number>>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ITEMS = 50_000;

/** Default methodological weights per context type. */
const CONTEXT_WEIGHT_MAP: Record<ContextType, {
  empiricalReliability: number;
  culturalSignificance: number;
  zpeCost: number;
}> = {
  empirical: { empiricalReliability: 0.85, culturalSignificance: 0.2, zpeCost: 1 },
  historical: { empiricalReliability: 0.55, culturalSignificance: 0.5, zpeCost: 1.3 },
  cultural: { empiricalReliability: 0.2, culturalSignificance: 0.85, zpeCost: 1.8 },
  symbolic: { empiricalReliability: 0.1, culturalSignificance: 0.9, zpeCost: 2.2 },
  philosophical: { empiricalReliability: 0.05, culturalSignificance: 0.6, zpeCost: 2 },
  anthropological: { empiricalReliability: 0.45, culturalSignificance: 0.75, zpeCost: 1.5 },
};

/** Maps source types to default context types. */
const SOURCE_CONTEXT_MAP: Record<CulturalSourceType, ContextType> = {
  archaeological_evidence: 'empirical',
  ancient_text: 'historical',
  religious_literature: 'cultural',
  mythological_narrative: 'symbolic',
  metaphysical_concept: 'philosophical',
  anthropological_data: 'anthropological',
  oral_tradition: 'cultural',
  epigraphic_record: 'historical',
};

/** Maps context types to UI badges. */
const BADGE_MAP: Record<ContextType, ContextBadge> = {
  empirical: 'Archaeological Evidence',
  historical: 'Ancient Textual Source',
  cultural: 'Cultural Narrative',
  symbolic: 'Mythological Framework',
  philosophical: 'Philosophical Concept',
  anthropological: 'Anthropological Observation',
};

/** Mission-domain compatibility per context type. */
const DOMAIN_SUITABILITY: Record<ContextType, MissionDomainConstraint[]> = {
  empirical: ['empirical_only', 'cultural_allowed', 'any'],
  historical: ['cultural_allowed', 'any'],
  cultural: ['cultural_allowed', 'symbolic_allowed', 'any'],
  symbolic: ['symbolic_allowed', 'any'],
  philosophical: ['philosophical_allowed', 'symbolic_allowed', 'any'],
  anthropological: ['cultural_allowed', 'any'],
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class CulturalHistoricalContextLayer {
  private readonly sources = new Map<string, CulturalSource>();
  private readonly items: CulturalItem[] = [];
  private listeners: Array<(assessment: CulturalAssessment) => void> = [];

  // ========================================================================
  // Source Management
  // ========================================================================

  /** Register a cultural-historical source. */
  registerSource(
    id: string,
    name: string,
    sourceType: CulturalSourceType,
    origin: string,
    era: string,
    factorOverrides: Partial<MethodologicalFactors> = {},
  ): CulturalSource {
    const existing = this.sources.get(id);
    if (existing) {
      existing.name = name;
      existing.origin = origin;
      existing.era = era;
      return existing;
    }

    const defaultFactors = this.defaultFactors(sourceType);
    const factors: MethodologicalFactors = { ...defaultFactors, ...factorOverrides };
    const confidence = this.aggregateFactors(factors);

    const source: CulturalSource = {
      id,
      name,
      sourceType,
      contextType: SOURCE_CONTEXT_MAP[sourceType],
      origin,
      era,
      factors,
      confidence,
      itemsAssessed: 0,
      registeredAt: new Date().toISOString(),
    };
    this.sources.set(id, source);
    return source;
  }

  getSource(id: string): CulturalSource | null {
    return this.sources.get(id) ?? null;
  }

  getAllSources(): CulturalSource[] {
    return [...this.sources.values()];
  }

  // ========================================================================
  // Assessment Pipeline
  // ========================================================================

  /**
   * Assess a piece of cultural-historical information.
   *
   * Steps:
   * 1. Resolve or auto‑register source
   * 2. Compute methodological factors
   * 3. Assign context type and badge
   * 4. Score empirical reliability and cultural significance
   * 5. Determine mission suitability
   * 6. Generate interpretive notes
   * 7. Compute ZPE cost modifier
   */
  assess(
    sourceId: string,
    content: string,
    contextOverride?: ContextType,
    metadata: Record<string, unknown> = {},
  ): CulturalAssessment {
    const now = new Date().toISOString();

    // Ensure source exists
    if (!this.sources.has(sourceId)) {
      this.registerSource(sourceId, sourceId, 'ancient_text', 'unknown', 'unknown');
    }
    const source = this.sources.get(sourceId)!;
    source.itemsAssessed += 1;

    // Context type
    const contextType = contextOverride ?? source.contextType;
    const weights = CONTEXT_WEIGHT_MAP[contextType];

    // Methodological factors (start from source, adjust per content)
    const factors = this.computeFactors(source, content, contextType);
    const methodologicalConfidence = this.aggregateFactors(factors);

    // Scores
    const empiricalReliability = Number(
      (methodologicalConfidence * weights.empiricalReliability).toFixed(4),
    );
    const culturalSignificance = Number(
      (methodologicalConfidence * weights.culturalSignificance + (1 - methodologicalConfidence) * weights.culturalSignificance * 0.5).toFixed(4),
    );

    // Badge
    const badge = BADGE_MAP[contextType];

    // Interpretive notes
    const interpretiveNotes = this.generateNotes(source, contextType, methodologicalConfidence);

    // Cross-disciplinary relevance
    const crossDisciplinaryRelevance = this.deriveCrossDisciplinary(contextType, content);

    // Mission suitability
    const suitableFor = DOMAIN_SUITABILITY[contextType];

    // Build item
    const item: CulturalItem = {
      id: `chi-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      sourceId,
      content,
      contextType,
      badge,
      methodologicalConfidence,
      empiricalReliability,
      culturalSignificance,
      interpretiveNotes,
      crossDisciplinaryRelevance,
      suitableFor,
      createdAt: now,
      metadata,
    };

    // Store (with cap)
    this.items.push(item);
    if (this.items.length > MAX_ITEMS) {
      this.items.splice(0, this.items.length - MAX_ITEMS);
    }

    // ZPE cost
    const zpeCostModifier = weights.zpeCost * (1 + (1 - methodologicalConfidence) * 0.5);

    // Admitted to empirical reasoning only if high enough reliability
    const admittedToEmpirical = empiricalReliability >= 0.4;

    // Trace
    const trace = this.buildTrace(item, factors, admittedToEmpirical, zpeCostModifier);

    const assessment: CulturalAssessment = {
      item,
      factors,
      badge,
      zpeCostModifier: Number(zpeCostModifier.toFixed(4)),
      admittedToEmpirical,
      trace,
    };

    // Emit
    for (const fn of this.listeners) fn(assessment);

    return assessment;
  }

  // ========================================================================
  // Queries
  // ========================================================================

  getItemsByContext(context: ContextType, limit = 100): CulturalItem[] {
    return this.items
      .filter((i) => i.contextType === context)
      .slice(-limit);
  }

  getItemsByBadge(badge: ContextBadge, limit = 100): CulturalItem[] {
    return this.items
      .filter((i) => i.badge === badge)
      .slice(-limit);
  }

  getEmpiricallyAdmissible(limit = 100): CulturalItem[] {
    return this.items
      .filter((i) => i.empiricalReliability >= 0.4)
      .slice(-limit);
  }

  getHighCulturalSignificance(threshold = 0.7, limit = 100): CulturalItem[] {
    return this.items
      .filter((i) => i.culturalSignificance >= threshold)
      .slice(-limit);
  }

  /** Check if a cultural item is suitable for a given mission domain. */
  isSuitableForMission(itemId: string, constraint: MissionDomainConstraint): boolean {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return false;
    return item.suitableFor.includes(constraint);
  }

  // ========================================================================
  // Events
  // ========================================================================

  on(listener: (assessment: CulturalAssessment) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ========================================================================
  // Summary
  // ========================================================================

  getSummary(): CulturalLayerSummary {
    const totalItems = this.items.length;
    const totalSources = this.sources.size;

    const contextDistribution: Record<ContextType, number> = {
      empirical: 0,
      historical: 0,
      cultural: 0,
      symbolic: 0,
      philosophical: 0,
      anthropological: 0,
    };
    for (const i of this.items) contextDistribution[i.contextType] += 1;

    const badgeDistribution: Partial<Record<ContextBadge, number>> = {};
    for (const i of this.items) {
      badgeDistribution[i.badge] = (badgeDistribution[i.badge] ?? 0) + 1;
    }

    const avgMethodologicalConfidence = totalItems > 0
      ? Number((this.items.reduce((s, i) => s + i.methodologicalConfidence, 0) / totalItems).toFixed(4))
      : 0;
    const avgEmpiricalReliability = totalItems > 0
      ? Number((this.items.reduce((s, i) => s + i.empiricalReliability, 0) / totalItems).toFixed(4))
      : 0;
    const avgCulturalSignificance = totalItems > 0
      ? Number((this.items.reduce((s, i) => s + i.culturalSignificance, 0) / totalItems).toFixed(4))
      : 0;

    return {
      totalSources,
      totalItems,
      contextDistribution,
      avgMethodologicalConfidence,
      avgEmpiricalReliability,
      avgCulturalSignificance,
      badgeDistribution,
    };
  }

  // ========================================================================
  // Internals
  // ========================================================================

  /** Default methodological factors per source type. */
  private defaultFactors(type: CulturalSourceType): MethodologicalFactors {
    const defaults: Record<CulturalSourceType, MethodologicalFactors> = {
      archaeological_evidence: {
        datingReliability: 0.7, textualTransmission: 0.1, archaeologicalContext: 0.8,
        culturalConsistency: 0.5, symbolicMeaning: 0.2, anthropologicalConsensus: 0.6,
      },
      ancient_text: {
        datingReliability: 0.4, textualTransmission: 0.6, archaeologicalContext: 0.3,
        culturalConsistency: 0.6, symbolicMeaning: 0.5, anthropologicalConsensus: 0.5,
      },
      religious_literature: {
        datingReliability: 0.3, textualTransmission: 0.7, archaeologicalContext: 0.2,
        culturalConsistency: 0.8, symbolicMeaning: 0.8, anthropologicalConsensus: 0.4,
      },
      mythological_narrative: {
        datingReliability: 0.1, textualTransmission: 0.3, archaeologicalContext: 0.1,
        culturalConsistency: 0.7, symbolicMeaning: 0.9, anthropologicalConsensus: 0.5,
      },
      metaphysical_concept: {
        datingReliability: 0, textualTransmission: 0.4, archaeologicalContext: 0,
        culturalConsistency: 0.5, symbolicMeaning: 0.7, anthropologicalConsensus: 0.3,
      },
      anthropological_data: {
        datingReliability: 0.5, textualTransmission: 0.3, archaeologicalContext: 0.4,
        culturalConsistency: 0.7, symbolicMeaning: 0.4, anthropologicalConsensus: 0.8,
      },
      oral_tradition: {
        datingReliability: 0.1, textualTransmission: 0.2, archaeologicalContext: 0.1,
        culturalConsistency: 0.8, symbolicMeaning: 0.7, anthropologicalConsensus: 0.6,
      },
      epigraphic_record: {
        datingReliability: 0.6, textualTransmission: 0.5, archaeologicalContext: 0.7,
        culturalConsistency: 0.5, symbolicMeaning: 0.3, anthropologicalConsensus: 0.5,
      },
    };
    return defaults[type];
  }

  /** Compute factors adjusted per content and context. */
  private computeFactors(
    source: CulturalSource,
    content: string,
    contextType: ContextType,
  ): MethodologicalFactors {
    const base = { ...source.factors };
    const lower = content.toLowerCase();

    // Boost dating reliability if content references dating methods
    if (/carbon[\s-]?dat|radiocarbon|stratigraphy|thermoluminescence/i.test(lower)) {
      base.datingReliability = Math.min(1, base.datingReliability + 0.15);
    }

    // Boost textual transmission if provenance is mentioned
    if (/manuscript|codex|scroll|inscription|papyrus|cuneiform/i.test(lower)) {
      base.textualTransmission = Math.min(1, base.textualTransmission + 0.1);
    }

    // Boost cultural consistency for myth/cultural content
    if (contextType === 'cultural' || contextType === 'symbolic') {
      base.culturalConsistency = Math.min(1, base.culturalConsistency + 0.1);
      base.symbolicMeaning = Math.min(1, base.symbolicMeaning + 0.1);
    }

    // Boost archaeological context for empirical content
    if (contextType === 'empirical') {
      base.archaeologicalContext = Math.min(1, base.archaeologicalContext + 0.1);
    }

    // Boost anthropological consensus if referencing established studies
    if (/ethnograph|fieldwork|participant[\s-]?observation|cross[\s-]?cultural/i.test(lower)) {
      base.anthropologicalConsensus = Math.min(1, base.anthropologicalConsensus + 0.15);
    }

    return base;
  }

  /** Average all methodological factors. */
  private aggregateFactors(factors: MethodologicalFactors): number {
    const vals = Object.values(factors) as number[];
    if (vals.length === 0) return 0;
    return Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(4));
  }

  /** Generate interpretive notes based on context and confidence. */
  private generateNotes(
    source: CulturalSource,
    contextType: ContextType,
    confidence: number,
  ): string[] {
    const notes: string[] = [
      `Source type: ${source.sourceType} (${source.origin}, ${source.era})`,
      `Context classification: ${contextType}`,
    ];

    if (contextType === 'empirical' && confidence < 0.5) {
      notes.push('Caution: empirical claim with limited methodological support');
    }
    if (contextType === 'symbolic' || contextType === 'cultural') {
      notes.push('Interpret within originating cultural framework; not empirical evidence');
    }
    if (contextType === 'philosophical') {
      notes.push('Conceptual framework; no empirical grounding expected');
    }
    if (contextType === 'historical' && source.factors.textualTransmission < 0.4) {
      notes.push('Limited textual transmission history; interpretation may require caution');
    }
    if (source.factors.datingReliability < 0.2) {
      notes.push('Dating reliability is low; chronological placement uncertain');
    }

    return notes;
  }

  /** Derive cross-disciplinary relevance tags. */
  private deriveCrossDisciplinary(contextType: ContextType, content: string): string[] {
    const tags: string[] = [contextType];
    const lower = content.toLowerCase();

    if (/archaeolog|artifact|excavat|stratigraphy/i.test(lower)) tags.push('archaeology');
    if (/myth|legend|epic|saga|cosmogon/i.test(lower)) tags.push('mythology');
    if (/philosophy|metaphysic|ontolog|epistemolog/i.test(lower)) tags.push('philosophy');
    if (/anthropolog|ethnograph|culture|ritual/i.test(lower)) tags.push('anthropology');
    if (/biblic|scripture|gospel|torah|quran|vedic/i.test(lower)) tags.push('religious_studies');
    if (/linguist|semiot|hermeneutic/i.test(lower)) tags.push('linguistics');

    return [...new Set(tags)];
  }

  /** Build a human-readable assessment trace. */
  private buildTrace(
    item: CulturalItem,
    factors: MethodologicalFactors,
    admittedToEmpirical: boolean,
    zpeCost: number,
  ): string[] {
    return [
      `[CHCL] Item ${item.id} from source ${item.sourceId}`,
      `  Context: ${item.contextType} → Badge: ${item.badge}`,
      `  Methodological confidence: ${item.methodologicalConfidence}`,
      `    dating=${factors.datingReliability}, textual=${factors.textualTransmission}, arch=${factors.archaeologicalContext}`,
      `    cultural=${factors.culturalConsistency}, symbolic=${factors.symbolicMeaning}, anthro=${factors.anthropologicalConsensus}`,
      `  Empirical reliability: ${item.empiricalReliability} | Cultural significance: ${item.culturalSignificance}`,
      `  Admitted to empirical reasoning: ${admittedToEmpirical}`,
      `  ZPE cost modifier: ${zpeCost.toFixed(4)}`,
      `  Suitable for: ${item.suitableFor.join(', ')}`,
      `  Notes: ${item.interpretiveNotes.join('; ')}`,
    ];
  }
}
