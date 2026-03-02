/**
 * Search Intelligence Engine
 *
 * A multi‑vector ranking and retrieval system inspired by modern search
 * architecture. Documents are behaviour‑weighted entities scored across
 * nine signal families, re‑ranked by a stack of composable twiddlers.
 *
 * Signal families (each stored as a vector per document):
 *   1. Semantic     — embedding similarity to query
 *   2. Behavioral   — engagement, satisfaction, pogo‑stick, refinement
 *   3. Authority    — site‑level & page‑level trust
 *   4. Freshness    — recency, update frequency, query freshness need
 *   5. Popularity   — global usage, revisit rate, bookmark/save rate
 *   6. Quality      — originality, duplication penalty, thin‑content penalty
 *   7. Safety       — ISK fraud/manipulation/ethics scores
 *   8. Symbolic     — archetype / motif / cultural depth
 *   9. Epistemic    — reliability, worthiness, source tier
 *
 * Twiddler stack (modular re‑rankers, applied in order):
 *   BaseRanker       → semantic relevance + basic quality
 *   FreshnessTwiddler→ boost recent for time‑sensitive queries
 *   AuthorityTwiddler→ adjust by site/page authority
 *   SafetyTwiddler   → downrank / exclude risky content
 *   DiversityTwiddler→ suppress near‑duplicates & echo chambers
 *
 * Adaptive behaviour (slow, stable, moral‑anchored):
 *   Adapts: signal weights, freshness sensitivity, diversity threshold
 *   NEVER adapts: safety floor, epistemic minimum, ethical constraints
 *
 * Cross‑subsystem integration:
 *   IntegritySafetyKernel  → safety vector
 *   EpistemicIntegrity      → epistemic vector
 *   SymbolicInterpretation  → symbolic vector
 *   CulturalHistorical      → cultural context factor
 *   UnifiedCognitiveField   → entity graph routing
 *   ZPE Routing              → path selection from ranking output
 *   Dashboard                → search analytics panel
 */

// ---------------------------------------------------------------------------
// Literal Types & Enums
// ---------------------------------------------------------------------------

/** Which signal family a feature belongs to. */
export type SignalFamily =
  | 'semantic'
  | 'behavioral'
  | 'authority'
  | 'freshness'
  | 'popularity'
  | 'quality'
  | 'safety'
  | 'symbolic'
  | 'epistemic';

/** Named twiddler stage. */
export type TwiddlerStage =
  | 'base'
  | 'freshness'
  | 'authority'
  | 'safety'
  | 'diversity';

/** Overall engine status. */
export type SearchEngineStatus = 'READY' | 'DEGRADED' | 'OFFLINE';

// ---------------------------------------------------------------------------
// Interfaces — Document Vectors
// ---------------------------------------------------------------------------

/** Behavioral signals for a document. */
export interface BehavioralVector {
  engagementScore: number;         // 0–1  (dwell time, scroll depth, return rate)
  satisfactionLikelihood: number;  // 0–1  (user stopped searching after this)
  refinementPenalty: number;       // 0–1  (user rewrote query immediately)
  pogoStickPenalty: number;        // 0–1  (fast back‑button)
  bounceRate: number;              // 0–1
}

/** Authority signals (site + page). */
export interface AuthorityVector {
  siteAuthority: number;           // 0–1
  pageAuthority: number;           // 0–1
  domainReputationScore: number;   // 0–1
  historicalReliability: number;   // 0–1
  topicSpecialization: number;     // 0–1
  linkGraphQuality: number;        // 0–1
  consistencyOverTime: number;     // 0–1
  inboundLinkQuality: number;      // 0–1  (quality‑weighted)
}

/** Freshness signals. */
export interface FreshnessVector {
  recencyScore: number;            // 0–1  (time since last update)
  updateFrequencyScore: number;    // 0–1  (how often site updates)
  publishTimestamp: number;        // epoch ms
  lastUpdateTimestamp: number;     // epoch ms
}

/** Popularity signals. */
export interface PopularityVector {
  globalPopularityScore: number;   // 0–1  (successful session appearances)
  revisitRate: number;             // 0–1  (how often users return)
  bookmarkSaveRate: number;        // 0–1  (user‑level trust)
}

/** Content quality signals. */
export interface QualityVector {
  originalityScore: number;        // 0–1  (semantic uniqueness)
  duplicationPenalty: number;      // 0–1  (near‑duplicate)
  thinContentPenalty: number;      // 0–1  (low information density)
}

/** Safety/trust signals (from ISK). */
export interface SafetyVector {
  fraudRiskScore: number;          // 0–1
  manipulationPatternScore: number; // 0–1
  safetyViolationFlags: number;    // count
  ethicalIntegrityScore: number;   // 0–1  (higher = better)
}

/** Symbolic signals (from Symbolic Interpretation Layer). */
export interface SymbolicVector {
  archetypeDepth: number;          // 0–1
  motifDensity: number;            // 0–1
  culturalRelevance: number;       // 0–1
}

/** Epistemic signals (from Epistemic Integrity Layer). */
export interface EpistemicVector {
  reliabilityScore: number;        // 0–1
  worthinessScore: number;         // 0–1
  sourceTier: number;              // 1–4  (verification tier)
  triangulationStrength: number;   // 0–1
}

/** Entity reference in the entity graph. */
export interface EntityRef {
  id: string;
  kind: 'person' | 'place' | 'concept' | 'archetype' | 'event' | 'organization';
  name: string;
  confidence: number;
}

/** A document in the search index. */
export interface IndexedDocument {
  id: string;
  url: string;
  title: string;
  snippet: string;
  contentVector: number[];         // semantic embedding (placeholder)
  behavioral: BehavioralVector;
  authority: AuthorityVector;
  freshness: FreshnessVector;
  popularity: PopularityVector;
  quality: QualityVector;
  safety: SafetyVector;
  symbolic: SymbolicVector;
  epistemic: EpistemicVector;
  entities: EntityRef[];
  indexedAt: string;               // ISO timestamp
}

/** Query context for ranking. */
export interface SearchQuery {
  text: string;
  queryFreshnessNeed: number;      // 0–1  (inferred from query type)
  userTopicHistory: string[];
  preferredDomains: string[];
  languagePreference: string;
  maxResults: number;
}

/** A single ranked result. */
export interface RankedResult {
  document: IndexedDocument;
  finalScore: number;
  signalBreakdown: Record<SignalFamily, number>;
  twiddlerTrace: Array<{ stage: TwiddlerStage; adjustment: number }>;
}

/** Search response. */
export interface SearchResponse {
  id: string;
  query: string;
  results: RankedResult[];
  totalIndexed: number;
  searchTimeMs: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Interfaces — Twiddler
// ---------------------------------------------------------------------------

/** A twiddler is a small composable re‑ranking function. */
export interface Twiddler {
  stage: TwiddlerStage;
  /** Re‑rank the results in place. Returns the adjusted list. */
  apply(results: RankedResult[], query: SearchQuery): RankedResult[];
}

// ---------------------------------------------------------------------------
// Interfaces — Adaptive Weights & Events
// ---------------------------------------------------------------------------

/** Signal weights used in the base ranker. */
export interface SignalWeights {
  semantic: number;
  behavioral: number;
  authority: number;
  freshness: number;
  popularity: number;
  quality: number;
  safety: number;
  symbolic: number;
  epistemic: number;
}

/** Per‑search event for the dashboard. */
export interface SearchEvent {
  id: string;
  query: string;
  resultCount: number;
  topScore: number;
  searchTimeMs: number;
  timestamp: string;
}

/** Aggregate summary for getSummary(). */
export interface SearchEngineSummary {
  totalDocuments: number;
  totalSearches: number;
  avgSearchTimeMs: number;
  avgTopScore: number;
  signalWeights: SignalWeights;
  recentEvents: SearchEvent[];
  status: SearchEngineStatus;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_INDEX = 500_000;
const MAX_EVENTS = 50_000;

/** Default signal weights — tuned for balanced ranking. */
const DEFAULT_WEIGHTS: SignalWeights = {
  semantic: 0.25,
  behavioral: 0.12,
  authority: 0.15,
  freshness: 0.08,
  popularity: 0.08,
  quality: 0.1,
  safety: 0.07,
  symbolic: 0.05,
  epistemic: 0.1,
};

/** Safety floor: safety weight never drops below this. */
const SAFETY_WEIGHT_FLOOR = 0.05;

/** Epistemic floor: epistemic weight never drops below this. */
const EPISTEMIC_WEIGHT_FLOOR = 0.05;

const LEARNING_RATE = 0.01;
const MIN_REINFORCEMENTS = 25;
const MAX_WEIGHT_DRIFT = 0.15;

// ---------------------------------------------------------------------------
// Built‑in Twiddlers
// ---------------------------------------------------------------------------

/** Freshness twiddler — boosts recent content for time‑sensitive queries. */
function freshnessTwiddler(results: RankedResult[], query: SearchQuery): RankedResult[] {
  if (query.queryFreshnessNeed < 0.1) return results;
  const boost = query.queryFreshnessNeed;
  for (const r of results) {
    const age = r.document.freshness.recencyScore;
    const adjustment = boost * age * 0.15;
    r.finalScore += adjustment;
    r.twiddlerTrace.push({ stage: 'freshness', adjustment });
  }
  return results;
}

/** Authority twiddler — adjusts by combined site/page authority. */
function authorityTwiddler(results: RankedResult[]): RankedResult[] {
  for (const r of results) {
    const auth = (r.document.authority.siteAuthority + r.document.authority.pageAuthority) / 2;
    const adjustment = (auth - 0.5) * 0.1;
    r.finalScore += adjustment;
    r.twiddlerTrace.push({ stage: 'authority', adjustment });
  }
  return results;
}

/** Safety twiddler — downranks or excludes risky content. */
function safetyTwiddler(results: RankedResult[]): RankedResult[] {
  return results
    .filter((r) => r.document.safety.safetyViolationFlags === 0)
    .map((r) => {
      const risk = r.document.safety.fraudRiskScore + r.document.safety.manipulationPatternScore;
      const adjustment = -risk * 0.2;
      r.finalScore += adjustment;
      r.twiddlerTrace.push({ stage: 'safety', adjustment });
      return r;
    });
}

/** Diversity twiddler — suppresses near‑duplicates. */
function diversityTwiddler(results: RankedResult[]): RankedResult[] {
  const seen = new Set<string>();
  const filtered: RankedResult[] = [];
  for (const r of results) {
    const domain = extractDomain(r.document.url);
    const key = `${domain}::${r.document.title.slice(0, 40).toLowerCase()}`;
    if (seen.has(key)) {
      r.finalScore *= 0.5;
      r.twiddlerTrace.push({ stage: 'diversity', adjustment: -r.finalScore * 0.5 });
    } else {
      r.twiddlerTrace.push({ stage: 'diversity', adjustment: 0 });
    }
    seen.add(key);
    filtered.push(r);
  }
  return filtered;
}

function extractDomain(url: string): string {
  const match = /^(?:https?:\/\/)?([^/]+)/.exec(url);
  return match ? match[1] : url;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SearchIntelligenceEngine {
  private readonly index: Map<string, IndexedDocument> = new Map();
  private readonly events: SearchEvent[] = [];
  private listeners: Array<(event: SearchEvent) => void> = [];

  // Running stats
  private totalSearches = 0;
  private searchTimeMsSum = 0;
  private topScoreSum = 0;

  // Signal weights (adaptive)
  private weights: SignalWeights = { ...DEFAULT_WEIGHTS };
  private reinforcementCount = 0;

  // Twiddler stack
  private readonly twiddlers: Twiddler[];

  constructor() {
    this.twiddlers = [
      { stage: 'freshness', apply: freshnessTwiddler },
      { stage: 'authority', apply: (r) => authorityTwiddler(r) },
      { stage: 'safety', apply: (r) => safetyTwiddler(r) },
      { stage: 'diversity', apply: (r) => diversityTwiddler(r) },
    ];
  }

  // ========================================================================
  // Indexing
  // ========================================================================

  /** Add or update a document in the index. */
  indexDocument(doc: IndexedDocument): void {
    this.index.set(doc.id, doc);
    if (this.index.size > MAX_INDEX) {
      // Evict oldest by indexedAt
      const oldest = this.findOldestDocument();
      if (oldest) this.index.delete(oldest);
    }
  }

  /** Bulk index. */
  indexDocuments(docs: IndexedDocument[]): void {
    for (const doc of docs) this.indexDocument(doc);
  }

  /** Remove a document. */
  removeDocument(id: string): boolean {
    return this.index.delete(id);
  }

  /** Get a document by ID. */
  getDocument(id: string): IndexedDocument | undefined {
    return this.index.get(id);
  }

  /** Total indexed documents. */
  get indexSize(): number {
    return this.index.size;
  }

  // ========================================================================
  // Search & Ranking Pipeline
  // ========================================================================

  /**
   * Execute a search query through the full ranking pipeline:
   * 1. Base ranker (multi‑vector scoring)
   * 2. Twiddler stack (modular re‑ranking)
   * 3. Final sort & trim
   */
  search(query: SearchQuery): SearchResponse {
    const start = Date.now();

    // 1. Base ranking — score every document
    let results = this.baseRank(query);

    // 2. Twiddler stack
    for (const twiddler of this.twiddlers) {
      results = twiddler.apply(results, query);
    }

    // 3. Sort descending by finalScore, trim
    results.sort((a, b) => b.finalScore - a.finalScore);
    results = results.slice(0, query.maxResults);

    const elapsed = Date.now() - start;
    const topScore = results.length > 0 ? results[0].finalScore : 0;

    // Store event
    this.recordSearchEvent(query.text, results.length, topScore, elapsed);

    return {
      id: `srch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      query: query.text,
      results,
      totalIndexed: this.index.size,
      searchTimeMs: elapsed,
      timestamp: new Date().toISOString(),
    };
  }

  // ========================================================================
  // Behavioral Feedback
  // ========================================================================

  /**
   * Record a user behavior signal against a document.
   * Used to update behavioral vectors over time.
   */
  recordBehavior(
    docId: string,
    signal: Partial<BehavioralVector>,
  ): void {
    const doc = this.index.get(docId);
    if (!doc) return;

    // Exponential moving average for each provided signal
    const alpha = 0.1;
    if (signal.engagementScore !== undefined) {
      doc.behavioral.engagementScore = this.ema(doc.behavioral.engagementScore, signal.engagementScore, alpha);
    }
    if (signal.satisfactionLikelihood !== undefined) {
      doc.behavioral.satisfactionLikelihood = this.ema(doc.behavioral.satisfactionLikelihood, signal.satisfactionLikelihood, alpha);
    }
    if (signal.refinementPenalty !== undefined) {
      doc.behavioral.refinementPenalty = this.ema(doc.behavioral.refinementPenalty, signal.refinementPenalty, alpha);
    }
    if (signal.pogoStickPenalty !== undefined) {
      doc.behavioral.pogoStickPenalty = this.ema(doc.behavioral.pogoStickPenalty, signal.pogoStickPenalty, alpha);
    }
    if (signal.bounceRate !== undefined) {
      doc.behavioral.bounceRate = this.ema(doc.behavioral.bounceRate, signal.bounceRate, alpha);
    }
  }

  /**
   * Record a popularity observation for a document.
   */
  recordPopularity(
    docId: string,
    signal: Partial<PopularityVector>,
  ): void {
    const doc = this.index.get(docId);
    if (!doc) return;
    const alpha = 0.1;
    if (signal.globalPopularityScore !== undefined) {
      doc.popularity.globalPopularityScore = this.ema(doc.popularity.globalPopularityScore, signal.globalPopularityScore, alpha);
    }
    if (signal.revisitRate !== undefined) {
      doc.popularity.revisitRate = this.ema(doc.popularity.revisitRate, signal.revisitRate, alpha);
    }
    if (signal.bookmarkSaveRate !== undefined) {
      doc.popularity.bookmarkSaveRate = this.ema(doc.popularity.bookmarkSaveRate, signal.bookmarkSaveRate, alpha);
    }
  }

  // ========================================================================
  // Adaptive Weight Tuning
  // ========================================================================

  /**
   * Reinforce a signal weight (slow, stable adaptation).
   * Safety and epistemic floors are enforced.
   */
  reinforceWeight(family: SignalFamily, delta: number): void {
    this.reinforcementCount += 1;
    if (this.reinforcementCount < MIN_REINFORCEMENTS) return;

    const baseline = DEFAULT_WEIGHTS[family];
    const current = this.weights[family];
    const adjusted = current + delta * LEARNING_RATE;
    const clamped = Math.max(
      baseline - MAX_WEIGHT_DRIFT,
      Math.min(baseline + MAX_WEIGHT_DRIFT, adjusted),
    );

    // Enforce floors
    if (family === 'safety') {
      this.weights[family] = Math.max(SAFETY_WEIGHT_FLOOR, Number(clamped.toFixed(4)));
    } else if (family === 'epistemic') {
      this.weights[family] = Math.max(EPISTEMIC_WEIGHT_FLOOR, Number(clamped.toFixed(4)));
    } else {
      this.weights[family] = Number(clamped.toFixed(4));
    }
  }

  getWeights(): Readonly<SignalWeights> {
    return { ...this.weights };
  }

  // ========================================================================
  // Twiddler Management
  // ========================================================================

  /** Add a custom twiddler to the stack. */
  addTwiddler(twiddler: Twiddler): void {
    this.twiddlers.push(twiddler);
  }

  /** Get the current twiddler stack names. */
  getTwiddlerStack(): TwiddlerStage[] {
    return this.twiddlers.map((t) => t.stage);
  }

  // ========================================================================
  // Entity Queries
  // ========================================================================

  /** Find documents containing a specific entity. */
  findByEntity(entityId: string): IndexedDocument[] {
    const results: IndexedDocument[] = [];
    for (const doc of this.index.values()) {
      if (doc.entities.some((e) => e.id === entityId)) {
        results.push(doc);
      }
    }
    return results;
  }

  /** Find documents by entity kind. */
  findByEntityKind(kind: EntityRef['kind']): IndexedDocument[] {
    const results: IndexedDocument[] = [];
    for (const doc of this.index.values()) {
      if (doc.entities.some((e) => e.kind === kind)) {
        results.push(doc);
      }
    }
    return results;
  }

  // ========================================================================
  // Events & Listeners
  // ========================================================================

  on(listener: (event: SearchEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getRecentEvents(limit = 50): SearchEvent[] {
    return this.events.slice(-limit);
  }

  // ========================================================================
  // Summary
  // ========================================================================

  getSummary(): SearchEngineSummary {
    return {
      totalDocuments: this.index.size,
      totalSearches: this.totalSearches,
      avgSearchTimeMs: this.totalSearches > 0
        ? Number((this.searchTimeMsSum / this.totalSearches).toFixed(2))
        : 0,
      avgTopScore: this.totalSearches > 0
        ? Number((this.topScoreSum / this.totalSearches).toFixed(4))
        : 0,
      signalWeights: { ...this.weights },
      recentEvents: this.events.slice(-10),
      status: this.getStatus(),
    };
  }

  // ========================================================================
  // Internals — Base Ranker
  // ========================================================================

  /** Score every document against the query using multi‑vector weights. */
  private baseRank(query: SearchQuery): RankedResult[] {
    const results: RankedResult[] = [];

    for (const doc of this.index.values()) {
      const breakdown = this.computeSignalBreakdown(doc, query);
      const finalScore = this.combineSignals(breakdown);

      results.push({
        document: doc,
        finalScore,
        signalBreakdown: breakdown,
        twiddlerTrace: [{ stage: 'base', adjustment: finalScore }],
      });
    }

    return results;
  }

  /** Compute per‑family score for a document. */
  private computeSignalBreakdown(
    doc: IndexedDocument,
    query: SearchQuery,
  ): Record<SignalFamily, number> {
    return {
      semantic: this.scoreSemanticRelevance(doc, query),
      behavioral: this.scoreBehavioral(doc),
      authority: this.scoreAuthority(doc),
      freshness: this.scoreFreshness(doc, query),
      popularity: this.scorePopularity(doc),
      quality: this.scoreQuality(doc),
      safety: this.scoreSafety(doc),
      symbolic: this.scoreSymbolic(doc),
      epistemic: this.scoreEpistemic(doc),
    };
  }

  /** Weighted combination of signal scores. */
  private combineSignals(breakdown: Record<SignalFamily, number>): number {
    let total = 0;
    const families = Object.keys(breakdown) as SignalFamily[];
    for (const family of families) {
      total += breakdown[family] * this.weights[family];
    }
    return Number(Math.max(0, Math.min(1, total)).toFixed(4));
  }

  // ========================================================================
  // Internals — Individual Signal Scores
  // ========================================================================

  /** Semantic relevance: token overlap as a proxy (real: embedding cosine). */
  private scoreSemanticRelevance(doc: IndexedDocument, query: SearchQuery): number {
    const queryTokens = new Set(query.text.toLowerCase().split(/\s+/));
    const titleTokens = doc.title.toLowerCase().split(/\s+/);
    const snippetTokens = doc.snippet.toLowerCase().split(/\s+/);
    const allTokens = [...titleTokens, ...snippetTokens];

    let matches = 0;
    for (const token of allTokens) {
      if (queryTokens.has(token)) matches += 1;
    }

    const score = queryTokens.size > 0
      ? matches / (queryTokens.size + allTokens.length - matches)
      : 0;
    return Number(Math.min(1, score * 3).toFixed(4));
  }

  /** Behavioral score: high engagement + satisfaction, penalize bounces. */
  private scoreBehavioral(doc: IndexedDocument): number {
    const b = doc.behavioral;
    const positive = b.engagementScore * 0.4 + b.satisfactionLikelihood * 0.4;
    const negative = b.refinementPenalty * 0.1 + b.pogoStickPenalty * 0.05 + b.bounceRate * 0.05;
    return Number(Math.max(0, Math.min(1, positive - negative)).toFixed(4));
  }

  /** Authority score: weighted average of all authority signals. */
  private scoreAuthority(doc: IndexedDocument): number {
    const a = doc.authority;
    const score =
      a.siteAuthority * 0.2 +
      a.pageAuthority * 0.2 +
      a.domainReputationScore * 0.15 +
      a.historicalReliability * 0.1 +
      a.topicSpecialization * 0.1 +
      a.linkGraphQuality * 0.1 +
      a.consistencyOverTime * 0.05 +
      a.inboundLinkQuality * 0.1;
    return Number(Math.min(1, score).toFixed(4));
  }

  /** Freshness score: query‑dependent. */
  private scoreFreshness(doc: IndexedDocument, query: SearchQuery): number {
    const f = doc.freshness;
    const base = f.recencyScore * 0.6 + f.updateFrequencyScore * 0.4;
    // Amplify if query needs freshness
    const amplified = base * (1 + query.queryFreshnessNeed * 0.5);
    return Number(Math.min(1, amplified).toFixed(4));
  }

  /** Popularity score: weighted average. */
  private scorePopularity(doc: IndexedDocument): number {
    const p = doc.popularity;
    const score = p.globalPopularityScore * 0.5 + p.revisitRate * 0.3 + p.bookmarkSaveRate * 0.2;
    return Number(Math.min(1, score).toFixed(4));
  }

  /** Quality score: originality minus penalties. */
  private scoreQuality(doc: IndexedDocument): number {
    const q = doc.quality;
    const score = q.originalityScore - q.duplicationPenalty * 0.5 - q.thinContentPenalty * 0.3;
    return Number(Math.max(0, Math.min(1, score)).toFixed(4));
  }

  /** Safety score: low risk + high ethical integrity → high score. */
  private scoreSafety(doc: IndexedDocument): number {
    const s = doc.safety;
    const risk = s.fraudRiskScore * 0.4 + s.manipulationPatternScore * 0.3;
    const integrity = s.ethicalIntegrityScore * 0.3;
    return Number(Math.max(0, Math.min(1, integrity + (1 - risk) * 0.7)).toFixed(4));
  }

  /** Symbolic score: depth + density + relevance. */
  private scoreSymbolic(doc: IndexedDocument): number {
    const sym = doc.symbolic;
    const score = sym.archetypeDepth * 0.4 + sym.motifDensity * 0.3 + sym.culturalRelevance * 0.3;
    return Number(Math.min(1, score).toFixed(4));
  }

  /** Epistemic score: reliability + worthiness + tier + triangulation. */
  private scoreEpistemic(doc: IndexedDocument): number {
    const e = doc.epistemic;
    const tierNorm = 1 - (e.sourceTier - 1) / 3; // tier 1 = 1, tier 4 = 0
    const score = e.reliabilityScore * 0.3 + e.worthinessScore * 0.3 + tierNorm * 0.2 + e.triangulationStrength * 0.2;
    return Number(Math.min(1, score).toFixed(4));
  }

  // ========================================================================
  // Internals — Helpers
  // ========================================================================

  /** Exponential moving average. */
  private ema(old: number, incoming: number, alpha: number): number {
    return Number((old * (1 - alpha) + incoming * alpha).toFixed(4));
  }

  /** Find the oldest document ID for eviction. */
  private findOldestDocument(): string | undefined {
    let oldestId: string | undefined;
    let oldestTime = Infinity;
    for (const [id, doc] of this.index) {
      const t = new Date(doc.indexedAt).getTime();
      if (t < oldestTime) {
        oldestTime = t;
        oldestId = id;
      }
    }
    return oldestId;
  }

  /** Record a search event. */
  private recordSearchEvent(
    query: string,
    resultCount: number,
    topScore: number,
    searchTimeMs: number,
  ): void {
    this.totalSearches += 1;
    this.searchTimeMsSum += searchTimeMs;
    this.topScoreSum += topScore;

    const event: SearchEvent = {
      id: `se-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      query,
      resultCount,
      topScore,
      searchTimeMs,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);
    if (this.events.length > MAX_EVENTS) {
      this.events.splice(0, this.events.length - MAX_EVENTS);
    }

    for (const fn of this.listeners) fn(event);
  }

  /** Engine status. */
  private getStatus(): SearchEngineStatus {
    if (this.index.size === 0) return 'OFFLINE';
    if (this.index.size < 10) return 'DEGRADED';
    return 'READY';
  }
}
