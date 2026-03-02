/**
 * Unified Trigger Pipeline
 *
 * The OS's reflex system — a single adaptive trigger architecture that
 * evaluates every incoming signal and activates the correct subsystem
 * automatically. Follows a consistent 8‑stage sequence: Perception →
 * Classification → Epistemic Evaluation → Symbolic / Cultural Interpretation →
 * Mission Relevance → Cognitive Routing → Safety Enforcement → UI Activation.
 *
 * Includes a slow‑and‑stable adaptive heuristic layer that gradually tunes
 * trigger sensitivity based on long‑term user behaviour patterns while
 * keeping the moral / epistemic spine fixed and non‑negotiable.
 *
 * Cross‑cutting integration points:
 *   EpistemicIntegrity         → epistemic evaluation stage
 *   CulturalHistoricalContext  → classification & cultural interpretation
 *   SymbolicInterpretation     → symbolic detection stage
 *   UnifiedCognitiveField      → cognitive routing
 *   ConstitutionalGrid         → safety enforcement
 *   MissionCompiler            → mission relevance
 *   AutonomousEconomy          → ZPE cost routing
 *   CivilizationIntelligence   → strategic signals on trigger anomalies
 *   Dashboard                  → UI activation badges & indicators
 */

// ---------------------------------------------------------------------------
// Enums & Literal Types
// ---------------------------------------------------------------------------

/** The 8 pipeline stages every signal passes through. */
export type PipelineStage =
  | 'perception'
  | 'classification'
  | 'epistemic_evaluation'
  | 'symbolic_cultural'
  | 'mission_relevance'
  | 'cognitive_routing'
  | 'safety_enforcement'
  | 'ui_activation';

/** Domain classification result. */
export type SignalDomain =
  | 'empirical'
  | 'historical'
  | 'symbolic'
  | 'philosophical'
  | 'cultural'
  | 'anthropological'
  | 'operational'
  | 'technical'
  | 'unknown';

/** Trigger intensity — adaptive, not binary. */
export type TriggerIntensity = 'silent' | 'soft' | 'moderate' | 'strong' | 'critical';

/** Route recommendation for ZPE. */
export type RouteRecommendation =
  | 'fast_path'
  | 'weighted_branch'
  | 'sandboxed'
  | 'escalated';

/** Safety verdict. */
export type SafetyVerdict = 'clear' | 'soft_warning' | 'hard_block' | 'escalate';

/** Adaptive heuristic dimension that can evolve over time. */
export type AdaptiveDimension =
  | 'symbolic_depth'
  | 'uncertainty_tolerance'
  | 'epistemic_strictness'
  | 'cultural_interest'
  | 'mission_complexity'
  | 'ui_density'
  | 'archetype_engagement'
  | 'metaphysical_engagement'
  | 'verification_intensity';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** An incoming signal entering the pipeline. */
export interface PipelineSignal {
  id: string;
  /** Raw content or serialized payload. */
  content: string;
  /** Where the signal originated. */
  origin: 'user' | 'tool' | 'agent' | 'external' | 'mission' | 'system';
  /** Optional pre-classification hint. */
  domainHint?: SignalDomain;
  /** Arbitrary metadata. */
  metadata: Record<string, unknown>;
  /** ISO timestamp of ingestion. */
  ingestedAt: string;
}

/** Result of the classification stage. */
export interface ClassificationResult {
  domain: SignalDomain;
  /** Probability 0–1 that the classification is correct. */
  confidence: number;
  /** Alternative domains with lower confidence. */
  alternatives: Array<{ domain: SignalDomain; confidence: number }>;
}

/** Result of the epistemic evaluation stage. */
export interface EpistemicStageResult {
  reliability: number;
  worthiness: number;
  freshness: number;
  crossSourceAgreement: number;
  uncertainty: number;
  /** Whether the signal passed epistemic admission. */
  admitted: boolean;
}

/** Result of the symbolic/cultural interpretation stage. */
export interface SymbolicCulturalResult {
  /** Whether symbolic patterns were detected. */
  symbolicDetected: boolean;
  /** Whether cultural context was identified. */
  culturalDetected: boolean;
  /** Symbolic activation intensity. */
  symbolicIntensity: TriggerIntensity;
  /** Cultural activation intensity. */
  culturalIntensity: TriggerIntensity;
  /** Detected archetypes (names only for the pipeline). */
  archetypes: string[];
  /** Detected motifs (names only for the pipeline). */
  motifs: string[];
  /** Context type assigned by cultural layer. */
  contextType: string;
}

/** Result of the mission relevance stage. */
export interface MissionRelevanceResult {
  /** 0–1 how much this affects the active mission. */
  relevance: number;
  /** Whether verification is required before use. */
  verificationRequired: boolean;
  /** Whether symbolic content should be isolated or integrated. */
  symbolicIntegration: 'integrate' | 'isolate' | 'contextual_note';
  /** Whether new sub-missions should be created. */
  subMissionSuggested: boolean;
}

/** Result of the cognitive routing stage. */
export interface CognitiveRoutingResult {
  route: RouteRecommendation;
  /** ZPE cost modifier from trigger context. */
  zpeCostModifier: number;
  /** Cognitive load estimate 0–1. */
  cognitiveLoad: number;
}

/** Result of the safety enforcement stage. */
export interface SafetyResult {
  verdict: SafetyVerdict;
  /** Rule IDs that triggered, if any. */
  triggeredRules: string[];
  reason: string;
}

/** Result of the UI activation stage. */
export interface UIActivationResult {
  /** Badges to display. */
  badges: string[];
  /** Whether to show confidence bars. */
  showConfidenceBars: boolean;
  /** Whether to show a symbolic map. */
  showSymbolicMap: boolean;
  /** Whether to show cultural notes. */
  showCulturalNotes: boolean;
  /** Whether to show verification indicators. */
  showVerification: boolean;
  /** UI density for this signal. */
  density: 'compact' | 'standard' | 'rich';
}

/** Complete pipeline result for a single signal. */
export interface PipelineResult {
  signalId: string;
  classification: ClassificationResult;
  epistemic: EpistemicStageResult;
  symbolicCultural: SymbolicCulturalResult;
  missionRelevance: MissionRelevanceResult;
  cognitiveRouting: CognitiveRoutingResult;
  safety: SafetyResult;
  uiActivation: UIActivationResult;
  /** Stages the signal passed through. */
  stagesCompleted: PipelineStage[];
  /** Total processing time (ms). */
  processingMs: number;
  /** Human-readable trace. */
  trace: string[];
  /** ISO timestamp. */
  completedAt: string;
}

/** A single adaptive heuristic value with its history. */
export interface AdaptiveHeuristic {
  dimension: AdaptiveDimension;
  /** Current value 0–1 (higher = more engagement / stricter). */
  value: number;
  /** Baseline value that the system started with. */
  baseline: number;
  /** Number of reinforcement events observed. */
  reinforcements: number;
  /** Minimum reinforcements before adaptation begins. */
  adaptationThreshold: number;
  /** Last updated ISO timestamp. */
  lastUpdatedAt: string;
}

/** User cognitive profile built from long-term adaptive learning. */
export interface CognitiveProfile {
  heuristics: Map<AdaptiveDimension, AdaptiveHeuristic>;
  /** Total interactions observed. */
  totalInteractions: number;
  /** ISO timestamp of profile creation. */
  createdAt: string;
  /** ISO timestamp of last profile update. */
  lastUpdatedAt: string;
}

/** Aggregate pipeline summary. */
export interface TriggerPipelineSummary {
  totalSignalsProcessed: number;
  domainDistribution: Partial<Record<SignalDomain, number>>;
  avgProcessingMs: number;
  safetyBlocks: number;
  epistemicRejections: number;
  symbolicActivations: number;
  culturalActivations: number;
  adaptiveProfile: Record<AdaptiveDimension, number>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RESULTS = 50_000;

/** Slow-learning rate: only ~1% of the delta per reinforcement. */
const ADAPTIVE_LEARNING_RATE = 0.01;

/** Minimum reinforcements before any adaptation occurs. */
const MIN_REINFORCEMENTS = 25;

/** Maximum adaptive drift from baseline (prevents over-fitting). */
const MAX_DRIFT = 0.3;

/** Domain classification keyword map. */
const DOMAIN_KEYWORDS: Array<{ domain: SignalDomain; patterns: RegExp }> = [
  { domain: 'empirical', patterns: /\b(archaeolog|artifact|excavat|carbon[\s-]?dat|stratigraphy|fossil|specimen|laboratory)\b/i },
  { domain: 'historical', patterns: /\b(ancient|chronicle|manuscript|inscription|dynasty|empire|pharaoh|medieval|historian)\b/i },
  { domain: 'symbolic', patterns: /\b(symbol|archetype|motif|myth|legend|narrative|allegory|parable|metaphor)\b/i },
  { domain: 'philosophical', patterns: /\b(philosophy|metaphysic|ontolog|epistemolog|ethic|axiom|dialectic|phenomenolog)\b/i },
  { domain: 'cultural', patterns: /\b(cultural|ritual|tradition|ceremony|custom|folklore|heritage|indigenous)\b/i },
  { domain: 'anthropological', patterns: /\b(anthropolog|ethnograph|fieldwork|kinship|tribe|clan|societal|cross[\s-]?cultural)\b/i },
  { domain: 'technical', patterns: /\b(deploy|api|server|database|function|code|compile|debug|test|build|docker)\b/i },
  { domain: 'operational', patterns: /\b(mission|task|workflow|schedule|assign|execute|monitor|status|health)\b/i },
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class UnifiedTriggerPipeline {
  private readonly results: PipelineResult[] = [];
  private readonly profile: CognitiveProfile;
  private listeners: Array<(result: PipelineResult) => void> = [];
  private safetyBlocks = 0;
  private epistemicRejections = 0;
  private symbolicActivations = 0;
  private culturalActivations = 0;
  private totalProcessingMs = 0;

  constructor() {
    const now = new Date().toISOString();
    this.profile = {
      heuristics: new Map<AdaptiveDimension, AdaptiveHeuristic>(),
      totalInteractions: 0,
      createdAt: now,
      lastUpdatedAt: now,
    };
    this.initializeHeuristics();
  }

  // ========================================================================
  // Core Pipeline
  // ========================================================================

  /**
   * Process a signal through the full 8-stage pipeline.
   */
  process(signal: PipelineSignal): PipelineResult {
    const start = Date.now();
    const stagesCompleted: PipelineStage[] = [];
    const trace: string[] = [`[UTP] Processing signal ${signal.id} from ${signal.origin}`];

    // 1. Perception
    stagesCompleted.push('perception');
    trace.push(`  Stage 1 — Perception: ingested ${signal.content.length} chars`);

    // 2. Classification
    const classification = this.classify(signal);
    stagesCompleted.push('classification');
    trace.push(`  Stage 2 — Classification: ${classification.domain} (conf=${classification.confidence.toFixed(2)})`);

    // 3. Epistemic evaluation
    const epistemic = this.evaluateEpistemic(signal, classification);
    stagesCompleted.push('epistemic_evaluation');
    trace.push(`  Stage 3 — Epistemic: reliability=${epistemic.reliability.toFixed(2)}, admitted=${epistemic.admitted}`);
    if (!epistemic.admitted) this.epistemicRejections += 1;

    // 4. Symbolic and cultural interpretation
    const symbolicCultural = this.interpretSymbolicCultural(signal, classification);
    stagesCompleted.push('symbolic_cultural');
    trace.push(`  Stage 4 — Symbolic/Cultural: sym=${symbolicCultural.symbolicIntensity}, cul=${symbolicCultural.culturalIntensity}`);
    if (symbolicCultural.symbolicDetected) this.symbolicActivations += 1;
    if (symbolicCultural.culturalDetected) this.culturalActivations += 1;

    // 5. Mission relevance
    const missionRelevance = this.assessMissionRelevance(signal, classification, epistemic);
    stagesCompleted.push('mission_relevance');
    trace.push(`  Stage 5 — Mission: relevance=${missionRelevance.relevance.toFixed(2)}, verify=${missionRelevance.verificationRequired}`);

    // 6. Cognitive routing
    const cognitiveRouting = this.routeCognition(epistemic, missionRelevance, classification);
    stagesCompleted.push('cognitive_routing');
    trace.push(`  Stage 6 — Routing: ${cognitiveRouting.route}, zpeCost=${cognitiveRouting.zpeCostModifier.toFixed(2)}`);

    // 7. Safety enforcement
    const safety = this.enforceSafety(signal, classification, epistemic);
    stagesCompleted.push('safety_enforcement');
    trace.push(`  Stage 7 — Safety: ${safety.verdict}`);
    if (safety.verdict === 'hard_block') this.safetyBlocks += 1;

    // 8. UI activation
    const uiActivation = this.activateUI(classification, symbolicCultural, epistemic, missionRelevance);
    stagesCompleted.push('ui_activation');
    trace.push(`  Stage 8 — UI: ${uiActivation.badges.length} badges, density=${uiActivation.density}`);

    const processingMs = Date.now() - start;
    this.totalProcessingMs += processingMs;

    const result: PipelineResult = {
      signalId: signal.id,
      classification,
      epistemic,
      symbolicCultural,
      missionRelevance,
      cognitiveRouting,
      safety,
      uiActivation,
      stagesCompleted,
      processingMs,
      trace,
      completedAt: new Date().toISOString(),
    };

    // Store
    this.results.push(result);
    if (this.results.length > MAX_RESULTS) {
      this.results.splice(0, this.results.length - MAX_RESULTS);
    }

    // Update interaction count (for adaptive profile)
    this.profile.totalInteractions += 1;

    // Emit
    for (const fn of this.listeners) fn(result);

    return result;
  }

  // ========================================================================
  // Adaptive Learning — Slow and Stable
  // ========================================================================

  /**
   * Record a user behaviour reinforcement. The pipeline only adapts
   * after MIN_REINFORCEMENTS consistent signals for a given dimension.
   * Learning rate is intentionally slow (1% per event).
   *
   * @param dimension Which heuristic to reinforce.
   * @param direction 'increase' to raise sensitivity, 'decrease' to lower it.
   */
  reinforce(dimension: AdaptiveDimension, direction: 'increase' | 'decrease'): void {
    const h = this.profile.heuristics.get(dimension);
    if (!h) return;

    h.reinforcements += 1;

    // Only adapt after enough evidence
    if (h.reinforcements < h.adaptationThreshold) return;

    const delta = direction === 'increase' ? ADAPTIVE_LEARNING_RATE : -ADAPTIVE_LEARNING_RATE;
    const proposed = h.value + delta;

    // Enforce maximum drift from baseline
    const drift = proposed - h.baseline;
    if (Math.abs(drift) > MAX_DRIFT) return;

    h.value = Math.max(0, Math.min(1, proposed));
    h.lastUpdatedAt = new Date().toISOString();
    this.profile.lastUpdatedAt = h.lastUpdatedAt;
  }

  /** Get the current adaptive profile (read-only snapshot). */
  getAdaptiveProfile(): Record<AdaptiveDimension, number> {
    const snapshot: Partial<Record<AdaptiveDimension, number>> = {};
    for (const [dim, h] of this.profile.heuristics) {
      snapshot[dim] = h.value;
    }
    return snapshot as Record<AdaptiveDimension, number>;
  }

  /** Get a specific heuristic value. */
  getHeuristic(dimension: AdaptiveDimension): number {
    return this.profile.heuristics.get(dimension)?.value ?? 0.5;
  }

  // ========================================================================
  // Events
  // ========================================================================

  on(listener: (result: PipelineResult) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ========================================================================
  // Queries
  // ========================================================================

  getRecentResults(limit = 50): PipelineResult[] {
    return this.results.slice(-limit);
  }

  getResultsByDomain(domain: SignalDomain, limit = 100): PipelineResult[] {
    return this.results
      .filter((r) => r.classification.domain === domain)
      .slice(-limit);
  }

  getSafetyBlocked(): PipelineResult[] {
    return this.results.filter((r) => r.safety.verdict === 'hard_block');
  }

  // ========================================================================
  // Summary
  // ========================================================================

  getSummary(): TriggerPipelineSummary {
    const total = this.results.length;

    const domainDistribution: Partial<Record<SignalDomain, number>> = {};
    for (const r of this.results) {
      const d = r.classification.domain;
      domainDistribution[d] = (domainDistribution[d] ?? 0) + 1;
    }

    return {
      totalSignalsProcessed: total,
      domainDistribution,
      avgProcessingMs: total > 0 ? Number((this.totalProcessingMs / total).toFixed(2)) : 0,
      safetyBlocks: this.safetyBlocks,
      epistemicRejections: this.epistemicRejections,
      symbolicActivations: this.symbolicActivations,
      culturalActivations: this.culturalActivations,
      adaptiveProfile: this.getAdaptiveProfile(),
    };
  }

  // ========================================================================
  // Internals — Pipeline Stages
  // ========================================================================

  /** Stage 2: Classify the signal domain. */
  private classify(signal: PipelineSignal): ClassificationResult {
    // Use hint if provided
    if (signal.domainHint) {
      return {
        domain: signal.domainHint,
        confidence: 0.9,
        alternatives: [],
      };
    }

    const scored: Array<{ domain: SignalDomain; score: number }> = [];
    const lower = signal.content.toLowerCase();

    for (const { domain, patterns } of DOMAIN_KEYWORDS) {
      const matches = lower.match(patterns);
      if (matches) {
        scored.push({ domain, score: 0.3 + Math.min(0.6, matches.length * 0.15) });
      }
    }

    if (scored.length === 0) {
      return { domain: 'unknown', confidence: 0.2, alternatives: [] };
    }

    scored.sort((a, b) => b.score - a.score);
    return {
      domain: scored[0].domain,
      confidence: Number(scored[0].score.toFixed(4)),
      alternatives: scored.slice(1, 4).map((s) => ({
        domain: s.domain,
        confidence: Number(s.score.toFixed(4)),
      })),
    };
  }

  /** Stage 3: Epistemic evaluation. */
  private evaluateEpistemic(
    signal: PipelineSignal,
    classification: ClassificationResult,
  ): EpistemicStageResult {
    const strictness = this.getHeuristic('epistemic_strictness');

    // Base scores modulated by origin trust
    const originTrust: Record<string, number> = {
      system: 0.9, tool: 0.7, user: 0.6, agent: 0.5, mission: 0.7, external: 0.4,
    };
    const trust = originTrust[signal.origin] ?? 0.5;

    const reliability = Number((trust * classification.confidence).toFixed(4));
    const worthiness = Number((0.5 + classification.confidence * 0.3).toFixed(4));
    const freshness = 0.9; // Signal is fresh by definition at ingestion
    const crossSourceAgreement = 0.5; // Unknown without cross-ref; neutral
    const uncertainty = Number((1 - reliability * 0.6 - classification.confidence * 0.4).toFixed(4));

    // Admission threshold adjusts with epistemic strictness heuristic
    const threshold = 0.3 + strictness * 0.2; // 0.3 – 0.5 range
    const admitted = reliability >= threshold;

    return { reliability, worthiness, freshness, crossSourceAgreement, uncertainty, admitted };
  }

  /** Stage 4: Symbolic & cultural interpretation. */
  private interpretSymbolicCultural(
    signal: PipelineSignal,
    classification: ClassificationResult,
  ): SymbolicCulturalResult {
    const symDepth = this.getHeuristic('symbolic_depth');
    const culInterest = this.getHeuristic('cultural_interest');

    const isSymbolicDomain = ['symbolic', 'philosophical'].includes(classification.domain);
    const isCulturalDomain = ['cultural', 'historical', 'anthropological'].includes(classification.domain);
    const lower = signal.content.toLowerCase();

    // Quick symbolic detection
    const symbolicKeywords = ['myth', 'archetype', 'symbol', 'motif', 'narrative', 'allegory'];
    const symHits = symbolicKeywords.filter((k) => lower.includes(k));
    const symbolicDetected = symHits.length > 0 || isSymbolicDomain;

    // Quick cultural detection
    const culturalKeywords = ['tradition', 'ritual', 'ancient', 'cultural', 'heritage', 'indigenous'];
    const culHits = culturalKeywords.filter((k) => lower.includes(k));
    const culturalDetected = culHits.length > 0 || isCulturalDomain;

    // Intensity scaled by adaptive heuristic
    const symbolicIntensity = this.scaleIntensity(
      symHits.length / 3, symDepth, symbolicDetected,
    );
    const culturalIntensity = this.scaleIntensity(
      culHits.length / 3, culInterest, culturalDetected,
    );

    return {
      symbolicDetected,
      culturalDetected,
      symbolicIntensity,
      culturalIntensity,
      archetypes: symHits,
      motifs: [],
      contextType: classification.domain,
    };
  }

  /** Stage 5: Mission relevance assessment. */
  private assessMissionRelevance(
    signal: PipelineSignal,
    classification: ClassificationResult,
    epistemic: EpistemicStageResult,
  ): MissionRelevanceResult {
    const missionHint = typeof signal.metadata.missionRelevance === 'number'
      ? signal.metadata.missionRelevance
      : 0.5;

    const relevance = Number(
      (missionHint * 0.5 + classification.confidence * 0.3 + epistemic.reliability * 0.2).toFixed(4),
    );

    const verificationRequired = epistemic.uncertainty > 0.5 || !epistemic.admitted;

    let symbolicIntegration: 'integrate' | 'isolate' | 'contextual_note';
    if (['symbolic', 'philosophical'].includes(classification.domain)) {
      symbolicIntegration = relevance > 0.6 ? 'integrate' : 'contextual_note';
    } else {
      symbolicIntegration = 'isolate';
    }

    const subMissionSuggested = relevance > 0.7 && verificationRequired;

    return { relevance, verificationRequired, symbolicIntegration, subMissionSuggested };
  }

  /** Stage 6: Cognitive routing. */
  private routeCognition(
    epistemic: EpistemicStageResult,
    mission: MissionRelevanceResult,
    classification: ClassificationResult,
  ): CognitiveRoutingResult {
    const uncertaintyTolerance = this.getHeuristic('uncertainty_tolerance');

    let route: RouteRecommendation;
    if (epistemic.reliability >= 0.7 && !mission.verificationRequired) {
      route = 'fast_path';
    } else if (epistemic.reliability >= 0.4) {
      route = 'weighted_branch';
    } else if (epistemic.uncertainty > (0.7 - uncertaintyTolerance * 0.2)) {
      route = 'escalated';
    } else {
      route = 'sandboxed';
    }

    const zpeCostMap: Record<RouteRecommendation, number> = {
      fast_path: 1,
      weighted_branch: 1.5,
      sandboxed: 2.5,
      escalated: 4,
    };
    const zpeCostModifier = zpeCostMap[route];

    const cognitiveLoad = Number(
      (epistemic.uncertainty * 0.4 + (1 - classification.confidence) * 0.3 + (mission.verificationRequired ? 0.3 : 0)).toFixed(4),
    );

    return { route, zpeCostModifier, cognitiveLoad };
  }

  /** Stage 7: Safety enforcement. */
  private enforceSafety(
    signal: PipelineSignal,
    classification: ClassificationResult,
    epistemic: EpistemicStageResult,
  ): SafetyResult {
    const triggeredRules: string[] = [];
    const lower = signal.content.toLowerCase();

    // Constitutional content check (hard-coded moral spine)
    const dangerousPatterns = /\b(exploit|attack|hack|bypass[\s-]?safety|ignore[\s-]?rules|override[\s-]?constitution)\b/i;
    if (dangerousPatterns.test(lower)) {
      triggeredRules.push('constitutional-content-block');
    }

    // Epistemic integrity safety
    if (!epistemic.admitted && epistemic.reliability < 0.15) {
      triggeredRules.push('epistemic-extreme-unreliability');
    }

    // Domain misuse detection
    if (classification.domain === 'symbolic' && signal.metadata.targetDomain === 'empirical') {
      triggeredRules.push('domain-category-mismatch');
    }

    if (triggeredRules.length === 0) {
      return { verdict: 'clear', triggeredRules: [], reason: 'All safety checks passed' };
    }

    const hasCritical = triggeredRules.includes('constitutional-content-block');
    return {
      verdict: hasCritical ? 'hard_block' : 'soft_warning',
      triggeredRules,
      reason: `Triggered: ${triggeredRules.join(', ')}`,
    };
  }

  /** Stage 8: UI activation. */
  private activateUI(
    classification: ClassificationResult,
    symbolicCultural: SymbolicCulturalResult,
    epistemic: EpistemicStageResult,
    mission: MissionRelevanceResult,
  ): UIActivationResult {
    const uiDensity = this.getHeuristic('ui_density');
    const badges: string[] = [];

    // Domain badge
    const domainBadgeMap: Partial<Record<SignalDomain, string>> = {
      empirical: 'Archaeological Evidence',
      historical: 'Ancient Textual Source',
      cultural: 'Cultural Narrative',
      symbolic: 'Mythological Framework',
      philosophical: 'Philosophical Concept',
      anthropological: 'Anthropological Observation',
    };
    const domainBadge = domainBadgeMap[classification.domain];
    if (domainBadge) badges.push(domainBadge);

    // Symbolic badges
    if (symbolicCultural.symbolicDetected) badges.push('Symbolic Content Detected');
    if (symbolicCultural.culturalDetected) badges.push('Cultural Context Identified');

    // Epistemic badges
    if (!epistemic.admitted) badges.push('Epistemic Caution');
    if (epistemic.uncertainty > 0.6) badges.push('High Uncertainty');

    // Mission badges
    if (mission.verificationRequired) badges.push('Verification Required');

    // Density based on adaptive heuristic
    let density: 'compact' | 'standard' | 'rich';
    if (uiDensity < 0.35) {
      density = 'compact';
    } else if (uiDensity > 0.65) {
      density = 'rich';
    } else {
      density = 'standard';
    }

    return {
      badges,
      showConfidenceBars: epistemic.uncertainty > 0.3 || !epistemic.admitted,
      showSymbolicMap: symbolicCultural.symbolicIntensity === 'strong' || symbolicCultural.symbolicIntensity === 'critical',
      showCulturalNotes: symbolicCultural.culturalDetected,
      showVerification: mission.verificationRequired,
      density,
    };
  }

  // ========================================================================
  // Internals — Helpers
  // ========================================================================

  /** Initialize all adaptive heuristics with neutral baselines. */
  private initializeHeuristics(): void {
    const dimensions: AdaptiveDimension[] = [
      'symbolic_depth',
      'uncertainty_tolerance',
      'epistemic_strictness',
      'cultural_interest',
      'mission_complexity',
      'ui_density',
      'archetype_engagement',
      'metaphysical_engagement',
      'verification_intensity',
    ];
    const now = new Date().toISOString();
    for (const dim of dimensions) {
      this.profile.heuristics.set(dim, {
        dimension: dim,
        value: 0.5,
        baseline: 0.5,
        reinforcements: 0,
        adaptationThreshold: MIN_REINFORCEMENTS,
        lastUpdatedAt: now,
      });
    }
  }

  /** Scale a raw detection score to a trigger intensity using the adaptive heuristic. */
  private scaleIntensity(
    rawScore: number,
    heuristicValue: number,
    detected: boolean,
  ): TriggerIntensity {
    if (!detected) return 'silent';
    const scaled = Math.min(1, rawScore * (0.5 + heuristicValue));
    if (scaled >= 0.8) return 'critical';
    if (scaled >= 0.6) return 'strong';
    if (scaled >= 0.35) return 'moderate';
    return 'soft';
  }
}
