/**
 * Symbolic Interpretation Layer
 *
 * Interprets information through the lens of symbolism, archetypes, cultural
 * motifs, and metaphysical frameworks. Identifies the symbolic logic behind
 * narratives, rituals, myths, and metaphysical concepts so the OS can
 * classify them correctly and use them appropriately in missions.
 *
 * This layer does NOT validate supernatural claims or adjudicate belief
 * systems. It recognises symbolic structures and their cultural functions.
 *
 * Sub‑modules:
 *   • Archetype Detector      → hero, mentor, trickster, guardian, rebirth …
 *   • Motif Mapper             → creation cycles, cosmic dualities, descent‑return …
 *   • Cross‑Cultural Mapper    → structural parallels across traditions
 *   • Symbolic Summary Engine  → structured, mission‑ready summaries
 *   • Visual Map Generator     → relationship data for dashboard rendering
 *
 * Cross‑cutting integration points:
 *   CulturalHistoricalContext → provides context classification input
 *   EpistemicIntegrity        → symbolic confidence feeds epistemic scoring
 *   UnifiedCognitiveField     → symbolic structures stored in knowledge graph
 *   MissionCompiler           → ensures symbolic content used correctly
 *   ZPE routing               → symbolic weight modifies path cost
 *   Dashboard                 → symbolic maps, badges, summary panels
 */

// ---------------------------------------------------------------------------
// Enums & Literal Types
// ---------------------------------------------------------------------------

/** Archetypal role identified in a narrative or concept. */
export type ArchetypeRole =
  | 'hero'
  | 'mentor'
  | 'trickster'
  | 'guardian'
  | 'shadow'
  | 'herald'
  | 'shapeshifter'
  | 'rebirth'
  | 'sacrifice'
  | 'creator'
  | 'destroyer'
  | 'mediator'
  | 'outcast';

/** Symbolic structural pattern. */
export type SymbolicMotif =
  | 'creation_cycle'
  | 'hero_journey'
  | 'cosmic_duality'
  | 'descent_return'
  | 'flood_narrative'
  | 'world_tree'
  | 'sacred_mountain'
  | 'transformation'
  | 'death_rebirth'
  | 'trickster_cycle'
  | 'divine_marriage'
  | 'axis_mundi'
  | 'eternal_return'
  | 'golden_age'
  | 'apocalypse';

/** Cultural function the narrative serves. */
export type CulturalFunction =
  | 'identity_formation'
  | 'moral_teaching'
  | 'cosmology'
  | 'social_cohesion'
  | 'rite_of_passage'
  | 'healing_ritual'
  | 'ancestral_memory'
  | 'political_legitimation'
  | 'epistemological_model';

/** UI indicator badge for symbolic content. */
export type SymbolicBadge =
  | 'Symbolic Narrative'
  | 'Archetypal Pattern'
  | 'Cultural Motif'
  | 'Philosophical Concept'
  | 'Metaphysical Framework'
  | 'Cross-Cultural Motif'
  | 'Symbolic Narrative Structure';

/** Cross‑cultural parallel strength. */
export type ParallelStrength = 'strong' | 'moderate' | 'weak' | 'speculative';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** A detected archetype in a piece of content. */
export interface ArchetypeDetection {
  role: ArchetypeRole;
  confidence: number;
  evidence: string;
}

/** A detected symbolic motif. */
export interface MotifDetection {
  motif: SymbolicMotif;
  confidence: number;
  evidence: string;
}

/** A cross-cultural parallel identified between traditions. */
export interface CrossCulturalParallel {
  id: string;
  /** Source tradition/culture. */
  sourceOrigin: string;
  /** Parallel tradition/culture. */
  parallelOrigin: string;
  /** The motif or archetype that parallels. */
  sharedPattern: SymbolicMotif | ArchetypeRole;
  /** Strength of the structural similarity. */
  strength: ParallelStrength;
  /** Meaning differences despite structural similarity. */
  divergenceNotes: string[];
  /** Confidence 0–1. */
  confidence: number;
}

/** Cultural origin profile for a symbolic item. */
export interface CulturalOriginProfile {
  tradition: string;
  region: string;
  era: string;
  language: string;
  worldviewNotes: string;
}

/** A structured symbolic summary — the output of the summary engine. */
export interface SymbolicSummary {
  culturalOrigin: CulturalOriginProfile;
  symbolicStructure: MotifDetection[];
  archetypeRoles: ArchetypeDetection[];
  culturalFunctions: CulturalFunction[];
  interpretiveNotes: string[];
  crossCulturalParallels: CrossCulturalParallel[];
  methodologicalConfidence: number;
}

/** Visual map node for dashboard rendering. */
export interface SymbolicMapNode {
  id: string;
  label: string;
  kind: 'motif' | 'archetype' | 'origin' | 'function' | 'parallel';
  confidence: number;
  metadata: Record<string, unknown>;
}

/** Visual map edge for dashboard rendering. */
export interface SymbolicMapEdge {
  from: string;
  to: string;
  relation: string;
  strength: ParallelStrength;
}

/** Complete visual map data structure. */
export interface SymbolicMap {
  nodes: SymbolicMapNode[];
  edges: SymbolicMapEdge[];
}

/** A single symbolic interpretation result. */
export interface SymbolicItem {
  id: string;
  sourceId: string;
  content: string;
  badge: SymbolicBadge;
  archetypes: ArchetypeDetection[];
  motifs: MotifDetection[];
  culturalFunctions: CulturalFunction[];
  culturalOrigin: CulturalOriginProfile;
  crossCulturalParallels: CrossCulturalParallel[];
  interpretiveNotes: string[];
  /** Symbolic confidence 0–1 (NOT empirical — based on symbolic standards). */
  symbolicConfidence: number;
  /** Cultural relevance 0–1. */
  culturalRelevance: number;
  /** ZPE cost modifier from symbolic assessment. */
  zpeCostModifier: number;
  createdAt: string;
  metadata: Record<string, unknown>;
}

/** Full interpretation result returned by interpret(). */
export interface SymbolicInterpretation {
  item: SymbolicItem;
  summary: SymbolicSummary;
  map: SymbolicMap;
  badge: SymbolicBadge;
  trace: string[];
}

/** Aggregate health summary. */
export interface SymbolicLayerSummary {
  totalItems: number;
  totalParallels: number;
  archetypeDistribution: Partial<Record<ArchetypeRole, number>>;
  motifDistribution: Partial<Record<SymbolicMotif, number>>;
  avgSymbolicConfidence: number;
  avgCulturalRelevance: number;
  badgeDistribution: Partial<Record<SymbolicBadge, number>>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ITEMS = 50_000;
const MAX_PARALLELS = 20_000;

/** Keyword patterns for archetype detection. */
const ARCHETYPE_PATTERNS: Array<{ role: ArchetypeRole; patterns: RegExp }> = [
  { role: 'hero', patterns: /\b(hero|champion|warrior|protagonist|savior|deliverer)\b/i },
  { role: 'mentor', patterns: /\b(mentor|sage|wise\s*(?:man|woman|one)|teacher|guide|guru)\b/i },
  { role: 'trickster', patterns: /\b(trickster|fool|joker|coyote|loki|hermes|raven)\b/i },
  { role: 'guardian', patterns: /\b(guardian|protector|sentinel|keeper|watcher|shield)\b/i },
  { role: 'shadow', patterns: /\b(shadow|dark\s*(?:side|lord|one)|adversary|nemesis|demon)\b/i },
  { role: 'herald', patterns: /\b(herald|messenger|prophet|oracle|harbinger|omen)\b/i },
  { role: 'shapeshifter', patterns: /\b(shapeshifter|changeling|metamorphos|transform|proteus)\b/i },
  { role: 'rebirth', patterns: /\b(rebirth|resurrection|renewal|phoenix|reborn|risen)\b/i },
  { role: 'sacrifice', patterns: /\b(sacrifice|martyr|offering|atonement|immolation)\b/i },
  { role: 'creator', patterns: /\b(creator|demiurge|maker|architect|craftsman|primordial)\b/i },
  { role: 'destroyer', patterns: /\b(destroyer|annihilat|ragnarok|apocalyps|shiva|kali)\b/i },
  { role: 'mediator', patterns: /\b(mediator|intercessor|bridge|intermediary|shaman)\b/i },
  { role: 'outcast', patterns: /\b(outcast|exile|wanderer|pariah|stranger|orphan)\b/i },
];

/** Keyword patterns for motif detection. */
const MOTIF_PATTERNS: Array<{ motif: SymbolicMotif; patterns: RegExp }> = [
  { motif: 'creation_cycle', patterns: /\b(creation|genesis|cosmogon|primordial|beginning|origin\s*(?:myth|story))\b/i },
  { motif: 'hero_journey', patterns: /\b(hero.?s?\s*journey|quest|adventure|odyssey|pilgrimage|calling)\b/i },
  { motif: 'cosmic_duality', patterns: /\b(duality|yin[\s-]*yang|light[\s-]*dark|good[\s-]*evil|order[\s-]*chaos)\b/i },
  { motif: 'descent_return', patterns: /\b(descent|underworld|netherworld|katabasis|return|ascen[dt])\b/i },
  { motif: 'flood_narrative', patterns: /\b(flood|deluge|inundation|noah|gilgamesh.*flood|manu.*flood)\b/i },
  { motif: 'world_tree', patterns: /\b(world[\s-]*tree|yggdrasil|tree[\s-]*of[\s-]*life|cosmic[\s-]*tree|axis)\b/i },
  { motif: 'sacred_mountain', patterns: /\b(sacred[\s-]*mountain|mount[\s-]*(?:olympus|sinai|meru|kailash)|cosmic[\s-]*mount)\b/i },
  { motif: 'transformation', patterns: /\b(transformation|metamorphosis|transmutation|alchemical|chrysalis)\b/i },
  { motif: 'death_rebirth', patterns: /\b(death[\s-]*(?:and[\s-]*)?rebirth|resurrection|dying[\s-]*(?:god|and[\s-]*rising))\b/i },
  { motif: 'trickster_cycle', patterns: /\b(trickster[\s-]*(?:cycle|tale|story)|coyote[\s-]*(?:cycle|tale)|anansi)\b/i },
  { motif: 'divine_marriage', patterns: /\b(divine[\s-]*marriage|hieros[\s-]*gamos|sacred[\s-]*union|celestial[\s-]*wedding)\b/i },
  { motif: 'axis_mundi', patterns: /\b(axis[\s-]*mundi|cosmic[\s-]*axis|navel[\s-]*of[\s-]*earth)\b/i },
  { motif: 'eternal_return', patterns: /\b(eternal[\s-]*return|ouroboros|cyclic[\s-]*time|recurring[\s-]*cycle|nietzsche.*return)\b/i },
  { motif: 'golden_age', patterns: /\b(golden[\s-]*age|paradise[\s-]*lost|eden|arcadia|utopia|satya[\s-]*yuga)\b/i },
  { motif: 'apocalypse', patterns: /\b(apocalypse|ragnarok|end[\s-]*(?:times|of[\s-]*days)|eschaton|judgement[\s-]*day)\b/i },
];

/** Cultural function keyword patterns. */
const FUNCTION_PATTERNS: Array<{ fn: CulturalFunction; patterns: RegExp }> = [
  { fn: 'identity_formation', patterns: /\b(identity|belonging|heritage|ancestry|peoplehood|nationhood)\b/i },
  { fn: 'moral_teaching', patterns: /\b(moral|ethic|virtue|lesson|parable|commandment|precept)\b/i },
  { fn: 'cosmology', patterns: /\b(cosmolog|universe|creation|cosmic[\s-]*order|celestial)\b/i },
  { fn: 'social_cohesion', patterns: /\b(community|solidarity|unity|togetherness|collective|tribe)\b/i },
  { fn: 'rite_of_passage', patterns: /\b(rite[\s-]*of[\s-]*passage|initiation|coming[\s-]*of[\s-]*age|transition|liminal)\b/i },
  { fn: 'healing_ritual', patterns: /\b(healing|ritual|ceremony|purification|cleansing|medicine)\b/i },
  { fn: 'ancestral_memory', patterns: /\b(ancestor|lineage|genealog|memorial|remembrance|forebear)\b/i },
  { fn: 'political_legitimation', patterns: /\b(legitimate|sovereign|divine[\s-]*right|mandate|authority|dynasty)\b/i },
  { fn: 'epistemological_model', patterns: /\b(knowledge|knowing|wisdom|understanding|epistemolog|gnosis)\b/i },
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SymbolicInterpretationLayer {
  private readonly items: SymbolicItem[] = [];
  private readonly parallels: CrossCulturalParallel[] = [];
  private listeners: Array<(interpretation: SymbolicInterpretation) => void> = [];

  // ========================================================================
  // Core Interpretation Pipeline
  // ========================================================================

  /**
   * Interpret a piece of content through the symbolic lens.
   *
   * Steps:
   * 1. Detect archetypes
   * 2. Detect motifs
   * 3. Identify cultural functions
   * 4. Assign cultural origin profile
   * 5. Map cross-cultural parallels
   * 6. Generate structured summary
   * 7. Build visual map
   * 8. Assign badge
   */
  interpret(
    sourceId: string,
    content: string,
    origin: Partial<CulturalOriginProfile> = {},
    metadata: Record<string, unknown> = {},
  ): SymbolicInterpretation {
    const now = new Date().toISOString();

    // 1. Archetypes
    const archetypes = this.detectArchetypes(content);

    // 2. Motifs
    const motifs = this.detectMotifs(content);

    // 3. Cultural functions
    const culturalFunctions = this.detectCulturalFunctions(content);

    // 4. Cultural origin
    const culturalOrigin = this.buildOriginProfile(origin, content);

    // 5. Cross-cultural parallels
    const crossCulturalParallels = this.findCrossCulturalParallels(
      motifs, archetypes, culturalOrigin,
    );

    // Symbolic confidence: based on detection richness
    const symbolicConfidence = this.computeSymbolicConfidence(archetypes, motifs, culturalFunctions);

    // Cultural relevance
    const culturalRelevance = this.computeCulturalRelevance(culturalFunctions, crossCulturalParallels);

    // ZPE cost modifier
    const zpeCostModifier = this.computeZpeCost(symbolicConfidence);

    // Badge
    const badge = this.assignBadge(archetypes, motifs, crossCulturalParallels);

    // Interpretive notes
    const interpretiveNotes = this.generateNotes(archetypes, motifs, culturalFunctions, culturalOrigin);

    // Build item
    const item: SymbolicItem = {
      id: `si-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      sourceId,
      content,
      badge,
      archetypes,
      motifs,
      culturalFunctions,
      culturalOrigin,
      crossCulturalParallels,
      interpretiveNotes,
      symbolicConfidence,
      culturalRelevance,
      zpeCostModifier,
      createdAt: now,
      metadata,
    };

    // Store (with cap)
    this.items.push(item);
    if (this.items.length > MAX_ITEMS) {
      this.items.splice(0, this.items.length - MAX_ITEMS);
    }

    // Store new parallels
    for (const p of crossCulturalParallels) {
      if (!this.parallels.some((ex) => ex.id === p.id)) {
        this.parallels.push(p);
      }
    }
    if (this.parallels.length > MAX_PARALLELS) {
      this.parallels.splice(0, this.parallels.length - MAX_PARALLELS);
    }

    // Summary
    const summary = this.buildSummary(item);

    // Visual map
    const map = this.buildMap(item);

    // Trace
    const trace = this.buildTrace(item);

    const interpretation: SymbolicInterpretation = {
      item,
      summary,
      map,
      badge,
      trace,
    };

    // Emit
    for (const fn of this.listeners) fn(interpretation);

    return interpretation;
  }

  // ========================================================================
  // Queries
  // ========================================================================

  getItemsByArchetype(role: ArchetypeRole, limit = 100): SymbolicItem[] {
    return this.items
      .filter((i) => i.archetypes.some((a) => a.role === role))
      .slice(-limit);
  }

  getItemsByMotif(motif: SymbolicMotif, limit = 100): SymbolicItem[] {
    return this.items
      .filter((i) => i.motifs.some((m) => m.motif === motif))
      .slice(-limit);
  }

  getParallels(limit = 100): CrossCulturalParallel[] {
    return this.parallels.slice(-limit);
  }

  getStrongParallels(): CrossCulturalParallel[] {
    return this.parallels.filter((p) => p.strength === 'strong');
  }

  getItemsByBadge(badge: SymbolicBadge, limit = 100): SymbolicItem[] {
    return this.items
      .filter((i) => i.badge === badge)
      .slice(-limit);
  }

  // ========================================================================
  // Events
  // ========================================================================

  on(listener: (interpretation: SymbolicInterpretation) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ========================================================================
  // Summary
  // ========================================================================

  getSummary(): SymbolicLayerSummary {
    const totalItems = this.items.length;

    const archetypeDistribution: Partial<Record<ArchetypeRole, number>> = {};
    const motifDistribution: Partial<Record<SymbolicMotif, number>> = {};
    const badgeDistribution: Partial<Record<SymbolicBadge, number>> = {};

    for (const item of this.items) {
      for (const a of item.archetypes) {
        archetypeDistribution[a.role] = (archetypeDistribution[a.role] ?? 0) + 1;
      }
      for (const m of item.motifs) {
        motifDistribution[m.motif] = (motifDistribution[m.motif] ?? 0) + 1;
      }
      badgeDistribution[item.badge] = (badgeDistribution[item.badge] ?? 0) + 1;
    }

    const avgSymbolicConfidence = totalItems > 0
      ? Number((this.items.reduce((s, i) => s + i.symbolicConfidence, 0) / totalItems).toFixed(4))
      : 0;
    const avgCulturalRelevance = totalItems > 0
      ? Number((this.items.reduce((s, i) => s + i.culturalRelevance, 0) / totalItems).toFixed(4))
      : 0;

    return {
      totalItems,
      totalParallels: this.parallels.length,
      archetypeDistribution,
      motifDistribution,
      avgSymbolicConfidence,
      avgCulturalRelevance,
      badgeDistribution,
    };
  }

  // ========================================================================
  // Internals — Detection
  // ========================================================================

  /** Detect archetypes in content via pattern matching. */
  private detectArchetypes(content: string): ArchetypeDetection[] {
    const results: ArchetypeDetection[] = [];
    for (const { role, patterns } of ARCHETYPE_PATTERNS) {
      const match = patterns.exec(content);
      if (match) {
        results.push({
          role,
          confidence: 0.6 + Math.random() * 0.3, // base + context jitter
          evidence: match[0],
        });
      }
    }
    return results;
  }

  /** Detect symbolic motifs in content. */
  private detectMotifs(content: string): MotifDetection[] {
    const results: MotifDetection[] = [];
    for (const { motif, patterns } of MOTIF_PATTERNS) {
      const match = patterns.exec(content);
      if (match) {
        results.push({
          motif,
          confidence: 0.5 + Math.random() * 0.4,
          evidence: match[0],
        });
      }
    }
    return results;
  }

  /** Detect cultural functions served by the content. */
  private detectCulturalFunctions(content: string): CulturalFunction[] {
    const functions: CulturalFunction[] = [];
    for (const { fn, patterns } of FUNCTION_PATTERNS) {
      if (patterns.test(content)) {
        functions.push(fn);
      }
    }
    return functions;
  }

  // ========================================================================
  // Internals — Origin & Parallels
  // ========================================================================

  /** Build a cultural origin profile from partial input + content heuristics. */
  private buildOriginProfile(
    partial: Partial<CulturalOriginProfile>,
    content: string,
  ): CulturalOriginProfile {
    const lower = content.toLowerCase();

    // Infer tradition
    let tradition = partial.tradition ?? 'unknown';
    if (tradition === 'unknown') {
      if (/greek|olymp|zeus|athena|homer/.test(lower)) tradition = 'Greek';
      else if (/norse|odin|thor|valhalla|yggdrasil/.test(lower)) tradition = 'Norse';
      else if (/egyptian|ra|osiris|isis|pharaoh/.test(lower)) tradition = 'Egyptian';
      else if (/hindu|vedic|shiva|vishnu|brahma/.test(lower)) tradition = 'Hindu';
      else if (/biblic|genesis|exodus|gospel|psalm/.test(lower)) tradition = 'Biblical';
      else if (/buddhist|buddha|dharma|sutra|nirvana/.test(lower)) tradition = 'Buddhist';
      else if (/celtic|druid|tuatha|fomorian/.test(lower)) tradition = 'Celtic';
      else if (/mesopotam|sumerian|akkadian|babylonian|gilgamesh/.test(lower)) tradition = 'Mesopotamian';
      else if (/chinese|daoist|confuci|mandate.*heaven|jade.*emperor/.test(lower)) tradition = 'Chinese';
      else if (/japanese|shinto|kami|amaterasu|kojiki/.test(lower)) tradition = 'Japanese';
      else if (/african|yoruba|anansi|griot|ashanti/.test(lower)) tradition = 'West African';
      else if (/indigenous|dreamtime|aboriginal|first.*nation/.test(lower)) tradition = 'Indigenous';
      else if (/islamic|quran|hadith|muhammad|allah/.test(lower)) tradition = 'Islamic';
    }

    return {
      tradition,
      region: partial.region ?? 'unspecified',
      era: partial.era ?? 'unspecified',
      language: partial.language ?? 'unspecified',
      worldviewNotes: partial.worldviewNotes ?? `Interpreted within ${tradition} cultural framework`,
    };
  }

  /** Find cross-cultural parallels based on detected motifs and archetypes. */
  private findCrossCulturalParallels(
    motifs: MotifDetection[],
    archetypes: ArchetypeDetection[],
    origin: CulturalOriginProfile,
  ): CrossCulturalParallel[] {
    const results: CrossCulturalParallel[] = [];

    // Check against existing items from different traditions
    for (const existing of this.items.slice(-500)) {
      if (existing.culturalOrigin.tradition === origin.tradition) continue;

      for (const motif of motifs) {
        const match = existing.motifs.find((m) => m.motif === motif.motif);
        if (match) {
          const avgConf = (motif.confidence + match.confidence) / 2;
          const strength = this.classifyParallelStrength(avgConf);
          results.push({
            id: `xcp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            sourceOrigin: origin.tradition,
            parallelOrigin: existing.culturalOrigin.tradition,
            sharedPattern: motif.motif,
            strength,
            divergenceNotes: [
              `Structural similarity in ${motif.motif}; meaning may differ across traditions`,
            ],
            confidence: Number(avgConf.toFixed(4)),
          });
        }
      }

      for (const arch of archetypes) {
        const match = existing.archetypes.find((a) => a.role === arch.role);
        if (match) {
          const avgConf = (arch.confidence + match.confidence) / 2;
          const strength = this.classifyParallelStrength(avgConf);
          results.push({
            id: `xcp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            sourceOrigin: origin.tradition,
            parallelOrigin: existing.culturalOrigin.tradition,
            sharedPattern: arch.role,
            strength,
            divergenceNotes: [
              `Shared ${arch.role} archetype; cultural expression may differ`,
            ],
            confidence: Number(avgConf.toFixed(4)),
          });
        }
      }
    }

    return results.slice(0, 20); // cap per interpretation
  }

  /** Classify parallel strength from confidence. */
  private classifyParallelStrength(confidence: number): ParallelStrength {
    if (confidence >= 0.8) return 'strong';
    if (confidence >= 0.6) return 'moderate';
    if (confidence >= 0.4) return 'weak';
    return 'speculative';
  }

  // ========================================================================
  // Internals — Scoring
  // ========================================================================

  /** Symbolic confidence based on detection richness. */
  private computeSymbolicConfidence(
    archetypes: ArchetypeDetection[],
    motifs: MotifDetection[],
    functions: CulturalFunction[],
  ): number {
    // More detections → higher confidence in symbolic interpretation
    const arcScore = Math.min(1, archetypes.length / 3);
    const motifScore = Math.min(1, motifs.length / 3);
    const funcScore = Math.min(1, functions.length / 2);
    const avgDetectionConf = archetypes.length > 0
      ? archetypes.reduce((s, a) => s + a.confidence, 0) / archetypes.length
      : 0.3;
    return Number(((arcScore * 0.3 + motifScore * 0.3 + funcScore * 0.2 + avgDetectionConf * 0.2)).toFixed(4));
  }

  /** Cultural relevance based on richness of cultural links. */
  private computeCulturalRelevance(
    functions: CulturalFunction[],
    parallels: CrossCulturalParallel[],
  ): number {
    const funcScore = Math.min(1, functions.length / 3);
    const parallelScore = Math.min(1, parallels.length / 5);
    return Number(((funcScore * 0.6 + parallelScore * 0.4)).toFixed(4));
  }

  /** ZPE cost modifier: lower symbolic confidence → higher cost. */
  private computeZpeCost(symbolicConfidence: number): number {
    // Symbolic content always gets a base modifier > 1 (it's non-empirical)
    return Number((1.5 + (1 - symbolicConfidence) * 1.5).toFixed(4));
  }

  /** Assign the most appropriate badge. */
  private assignBadge(
    archetypes: ArchetypeDetection[],
    motifs: MotifDetection[],
    parallels: CrossCulturalParallel[],
  ): SymbolicBadge {
    if (parallels.length > 2) return 'Cross-Cultural Motif';
    if (motifs.some((m) => ['creation_cycle', 'hero_journey', 'descent_return', 'death_rebirth'].includes(m.motif))) {
      return 'Symbolic Narrative Structure';
    }
    if (archetypes.length > 2) return 'Archetypal Pattern';
    if (motifs.some((m) => ['cosmic_duality', 'axis_mundi', 'eternal_return'].includes(m.motif))) {
      return 'Metaphysical Framework';
    }
    if (motifs.length > 0) return 'Cultural Motif';
    if (archetypes.length > 0) return 'Archetypal Pattern';
    return 'Symbolic Narrative';
  }

  // ========================================================================
  // Internals — Summary & Map
  // ========================================================================

  /** Generate interpretive notes for transparency. */
  private generateNotes(
    archetypes: ArchetypeDetection[],
    motifs: MotifDetection[],
    functions: CulturalFunction[],
    origin: CulturalOriginProfile,
  ): string[] {
    const notes: string[] = [];

    notes.push(`Interpreted within ${origin.tradition} cultural framework`);

    if (archetypes.length > 0) {
      notes.push(`Detected archetypes: ${archetypes.map((a) => a.role).join(', ')}`);
    }
    if (motifs.length > 0) {
      notes.push(`Detected motifs: ${motifs.map((m) => m.motif).join(', ')}`);
    }
    if (functions.length > 0) {
      notes.push(`Cultural functions: ${functions.join(', ')}`);
    }

    notes.push('Symbolic interpretation only; not empirical evidence');

    return notes;
  }

  /** Build a structured summary for the interpretation. */
  private buildSummary(item: SymbolicItem): SymbolicSummary {
    return {
      culturalOrigin: item.culturalOrigin,
      symbolicStructure: item.motifs,
      archetypeRoles: item.archetypes,
      culturalFunctions: item.culturalFunctions,
      interpretiveNotes: item.interpretiveNotes,
      crossCulturalParallels: item.crossCulturalParallels,
      methodologicalConfidence: item.symbolicConfidence,
    };
  }

  /** Build visual map data for dashboard rendering. */
  private buildMap(item: SymbolicItem): SymbolicMap {
    const nodes: SymbolicMapNode[] = [];
    const edges: SymbolicMapEdge[] = [];
    const centerId = `node-origin-${item.id}`;

    // Central origin node
    nodes.push({
      id: centerId,
      label: item.culturalOrigin.tradition,
      kind: 'origin',
      confidence: 1,
      metadata: { region: item.culturalOrigin.region, era: item.culturalOrigin.era },
    });

    // Archetype nodes
    for (const a of item.archetypes) {
      const nodeId = `node-arch-${a.role}-${item.id}`;
      nodes.push({ id: nodeId, label: a.role, kind: 'archetype', confidence: a.confidence, metadata: { evidence: a.evidence } });
      edges.push({ from: centerId, to: nodeId, relation: 'contains_archetype', strength: a.confidence >= 0.7 ? 'strong' : 'moderate' });
    }

    // Motif nodes
    for (const m of item.motifs) {
      const nodeId = `node-motif-${m.motif}-${item.id}`;
      nodes.push({ id: nodeId, label: m.motif, kind: 'motif', confidence: m.confidence, metadata: { evidence: m.evidence } });
      edges.push({ from: centerId, to: nodeId, relation: 'contains_motif', strength: m.confidence >= 0.7 ? 'strong' : 'moderate' });
    }

    // Cultural function nodes
    for (const fn of item.culturalFunctions) {
      const nodeId = `node-fn-${fn}-${item.id}`;
      nodes.push({ id: nodeId, label: fn, kind: 'function', confidence: 0.8, metadata: {} });
      edges.push({ from: centerId, to: nodeId, relation: 'serves_function', strength: 'moderate' });
    }

    // Cross-cultural parallel nodes
    for (const p of item.crossCulturalParallels) {
      const nodeId = `node-par-${p.id}`;
      nodes.push({
        id: nodeId,
        label: `${p.parallelOrigin}: ${String(p.sharedPattern)}`,
        kind: 'parallel',
        confidence: p.confidence,
        metadata: { divergence: p.divergenceNotes },
      });
      edges.push({ from: centerId, to: nodeId, relation: 'cross_cultural_parallel', strength: p.strength });
    }

    return { nodes, edges };
  }

  /** Build a human-readable trace. */
  private buildTrace(item: SymbolicItem): string[] {
    return [
      `[SIL] Item ${item.id} from source ${item.sourceId}`,
      `  Tradition: ${item.culturalOrigin.tradition} (${item.culturalOrigin.region}, ${item.culturalOrigin.era})`,
      `  Badge: ${item.badge}`,
      `  Archetypes: ${this.formatArchetypes(item.archetypes)}`,
      `  Motifs: ${this.formatMotifs(item.motifs)}`,
      `  Functions: ${item.culturalFunctions.join(', ') || 'none'}`,
      `  Parallels: ${item.crossCulturalParallels.length} (${item.crossCulturalParallels.filter((p) => p.strength === 'strong').length} strong)`,
      `  Symbolic confidence: ${item.symbolicConfidence}`,
      `  Cultural relevance: ${item.culturalRelevance}`,
      `  ZPE cost modifier: ${item.zpeCostModifier}`,
    ];
  }

  /** Format archetype list for trace output. */
  private formatArchetypes(archetypes: ArchetypeDetection[]): string {
    if (archetypes.length === 0) return 'none';
    return archetypes.map((a) => a.role + '(' + a.confidence.toFixed(2) + ')').join(', ');
  }

  /** Format motif list for trace output. */
  private formatMotifs(motifs: MotifDetection[]): string {
    if (motifs.length === 0) return 'none';
    return motifs.map((m) => m.motif + '(' + m.confidence.toFixed(2) + ')').join(', ');
  }
}
