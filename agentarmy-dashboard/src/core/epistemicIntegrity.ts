/**
 * Epistemic Integrity Layer (EIL)
 *
 * The immune system for information quality. Evaluates every piece of
 * information the OS encounters — user input, tool output, external data,
 * agent‑generated content, or retrieved knowledge — and assigns reliability
 * and worthiness scores before it can influence missions or decisions.
 *
 * Cross‑cutting integration points:
 *   SemanticCompression  → ingest path (tagged embeddings)
 *   CrossMissionIntel    → pattern validation, failure cross‑check
 *   UnifiedCognitiveField → confidence signals, coherence monitoring
 *   ConstitutionalGrid   → epistemic safety rules
 *   AutonomousEconomy    → verification cost, reliability rewards/penalties
 *   CivilizationIntel    → strategic signals for epistemic anomalies
 *   ZPE routing           → confidence‑weighted path cost
 *   MissionCompiler       → premise rejection, sub‑mission insertion
 */

// ---------------------------------------------------------------------------
// Enums & Literal Types
// ---------------------------------------------------------------------------

/** Verification tier — adaptive, not uniform. */
export type VerificationTier =
  | 'tier1_fast'       // High‑reliability, high‑worthiness → minimal check
  | 'tier2_deprioritize' // High‑reliability, low‑worthiness → skip unless asked
  | 'tier3_deep'       // Low‑reliability, high‑worthiness → full verification
  | 'tier4_discard';   // Low‑reliability, low‑worthiness → auto‑discard

export type BiasKind =
  | 'emotional'
  | 'political'
  | 'commercial'
  | 'structural'
  | 'temporal'
  | 'confirmation'
  | 'authority'
  | 'none';

export type SourceCategory =
  | 'user_input'
  | 'tool_output'
  | 'external_api'
  | 'agent_generated'
  | 'retrieved_knowledge'
  | 'cross_mission'
  | 'system_internal';

export type TrendDirection = 'improving' | 'stable' | 'degrading';

// ---------------------------------------------------------------------------
// Core Interfaces
// ---------------------------------------------------------------------------

/** Tracked information source with reliability history. */
export interface EpistemicSource {
  id: string;
  name: string;
  category: SourceCategory;
  /** Rolling reliability score 0–1 (higher = more trustworthy). */
  reliability: number;
  /** Number of claims evaluated from this source. */
  claimsEvaluated: number;
  /** Number of claims that were later validated. */
  claimsValidated: number;
  /** Detected bias profile. */
  biasProfile: BiasKind[];
  /** ISO timestamp of the last evaluation. */
  lastEvaluatedAt: string;
  /** ISO timestamp when this source was first registered. */
  registeredAt: string;
}

/** A single claim / fact / datum entering the OS. */
export interface EpistemicClaim {
  id: string;
  sourceId: string;
  content: string;
  domain: string;
  /** Reliability score 0–1 at evaluation time. */
  reliability: number;
  /** Worthiness score 0–1 at evaluation time. */
  worthiness: number;
  /** Composite confidence 0–1 (weighted blend of reliability × worthiness). */
  confidence: number;
  /** Verification tier assigned after scoring. */
  tier: VerificationTier;
  /** Detected biases. */
  biases: BiasKind[];
  /** ISO timestamp of creation/ingestion. */
  createdAt: string;
  /** ISO timestamp of last re‑evaluation (if any). */
  revalidatedAt: string | null;
  /** Optional triangulation evidence. */
  triangulation: TriangulationResult | null;
  /** Whether the claim passed constitutional enforcement. */
  constitutionallyCleared: boolean;
  /** Free‑form metadata for integration layers. */
  metadata: Record<string, unknown>;
}

/** Result of cross‑source triangulation. */
export interface TriangulationResult {
  /** Number of independent sources that converge. */
  convergingSourceCount: number;
  /** Number of sources that conflict. */
  conflictingSourceCount: number;
  /** Combined agreement score 0–1. */
  agreementScore: number;
  /** IDs of confirming claims. */
  confirmingClaimIds: string[];
  /** IDs of conflicting claims. */
  conflictingClaimIds: string[];
}

/** Worthiness factors (all 0–1). */
export interface WorthinessFactors {
  novelty: number;
  signalToNoise: number;
  missionRelevance: number;
  actionability: number;
  depth: number;
  nonRedundancy: number;
  goalAlignment: number;
  outcomeImpact: number;
}

/** Reliability factors (all 0–1). */
export interface ReliabilityFactors {
  sourceAuthority: number;
  historicalAccuracy: number;
  sourceIndependence: number;
  internalConsistency: number;
  temporalFreshness: number;
  crossMissionValidation: number;
  crossAgentAgreement: number;
  constitutionalAlignment: number;
}

/** Full evaluation result returned by evaluate(). */
export interface EpistemicEvaluation {
  claim: EpistemicClaim;
  worthinessFactors: WorthinessFactors;
  reliabilityFactors: ReliabilityFactors;
  tier: VerificationTier;
  /** Whether the claim should enter reasoning (tier1/tier3 pass; tier2/tier4 do not). */
  admittedToReasoning: boolean;
  /** ZPE cost modifier: >1 means more expensive path routing. */
  zpeCostModifier: number;
  /** Human‑readable reasoning trace. */
  epistemicTrace: string[];
}

/** Aggregate health of the epistemic layer. */
export interface EpistemicHealthSummary {
  totalSources: number;
  totalClaims: number;
  avgReliability: number;
  avgWorthiness: number;
  avgConfidence: number;
  tierDistribution: Record<VerificationTier, number>;
  biasDistribution: Partial<Record<BiasKind, number>>;
  triangulationRate: number;
  discardRate: number;
  admissionRate: number;
  topReliableSources: Array<{ id: string; name: string; reliability: number }>;
  topUnreliableSources: Array<{ id: string; name: string; reliability: number }>;
  recentAnomalies: EpistemicAnomaly[];
}

/** An epistemic anomaly — detected when patterns suggest integrity risk. */
export interface EpistemicAnomaly {
  id: string;
  kind: 'reliability_drop' | 'bias_surge' | 'conflict_spike' | 'stale_data' | 'hallucination_risk';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIds: string[];
  claimIds: string[];
  detectedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CLAIMS = 100_000;
const MAX_ANOMALIES = 10_000;
const RELIABILITY_WEIGHT = 0.55;
const WORTHINESS_WEIGHT = 0.45;
const ADMISSION_CONFIDENCE_THRESHOLD = 0.35;
const STALE_HOURS = 72;

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class EpistemicIntegrityLayer {
  private readonly sources = new Map<string, EpistemicSource>();
  private readonly claims: EpistemicClaim[] = [];
  private readonly anomalies: EpistemicAnomaly[] = [];
  private listeners: Array<(evaluation: EpistemicEvaluation) => void> = [];

  // ========================================================================
  // Source Management
  // ========================================================================

  /** Register or update an information source. */
  registerSource(
    id: string,
    name: string,
    category: SourceCategory,
    initialReliability = 0.5,
  ): EpistemicSource {
    const existing = this.sources.get(id);
    if (existing) {
      existing.name = name;
      existing.category = category;
      return existing;
    }
    const source: EpistemicSource = {
      id,
      name,
      category,
      reliability: Math.max(0, Math.min(1, initialReliability)),
      claimsEvaluated: 0,
      claimsValidated: 0,
      biasProfile: [],
      lastEvaluatedAt: new Date().toISOString(),
      registeredAt: new Date().toISOString(),
    };
    this.sources.set(id, source);
    return source;
  }

  getSource(id: string): EpistemicSource | null {
    return this.sources.get(id) ?? null;
  }

  getAllSources(): EpistemicSource[] {
    return [...this.sources.values()];
  }

  /** Update a source's reliability after a validation event. */
  recordValidation(sourceId: string, validated: boolean): void {
    const src = this.sources.get(sourceId);
    if (!src) return;
    src.claimsEvaluated += 1;
    if (validated) src.claimsValidated += 1;
    // Exponential moving average (α = 0.1)
    const observed = validated ? 1 : 0;
    src.reliability = Number((src.reliability * 0.9 + observed * 0.1).toFixed(4));
    src.lastEvaluatedAt = new Date().toISOString();
  }

  /** Flag a bias on a source. */
  reportBias(sourceId: string, bias: BiasKind): void {
    const src = this.sources.get(sourceId);
    if (!src) return;
    if (!src.biasProfile.includes(bias)) {
      src.biasProfile.push(bias);
    }
  }

  // ========================================================================
  // Claim Evaluation — the core pipeline
  // ========================================================================

  /**
   * Evaluate a piece of information entering the OS.
   *
   * Steps:
   * 1. Score reliability factors
   * 2. Score worthiness factors
   * 3. Compute composite confidence
   * 4. Assign verification tier
   * 5. Run triangulation (if enough data)
   * 6. Compute ZPE cost modifier
   * 7. Emit evaluation event
   */
  evaluate(
    sourceId: string,
    content: string,
    domain: string,
    metadata: Record<string, unknown> = {},
  ): EpistemicEvaluation {
    const now = new Date().toISOString();

    // Ensure source exists (auto-register with default reliability if new)
    if (!this.sources.has(sourceId)) {
      this.registerSource(sourceId, sourceId, 'system_internal');
    }
    const source = this.sources.get(sourceId)!;

    // 1. Reliability factors
    const reliabilityFactors = this.computeReliabilityFactors(source, content, domain);
    const reliability = this.aggregateFactors(reliabilityFactors as unknown as Record<string, number>);

    // 2. Worthiness factors
    const worthinessFactors = this.computeWorthinessFactors(content, domain, metadata);
    const worthiness = this.aggregateFactors(worthinessFactors as unknown as Record<string, number>);

    // 3. Composite confidence
    const confidence = Number(
      (reliability * RELIABILITY_WEIGHT + worthiness * WORTHINESS_WEIGHT).toFixed(4),
    );

    // 4. Verification tier
    const tier = this.assignTier(reliability, worthiness);

    // 5. Triangulation
    const triangulation = this.triangulate(content, domain, sourceId);

    // 6. Bias detection
    const biases = this.detectBiases(content, source);

    // Build claim
    const claim: EpistemicClaim = {
      id: `ec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      sourceId,
      content,
      domain,
      reliability,
      worthiness,
      confidence,
      tier,
      biases,
      createdAt: now,
      revalidatedAt: null,
      triangulation,
      constitutionallyCleared: true, // default; layers override via markConstitutionalBlock()
      metadata,
    };

    // Store (with cap)
    this.claims.push(claim);
    if (this.claims.length > MAX_CLAIMS) {
      this.claims.splice(0, this.claims.length - MAX_CLAIMS);
    }

    // Update source stats
    source.claimsEvaluated += 1;
    source.lastEvaluatedAt = now;

    // 7. Build evaluation result
    const admittedToReasoning = this.isAdmitted(tier, confidence);
    const zpeCostModifier = this.computeZpeCostModifier(confidence, tier);
    const epistemicTrace = this.buildTrace(claim, reliabilityFactors, worthinessFactors, triangulation);

    const evaluation: EpistemicEvaluation = {
      claim,
      worthinessFactors,
      reliabilityFactors,
      tier,
      admittedToReasoning,
      zpeCostModifier,
      epistemicTrace,
    };

    // Notify listeners
    for (const fn of this.listeners) fn(evaluation);

    return evaluation;
  }

  /** Mark a claim as blocked by constitutional enforcement. */
  markConstitutionalBlock(claimId: string): boolean {
    const claim = this.claims.find((c) => c.id === claimId);
    if (!claim) return false;
    claim.constitutionallyCleared = false;
    return true;
  }

  /** Re‑evaluate a claim (e.g., after new evidence). */
  revalidate(claimId: string): EpistemicEvaluation | null {
    const existing = this.claims.find((c) => c.id === claimId);
    if (!existing) return null;
    const result = this.evaluate(
      existing.sourceId,
      existing.content,
      existing.domain,
      existing.metadata,
    );
    existing.revalidatedAt = new Date().toISOString();
    existing.reliability = result.claim.reliability;
    existing.worthiness = result.claim.worthiness;
    existing.confidence = result.claim.confidence;
    existing.tier = result.claim.tier;
    return result;
  }

  // ========================================================================
  // Queries
  // ========================================================================

  getClaim(id: string): EpistemicClaim | null {
    return this.claims.find((c) => c.id === id) ?? null;
  }

  getClaimsBySource(sourceId: string, limit = 100): EpistemicClaim[] {
    return this.claims
      .filter((c) => c.sourceId === sourceId)
      .slice(-limit);
  }

  getClaimsByDomain(domain: string, limit = 100): EpistemicClaim[] {
    return this.claims
      .filter((c) => c.domain === domain)
      .slice(-limit);
  }

  getClaimsByTier(tier: VerificationTier, limit = 100): EpistemicClaim[] {
    return this.claims
      .filter((c) => c.tier === tier)
      .slice(-limit);
  }

  getLowConfidenceClaims(threshold = 0.4, limit = 50): EpistemicClaim[] {
    return this.claims
      .filter((c) => c.confidence < threshold)
      .slice(-limit);
  }

  getHighConfidenceClaims(threshold = 0.8, limit = 50): EpistemicClaim[] {
    return this.claims
      .filter((c) => c.confidence >= threshold)
      .slice(-limit);
  }

  // ========================================================================
  // Anomaly Detection
  // ========================================================================

  /** Run anomaly detection across recent claims and sources. */
  detectAnomalies(): EpistemicAnomaly[] {
    const now = new Date().toISOString();
    const recentClaims = this.claims.slice(-1000);

    const detected: EpistemicAnomaly[] = [
      ...this.detectReliabilityDrops(now),
      ...this.detectBiasSurges(recentClaims, now),
      ...this.detectConflictSpikes(recentClaims, now),
      ...this.detectStaleData(recentClaims, now),
      ...this.detectHallucinationRisk(recentClaims, now),
    ];

    // Store anomalies
    this.anomalies.push(...detected);
    if (this.anomalies.length > MAX_ANOMALIES) {
      this.anomalies.splice(0, this.anomalies.length - MAX_ANOMALIES);
    }

    return detected;
  }

  getAnomalies(limit = 50): EpistemicAnomaly[] {
    return this.anomalies.slice(-limit);
  }

  getCriticalAnomalies(): EpistemicAnomaly[] {
    return this.anomalies.filter((a) => a.severity === 'critical');
  }

  // ========================================================================
  // Events
  // ========================================================================

  on(listener: (evaluation: EpistemicEvaluation) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ========================================================================
  // Summary
  // ========================================================================

  getSummary(): EpistemicHealthSummary {
    const totalClaims = this.claims.length;
    const totalSources = this.sources.size;

    // Averages
    const avgReliability = totalClaims > 0
      ? Number((this.claims.reduce((s, c) => s + c.reliability, 0) / totalClaims).toFixed(4))
      : 0;
    const avgWorthiness = totalClaims > 0
      ? Number((this.claims.reduce((s, c) => s + c.worthiness, 0) / totalClaims).toFixed(4))
      : 0;
    const avgConfidence = totalClaims > 0
      ? Number((this.claims.reduce((s, c) => s + c.confidence, 0) / totalClaims).toFixed(4))
      : 0;

    // Tier distribution
    const tierDistribution: Record<VerificationTier, number> = {
      tier1_fast: 0,
      tier2_deprioritize: 0,
      tier3_deep: 0,
      tier4_discard: 0,
    };
    for (const c of this.claims) tierDistribution[c.tier] += 1;

    // Bias distribution
    const biasDistribution: Partial<Record<BiasKind, number>> = {};
    for (const c of this.claims) {
      for (const b of c.biases) {
        biasDistribution[b] = (biasDistribution[b] ?? 0) + 1;
      }
    }

    // Triangulation rate
    const triangulated = this.claims.filter((c) => c.triangulation !== null).length;
    const triangulationRate = totalClaims > 0
      ? Number((triangulated / totalClaims).toFixed(4))
      : 0;

    // Discard / admission rates
    const discarded = tierDistribution.tier4_discard;
    const admitted = tierDistribution.tier1_fast + tierDistribution.tier3_deep;
    const discardRate = totalClaims > 0 ? Number((discarded / totalClaims).toFixed(4)) : 0;
    const admissionRate = totalClaims > 0 ? Number((admitted / totalClaims).toFixed(4)) : 0;

    // Top sources
    const sortedSources = [...this.sources.values()].sort(
      (a, b) => b.reliability - a.reliability,
    );
    const topReliableSources = sortedSources.slice(0, 5).map((s) => ({
      id: s.id,
      name: s.name,
      reliability: s.reliability,
    }));
    const topUnreliableSources = sortedSources
      .slice(-5)
      .reverse()
      .map((s) => ({ id: s.id, name: s.name, reliability: s.reliability }));

    return {
      totalSources,
      totalClaims,
      avgReliability,
      avgWorthiness,
      avgConfidence,
      tierDistribution,
      biasDistribution,
      triangulationRate,
      discardRate,
      admissionRate,
      topReliableSources,
      topUnreliableSources,
      recentAnomalies: this.anomalies.slice(-10),
    };
  }

  // ========================================================================
  // Internals — Scoring
  // ========================================================================

  private computeReliabilityFactors(
    source: EpistemicSource,
    content: string,
    domain: string,
  ): ReliabilityFactors {
    // Source authority: based on source category
    const authorityMap: Record<SourceCategory, number> = {
      system_internal: 0.9,
      retrieved_knowledge: 0.7,
      cross_mission: 0.75,
      tool_output: 0.65,
      external_api: 0.5,
      user_input: 0.6,
      agent_generated: 0.4,
    };
    const sourceAuthority = authorityMap[source.category];

    // Historical accuracy from source record
    const historicalAccuracy = source.claimsEvaluated > 0
      ? source.claimsValidated / source.claimsEvaluated
      : 0.5;

    // Independence is lower if sole source for this domain
    const domainClaims = this.claims.filter((c) => c.domain === domain);
    const uniqueSources = new Set(domainClaims.map((c) => c.sourceId)).size;
    const sourceIndependence = Math.min(1, uniqueSources / 3);

    // Internal consistency: shorter content with clear structure scores higher
    const internalConsistency = content.length > 10 ? 0.7 : 0.3;

    // Temporal freshness: source evaluated recently
    const hoursSinceEval = (Date.now() - new Date(source.lastEvaluatedAt).getTime()) / 3_600_000;
    const temporalFreshness = Math.max(0, 1 - hoursSinceEval / (STALE_HOURS * 2));

    // Cross‑mission validation: based on pattern count from cross‑mission intel
    const crossMissionValidation = domainClaims.length > 3 ? 0.7 : 0.3;

    // Cross‑agent agreement: sources without bias rank higher
    const crossAgentAgreement = source.biasProfile.length === 0 ? 0.8 : 0.4;

    // Constitutional alignment: absence of detected policy violations
    const constitutionalAlignment = source.biasProfile.includes('political') ? 0.3 : 0.8;

    return {
      sourceAuthority,
      historicalAccuracy: Number(historicalAccuracy.toFixed(4)),
      sourceIndependence: Number(sourceIndependence.toFixed(4)),
      internalConsistency,
      temporalFreshness: Number(temporalFreshness.toFixed(4)),
      crossMissionValidation,
      crossAgentAgreement,
      constitutionalAlignment,
    };
  }

  private computeWorthinessFactors(
    content: string,
    domain: string,
    metadata: Record<string, unknown>,
  ): WorthinessFactors {
    // Novelty: is this content unlike recent claims?
    const recentContents = this.claims.slice(-200).map((c) => c.content);
    const duplicate = recentContents.includes(content);
    const novelty = duplicate ? 0.1 : 0.8;

    // Signal‑to‑noise: longer, more structured content → higher
    const signalToNoise = Math.min(1, Math.max(0.1, content.length / 500));

    // Mission relevance (from metadata hint, or 0.5 default)
    const missionRelevance = typeof metadata.missionRelevance === 'number'
      ? Math.max(0, Math.min(1, metadata.missionRelevance))
      : 0.5;

    // Actionability: does the content suggest an action?
    const actionWords = ['should', 'must', 'deploy', 'create', 'fix', 'update', 'run', 'execute'];
    const lowerContent = content.toLowerCase();
    const actionability = actionWords.some((w) => lowerContent.includes(w)) ? 0.7 : 0.3;

    // Depth: content with specificity markers
    const depthMarkers = ['because', 'therefore', 'specifically', 'for example', 'evidence'];
    const depth = depthMarkers.some((m) => lowerContent.includes(m)) ? 0.7 : 0.3;

    // Non-redundancy (inverse of duplicate)
    const nonRedundancy = duplicate ? 0.1 : 0.9;

    // Goal alignment (from metadata hint or domain presence)
    let goalAlignment: number;
    if (typeof metadata.goalAlignment === 'number') {
      goalAlignment = Math.max(0, Math.min(1, metadata.goalAlignment));
    } else {
      goalAlignment = domain ? 0.6 : 0.3;
    }

    // Outcome impact (from metadata hint, or moderate default)
    const outcomeImpact = typeof metadata.outcomeImpact === 'number'
      ? Math.max(0, Math.min(1, metadata.outcomeImpact))
      : 0.5;

    return {
      novelty,
      signalToNoise: Number(signalToNoise.toFixed(4)),
      missionRelevance,
      actionability,
      depth,
      nonRedundancy,
      goalAlignment,
      outcomeImpact,
    };
  }

  /** Average all factors in a factor object. */
  private aggregateFactors(factors: Record<string, number>): number {
    const values = Object.values(factors);
    if (values.length === 0) return 0;
    return Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(4));
  }

  /** Assign verification tier based on the 2×2 reliability × worthiness quadrant. */
  private assignTier(reliability: number, worthiness: number): VerificationTier {
    const highR = reliability >= 0.5;
    const highW = worthiness >= 0.5;
    if (highR && highW) return 'tier1_fast';
    if (highR && !highW) return 'tier2_deprioritize';
    if (!highR && highW) return 'tier3_deep';
    return 'tier4_discard';
  }

  /** Cross‑source triangulation for a claim. */
  private triangulate(
    content: string,
    domain: string,
    sourceId: string,
  ): TriangulationResult | null {
    // Find other claims in the same domain from different sources
    const candidates = this.claims.filter(
      (c) => c.domain === domain && c.sourceId !== sourceId,
    );
    if (candidates.length === 0) return null;

    // Simple content‑similarity: exact match or substring overlap
    const confirming: string[] = [];
    const conflicting: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const c of candidates.slice(-200)) {
      const lc = c.content.toLowerCase();
      // Very basic overlap heuristic (production would use embeddings)
      const overlap = this.tokenOverlap(lowerContent, lc);
      if (overlap > 0.5) {
        confirming.push(c.id);
      } else if (overlap < 0.1 && c.domain === domain) {
        conflicting.push(c.id);
      }
    }

    const convergingSources = new Set(
      confirming.map((id) => this.claims.find((c) => c.id === id)?.sourceId).filter(Boolean),
    ).size;
    const conflictingSources = new Set(
      conflicting.map((id) => this.claims.find((c) => c.id === id)?.sourceId).filter(Boolean),
    ).size;

    const total = convergingSources + conflictingSources;
    const agreementScore = total > 0
      ? Number((convergingSources / total).toFixed(4))
      : 0.5;

    return {
      convergingSourceCount: convergingSources,
      conflictingSourceCount: conflictingSources,
      agreementScore,
      confirmingClaimIds: confirming.slice(0, 10),
      conflictingClaimIds: conflicting.slice(0, 10),
    };
  }

  /** Token overlap ratio between two strings. */
  private tokenOverlap(a: string, b: string): number {
    const tokensA = new Set(a.split(/\s+/).filter((t) => t.length > 2));
    const tokensB = new Set(b.split(/\s+/).filter((t) => t.length > 2));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;
    let overlap = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) overlap += 1;
    }
    return overlap / Math.max(tokensA.size, tokensB.size);
  }

  /** Detect biases based on source profile and content heuristics. */
  private detectBiases(content: string, source: EpistemicSource): BiasKind[] {
    const biases: BiasKind[] = [];

    // Inherit source biases
    for (const b of source.biasProfile) {
      if (!biases.includes(b)) biases.push(b);
    }

    // Content‑level heuristic markers
    const lower = content.toLowerCase();
    if (/\b(amazing|incredible|revolutionary|best ever)\b/.test(lower)) {
      if (!biases.includes('commercial')) biases.push('commercial');
    }
    if (/\b(always|never|everyone|nobody|impossible)\b/.test(lower)) {
      if (!biases.includes('confirmation')) biases.push('confirmation');
    }

    return biases;
  }

  /** Determine whether a claim is admitted to reasoning. */
  private isAdmitted(tier: VerificationTier, confidence: number): boolean {
    if (tier === 'tier4_discard') return false;
    if (tier === 'tier2_deprioritize') return false;
    return confidence >= ADMISSION_CONFIDENCE_THRESHOLD;
  }

  /** Compute ZPE cost modifier: low confidence → higher path cost. */
  private computeZpeCostModifier(confidence: number, tier: VerificationTier): number {
    if (tier === 'tier1_fast') return 1;
    if (tier === 'tier2_deprioritize') return 1.2;
    if (tier === 'tier3_deep') return 2.5;
    return 5; // tier4 — should rarely reach ZPE, but if it does, it's expensive
  }

  /** Build a human‑readable epistemic trace. */
  private buildTrace(
    claim: EpistemicClaim,
    rFactors: ReliabilityFactors,
    wFactors: WorthinessFactors,
    triangulation: TriangulationResult | null,
  ): string[] {
    const trace: string[] = [
      `[EIL] Claim ${claim.id} from source ${claim.sourceId}`,
      `  Reliability: ${claim.reliability} (authority=${rFactors.sourceAuthority}, accuracy=${rFactors.historicalAccuracy}, freshness=${rFactors.temporalFreshness})`,
      `  Worthiness:  ${claim.worthiness} (novelty=${wFactors.novelty}, relevance=${wFactors.missionRelevance}, actionability=${wFactors.actionability})`,
      `  Confidence:  ${claim.confidence} → Tier: ${claim.tier}`,
    ];
    if (triangulation) {
      trace.push(`  Triangulation: ${triangulation.convergingSourceCount} converging, ${triangulation.conflictingSourceCount} conflicting → agreement=${triangulation.agreementScore}`);
    }
    if (claim.biases.length > 0) {
      trace.push(`  Biases detected: ${claim.biases.join(', ')}`);    }
    return trace;
  }

  // ========================================================================
  // Internals — Anomaly Detection Helpers
  // ========================================================================

  /** Generate a unique anomaly ID. */
  private anomalyId(): string {
    return `ea-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  /** Sources whose reliability fell below 0.3. */
  private detectReliabilityDrops(now: string): EpistemicAnomaly[] {
    const results: EpistemicAnomaly[] = [];
    for (const src of this.sources.values()) {
      if (src.reliability < 0.3 && src.claimsEvaluated > 5) {
        results.push({
          id: this.anomalyId(),
          kind: 'reliability_drop',
          description: `Source "${src.name}" reliability dropped to ${src.reliability}`,
          severity: src.reliability < 0.15 ? 'critical' : 'high',
          sourceIds: [src.id],
          claimIds: [],
          detectedAt: now,
        });
      }
    }
    return results;
  }

  /** Many recent claims from biased sources. */
  private detectBiasSurges(recent: EpistemicClaim[], now: string): EpistemicAnomaly[] {
    const biased = recent.filter((c) => c.biases.length > 0);
    if (biased.length <= recent.length * 0.4 || recent.length <= 10) return [];
    return [{
      id: this.anomalyId(),
      kind: 'bias_surge',
      description: `${biased.length}/${recent.length} recent claims carry detected bias`,
      severity: 'high',
      sourceIds: [...new Set(biased.map((c) => c.sourceId))],
      claimIds: biased.slice(-10).map((c) => c.id),
      detectedAt: now,
    }];
  }

  /** Many triangulation conflicts. */
  private detectConflictSpikes(recent: EpistemicClaim[], now: string): EpistemicAnomaly[] {
    const conflicted = recent.filter(
      (c) => c.triangulation && c.triangulation.conflictingSourceCount > c.triangulation.convergingSourceCount,
    );
    if (conflicted.length <= 5) return [];
    return [{
      id: this.anomalyId(),
      kind: 'conflict_spike',
      description: `${conflicted.length} recent claims have more conflicting than converging sources`,
      severity: conflicted.length > 20 ? 'critical' : 'medium',
      sourceIds: [...new Set(conflicted.map((c) => c.sourceId))],
      claimIds: conflicted.slice(-10).map((c) => c.id),
      detectedAt: now,
    }];
  }

  /** Claims older than STALE_HOURS without revalidation. */
  private detectStaleData(recent: EpistemicClaim[], now: string): EpistemicAnomaly[] {
    const threshold = Date.now() - STALE_HOURS * 3_600_000;
    const stale = recent.filter(
      (c) => new Date(c.createdAt).getTime() < threshold && !c.revalidatedAt,
    );
    if (stale.length <= 20) return [];
    return [{
      id: this.anomalyId(),
      kind: 'stale_data',
      description: `${stale.length} claims are older than ${STALE_HOURS}h without revalidation`,
      severity: 'medium',
      sourceIds: [...new Set(stale.map((c) => c.sourceId))],
      claimIds: stale.slice(-10).map((c) => c.id),
      detectedAt: now,
    }];
  }

  /** Low-confidence agent-generated claims suggesting hallucination. */
  private detectHallucinationRisk(recent: EpistemicClaim[], now: string): EpistemicAnomaly[] {
    const agentClaims = recent.filter((c) => {
      const src = this.sources.get(c.sourceId);
      return src?.category === 'agent_generated' && c.confidence < 0.4;
    });
    if (agentClaims.length <= 10) return [];
    return [{
      id: this.anomalyId(),
      kind: 'hallucination_risk',
      description: `${agentClaims.length} low-confidence agent-generated claims detected`,
      severity: agentClaims.length > 30 ? 'critical' : 'high',
      sourceIds: [...new Set(agentClaims.map((c) => c.sourceId))],
      claimIds: agentClaims.slice(-10).map((c) => c.id),
      detectedAt: now,
    }];
  }
}
