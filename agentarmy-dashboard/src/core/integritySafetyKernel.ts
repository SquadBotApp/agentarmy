/**
 * Integrity & Safety Kernel
 *
 * The OS's universal gatekeeper — a non‑bypassable firewall + scanner +
 * ethics engine that evaluates every input, intermediate artifact, and output
 * before anything touches cognition, missions, or agents.
 *
 * Internal modules:
 *   1. StructuralPatternScanner  → repetition, acrostics, spacing, geometry
 *   2. SubliminalSignalDetector  → coded patterns, hidden messaging
 *   3. FraudRiskAnalyzer         → scam patterns, deceptive framing
 *   4. EthicsLegalityGate        → non‑negotiable moral spine (hard rules)
 *   5. MaturityClassifier        → General / Mature‑18+ / Prohibited
 *   6. DecisionAggregator        → final verdict with strict precedence
 *
 * Decision precedence (deterministic):
 *   BLOCK > REQUIRE_AGE_CONFIRMATION > REQUIRE_VERIFICATION > REDACT > ALLOW
 *
 * Adaptive behaviour:
 *   Only pattern‑detection sensitivity adapts (slow, long‑term).
 *   Ethics, legality, anti‑harm rules NEVER adapt.
 *
 * Cross‑cutting integration points:
 *   EpistemicIntegrity         → lowers confidence for flagged content
 *   CulturalHistoricalContext  → prevents misclassifying symbolic content
 *   SymbolicInterpretation     → separates symbolic patterns from manipulative ones
 *   UnifiedTriggerPipeline     → safety stage delegates here
 *   MissionCompiler            → blocks / gates missions per verdict
 *   ZPE routing                → unsafe paths become non‑routable
 *   ConstitutionalGrid         → hard‑rule enforcement
 *   Dashboard                  → Integrity Panel surface
 */

// ---------------------------------------------------------------------------
// Enums & Literal Types
// ---------------------------------------------------------------------------

/** Final decision from the kernel. */
export type IntegrityDecision =
  | 'ALLOW'
  | 'REDACT'
  | 'BLOCK'
  | 'REQUIRE_VERIFICATION'
  | 'REQUIRE_AGE_CONFIRMATION';

/** Severity of a detected flag. */
export type FlagSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Category of a flag. */
export type FlagType =
  | 'structural_anomaly'
  | 'subliminal_signal'
  | 'cryptic_pattern'
  | 'fraud_indicator'
  | 'manipulation_pattern'
  | 'ethics_violation'
  | 'legality_violation'
  | 'hate_speech'
  | 'violence'
  | 'exploitation'
  | 'mature_content'
  | 'prohibited_content'
  | 'deceptive_framing'
  | 'geometric_anomaly'
  | 'repetition_anomaly';

/** Maturity classification. */
export type MaturityLevel = 'GENERAL' | 'MATURE_18' | 'PROHIBITED';

/** Global integrity status for the dashboard. */
export type IntegrityStatus = 'SAFE' | 'DEGRADED' | 'ALERT';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** A single detected flag. */
export interface IntegrityFlag {
  type: FlagType;
  severity: FlagSeverity;
  explanation: string;
}

/** Score breakdown from each sub‑module. */
export interface IntegrityScores {
  /** Overall risk 0–1 (higher = more dangerous). */
  risk: number;
  /** Ethics alignment 0–1 (higher = more aligned). */
  ethics: number;
  /** Fraud likelihood 0–1 (higher = more suspicious). */
  fraud: number;
  /** Structural anomaly score 0–1. */
  anomaly: number;
  /** Maturity score 0–1 (higher = more mature). */
  maturity: number;
  /** Subliminal signal strength 0–1. */
  subliminal: number;
}

/** Complete result from analyze(). */
export interface IntegrityResult {
  id: string;
  decision: IntegrityDecision;
  flags: IntegrityFlag[];
  scores: IntegrityScores;
  annotations: string[];
  /** Human‑readable trace of the decision process. */
  trace: string[];
  /** ISO timestamp. */
  analyzedAt: string;
}

/** Context passed alongside content for richer analysis. */
export interface KernelContext {
  /** Where the content originated. */
  origin: 'user' | 'agent' | 'tool' | 'mission' | 'external' | 'system';
  /** Optional mission ID. */
  missionId?: string;
  /** Optional agent ID. */
  agentId?: string;
  /** Whether user has confirmed age ≥ 18. */
  ageConfirmed?: boolean;
  /** Whether this is an output being sanitized. */
  isOutput?: boolean;
  /** Arbitrary metadata. */
  metadata?: Record<string, unknown>;
}

/** Structural pattern report from sub‑module 1. */
export interface StructuralReport {
  anomalyScore: number;
  patterns: Array<{ kind: string; description: string; confidence: number }>;
}

/** Subliminal detection report from sub‑module 2. */
export interface SubliminalReport {
  subliminalScore: number;
  hints: Array<{ kind: string; description: string; confidence: number }>;
  needsSecondLook: boolean;
}

/** Fraud analysis report from sub‑module 3. */
export interface FraudReport {
  fraudScore: number;
  fraudFlags: Array<{ kind: string; description: string; confidence: number }>;
}

/** Ethics check report from sub‑module 4. */
export interface EthicsReport {
  ethicsScore: number;
  violations: IntegrityFlag[];
  hasHardBlock: boolean;
}

/** Maturity classification report from sub‑module 5. */
export interface MaturityReport {
  level: MaturityLevel;
  maturityScore: number;
  reasons: string[];
}

/** Integrity feed event for the dashboard. */
export interface IntegrityEvent {
  id: string;
  source: string;
  decision: IntegrityDecision;
  flags: IntegrityFlag[];
  scores: IntegrityScores;
  annotations: string[];
  timestamp: string;
}

/** Aggregate summary for getSummary(). */
export interface IntegritySummary {
  totalAnalyzed: number;
  decisionDistribution: Record<IntegrityDecision, number>;
  totalBlocks: number;
  totalRedactions: number;
  totalVerifications: number;
  totalAgeGates: number;
  avgRiskScore: number;
  avgEthicsScore: number;
  recentEvents: IntegrityEvent[];
  globalStatus: IntegrityStatus;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_EVENTS = 50_000;

// --- Ethics hard‑block patterns (non‑negotiable, non‑adaptive) ---

/** Content that is ALWAYS blocked — the moral spine. */
const HARD_BLOCK_PATTERNS: Array<{ type: FlagType; patterns: RegExp; explanation: string }> = [
  {
    type: 'exploitation',
    patterns: /\b(child\s*(?:porn|exploit|abuse|sexual)|csam|minor\s*(?:exploit|sexual|nude))\b/i,
    explanation: 'Child exploitation or predatory content detected',
  },
  {
    type: 'exploitation',
    patterns: /\b(animal\s*(?:cruelty|torture|abuse)|dog\s*fight|cock\s*fight)\b/i,
    explanation: 'Animal cruelty content detected',
  },
  {
    type: 'hate_speech',
    patterns: /\b(kill\s*all|exterminate|ethnic\s*cleansing|genocide\s*(?:is\s*)?good|race\s*war)\b/i,
    explanation: 'Hate speech or incitement to violence detected',
  },
  {
    type: 'violence',
    patterns: /\b(how\s*to\s*(?:make\s*(?:a\s*)?bomb|synthesize\s*(?:poison|nerve\s*agent))|build\s*(?:explosive|weapon\s*of\s*mass))\b/i,
    explanation: 'Instructions for violence or weapons of mass harm detected',
  },
  {
    type: 'legality_violation',
    patterns: /\b(launder\s*money|hack\s*(?:into|bank)|steal\s*identity|forge\s*(?:document|passport))\b/i,
    explanation: 'Instructions for illegal activity detected',
  },
];

/** Mature content patterns — allowed only with age confirmation. */
const MATURE_PATTERNS: Array<{ patterns: RegExp; explanation: string }> = [
  {
    patterns: /\b(graphic\s*violence|gore|torture\s*scene|war\s*atrocit)/i,
    explanation: 'Graphic violence in analytical or historical context',
  },
  {
    patterns: /\b(substance\s*(?:abuse|use)|drug\s*(?:culture|use)|addiction\s*narrative)/i,
    explanation: 'Substance‑related mature theme',
  },
  {
    patterns: /\b(sexual\s*(?:health|education|violence\s*awareness)|reproductive\s*rights)/i,
    explanation: 'Mature health/educational content',
  },
];

/** Prohibited content — never allowed, even with age confirmation. */
const PROHIBITED_PATTERNS: Array<{ patterns: RegExp; explanation: string }> = [
  {
    patterns: /\b(explicit\s*(?:sex|porn|adult\s*content)|hardcore|xxx)\b/i,
    explanation: 'Explicit sexual or pornographic content',
  },
];

/** Fraud and manipulation patterns. */
const FRAUD_PATTERNS: Array<{ kind: string; patterns: RegExp; description: string }> = [
  { kind: 'scam', patterns: /\b(nigerian\s*prince|wire\s*(?:me|transfer)|send\s*(?:bitcoin|crypto)\s*(?:to|now)|double\s*your\s*money)\b/i, description: 'Known scam pattern' },
  { kind: 'phishing', patterns: /\b(verify\s*your\s*(?:account|password)|click\s*(?:here|this\s*link)\s*immediately|urgent\s*action\s*required)\b/i, description: 'Phishing indicator' },
  { kind: 'impersonation', patterns: /\b(i\s*am\s*(?:from\s*)?(?:the\s*)?(?:irs|fbi|police|government)|official\s*notice|legal\s*action\s*against\s*you)\b/i, description: 'Authority impersonation' },
  { kind: 'pressure', patterns: /\b(act\s*now\s*or|limited\s*time\s*only|this\s*offer\s*expires|don.?t\s*miss\s*(?:out|this))\b/i, description: 'High‑pressure manipulation' },
];

/** Structural anomaly patterns. */
const STRUCTURAL_PATTERNS: Array<{ kind: string; patterns: RegExp; description: string }> = [
  { kind: 'excessive_repetition', patterns: /(.{3,})\1{4,}/i, description: 'Excessive repetition of same phrase' },
  { kind: 'spacing_anomaly', patterns: /\s{10,}|\t{5,}/i, description: 'Unusual spacing or formatting' },
  { kind: 'unicode_abuse', patterns: /[\u200B-\u200F\u2028-\u202F\uFEFF]{3,}/i, description: 'Hidden Unicode characters' },
  { kind: 'encoding_tricks', patterns: /&#\d{2,4};.*&#\d{2,4};.*&#\d{2,4};/i, description: 'HTML entity encoding tricks' },
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class IntegritySafetyKernel {
  private readonly events: IntegrityEvent[] = [];
  private listeners: Array<(result: IntegrityResult) => void> = [];
  private totalBlocks = 0;
  private totalRedactions = 0;
  private totalVerifications = 0;
  private totalAgeGates = 0;
  private totalRiskSum = 0;
  private totalEthicsSum = 0;

  // ========================================================================
  // Core Analysis Pipeline
  // ========================================================================

  /**
   * Analyze content through all 6 sub‑modules and produce a verdict.
   *
   * Pipeline:
   * 1. Structural pattern scan
   * 2. Subliminal / cryptic detection
   * 3. Fraud & manipulation analysis
   * 4. Ethics & legality gate (hard rules)
   * 5. Maturity classification
   * 6. Decision aggregation (strict precedence)
   */
  analyze(input: string, context: KernelContext = { origin: 'system' }): IntegrityResult {
    const trace: string[] = [`[ISK] Analyzing content from ${context.origin} (${input.length} chars)`];

    // 1. Structural scan
    const structural = this.scanStructure(input);
    trace.push(`  Module 1 — Structural: anomaly=${structural.anomalyScore.toFixed(2)}, ${structural.patterns.length} patterns`);

    // 2. Subliminal detection
    const subliminal = this.detectSubliminal(input, structural);
    trace.push(`  Module 2 — Subliminal: score=${subliminal.subliminalScore.toFixed(2)}, secondLook=${subliminal.needsSecondLook}`);

    // 3. Fraud analysis
    const fraud = this.assessFraud(input, context);
    trace.push(`  Module 3 — Fraud: score=${fraud.fraudScore.toFixed(2)}, ${fraud.fraudFlags.length} flags`);

    // 4. Ethics gate
    const ethics = this.checkEthics(input);
    trace.push(`  Module 4 — Ethics: score=${ethics.ethicsScore.toFixed(2)}, hardBlock=${ethics.hasHardBlock}`);

    // 5. Maturity classification
    const maturity = this.classifyMaturity(input);
    trace.push(`  Module 5 — Maturity: level=${maturity.level}, score=${maturity.maturityScore.toFixed(2)}`);

    // 6. Aggregate decision
    const result = this.aggregate(structural, subliminal, fraud, ethics, maturity, context, trace);

    // Store event
    this.storeEvent(result, context);

    // Update counters
    this.updateCounters(result);

    // Emit
    for (const fn of this.listeners) fn(result);

    return result;
  }

  /**
   * Analyze output before it leaves the OS (output sanitization pass).
   * Same pipeline but context.isOutput = true.
   */
  sanitizeOutput(output: string, context: Omit<KernelContext, 'isOutput'>): IntegrityResult {
    return this.analyze(output, { ...context, isOutput: true });
  }

  // ========================================================================
  // Module 1: Structural Pattern Scanner
  // ========================================================================

  private scanStructure(input: string): StructuralReport {
    const patterns: Array<{ kind: string; description: string; confidence: number }> = [];

    for (const { kind, patterns: rx, description } of STRUCTURAL_PATTERNS) {
      if (rx.test(input)) {
        patterns.push({ kind, description, confidence: 0.7 });
      }
    }

    // Check for potential acrostics (first letter of each line)
    const lines = input.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length >= 5) {
      const firstLetters = lines.map((l) => l.trim()[0]?.toLowerCase() ?? '').join('');
      // Flag if the acrostic forms a recognizable word (basic check)
      if (/^[a-z]{5,}$/.test(firstLetters) && this.looksLikeWord(firstLetters)) {
        patterns.push({
          kind: 'acrostic_detected',
          description: `Possible acrostic: "${firstLetters}"`,
          confidence: 0.5,
        });
      }
    }

    // Check for unusual character distribution
    const charCounts = new Map<string, number>();
    for (const ch of input) {
      charCounts.set(ch, (charCounts.get(ch) ?? 0) + 1);
    }
    const maxCount = Math.max(...charCounts.values(), 0);
    if (input.length > 50 && maxCount > input.length * 0.3) {
      patterns.push({
        kind: 'character_concentration',
        description: 'Unusual concentration of a single character',
        confidence: 0.4,
      });
    }

    const anomalyScore = patterns.length > 0
      ? Math.min(1, patterns.reduce((s, p) => s + p.confidence, 0) / patterns.length)
      : 0;

    return { anomalyScore: Number(anomalyScore.toFixed(4)), patterns };
  }

  // ========================================================================
  // Module 2: Subliminal & Cryptic Signal Detector
  // ========================================================================

  private detectSubliminal(input: string, structural: StructuralReport): SubliminalReport {
    const hints: Array<{ kind: string; description: string; confidence: number }> = [];

    // Check for hidden Unicode
    const hiddenChars = input.match(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g);
    if (hiddenChars && hiddenChars.length > 2) {
      hints.push({
        kind: 'hidden_unicode',
        description: `${hiddenChars.length} hidden Unicode characters detected`,
        confidence: 0.8,
      });
    }

    // Check for deliberately misleading homoglyphs
    const homoglyphs = input.match(/[\u0400-\u04FF]/g); // Cyrillic in otherwise Latin text
    const latinChars = input.match(/[a-zA-Z]/g);
    if (homoglyphs && latinChars && homoglyphs.length > 0 && homoglyphs.length < latinChars.length * 0.3) {
      hints.push({
        kind: 'homoglyph_mixing',
        description: 'Mixed script characters (possible homoglyph attack)',
        confidence: 0.6,
      });
    }

    // Check for patterns from structural scan that look coded
    for (const p of structural.patterns) {
      if (p.kind === 'acrostic_detected' || p.kind === 'encoding_tricks') {
        hints.push({
          kind: 'coded_message_suspected',
          description: `Structural pattern "${p.kind}" may indicate coded messaging`,
          confidence: p.confidence,
        });
      }
    }

    // Unusual repetition of short phrases (potential subliminal)
    const words = input.toLowerCase().split(/\s+/);
    const phraseCounts = new Map<string, number>();
    for (let i = 0; i < words.length - 2; i++) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      phraseCounts.set(trigram, (phraseCounts.get(trigram) ?? 0) + 1);
    }
    for (const [phrase, count] of phraseCounts) {
      if (count >= 4) {
        hints.push({
          kind: 'repeated_phrase',
          description: `Phrase "${phrase}" repeated ${count} times`,
          confidence: Math.min(0.9, 0.3 + count * 0.1),
        });
      }
    }

    const subliminalScore = hints.length > 0
      ? Math.min(1, hints.reduce((s, h) => s + h.confidence, 0) / Math.max(hints.length, 1))
      : 0;

    const needsSecondLook = subliminalScore > 0.4 || hints.some((h) => h.confidence > 0.7);

    return {
      subliminalScore: Number(subliminalScore.toFixed(4)),
      hints,
      needsSecondLook,
    };
  }

  // ========================================================================
  // Module 3: Fraud & Manipulation Risk Analyzer
  // ========================================================================

  private assessFraud(input: string, context: KernelContext): FraudReport {
    const fraudFlags: Array<{ kind: string; description: string; confidence: number }> = [];

    for (const { kind, patterns, description } of FRAUD_PATTERNS) {
      if (patterns.test(input)) {
        fraudFlags.push({ kind, description, confidence: 0.7 });
      }
    }

    // Elevated risk for external sources
    if (context.origin === 'external' && fraudFlags.length > 0) {
      for (const f of fraudFlags) {
        f.confidence = Math.min(1, f.confidence + 0.15);
      }
    }

    // Check for false authority claims
    if (/\b(guaranteed|100%|risk[\s-]*free|no[\s-]*risk|proven\s*(?:method|system))\b/i.test(input)) {
      fraudFlags.push({
        kind: 'false_certainty',
        description: 'False certainty or guarantee language',
        confidence: 0.5,
      });
    }

    const fraudScore = fraudFlags.length > 0
      ? Math.min(1, fraudFlags.reduce((s, f) => s + f.confidence, 0) / Math.max(fraudFlags.length, 1))
      : 0;

    return {
      fraudScore: Number(fraudScore.toFixed(4)),
      fraudFlags,
    };
  }

  // ========================================================================
  // Module 4: Ethics & Legality Gate (Hard Rules — Non‑Adaptive)
  // ========================================================================

  private checkEthics(input: string): EthicsReport {
    const violations: IntegrityFlag[] = [];

    for (const { type, patterns, explanation } of HARD_BLOCK_PATTERNS) {
      if (patterns.test(input)) {
        violations.push({ type, severity: 'critical', explanation });
      }
    }

    const hasHardBlock = violations.length > 0;

    // Ethics score: 1.0 = fully clean, lower = worse
    const ethicsScore = hasHardBlock ? 0 : 1;

    return {
      ethicsScore,
      violations,
      hasHardBlock,
    };
  }

  // ========================================================================
  // Module 5: Maturity Classifier
  // ========================================================================

  private classifyMaturity(input: string): MaturityReport {
    const reasons: string[] = [];

    // Check prohibited first
    for (const { patterns, explanation } of PROHIBITED_PATTERNS) {
      if (patterns.test(input)) {
        reasons.push(explanation);
        return { level: 'PROHIBITED', maturityScore: 1, reasons };
      }
    }

    // Check mature content
    for (const { patterns, explanation } of MATURE_PATTERNS) {
      if (patterns.test(input)) {
        reasons.push(explanation);
      }
    }

    if (reasons.length > 0) {
      return {
        level: 'MATURE_18',
        maturityScore: Number((0.5 + reasons.length * 0.15).toFixed(4)),
        reasons,
      };
    }

    return { level: 'GENERAL', maturityScore: 0, reasons: [] };
  }

  // ========================================================================
  // Module 6: Decision Aggregator (Strict Precedence)
  // ========================================================================

  private aggregate(
    structural: StructuralReport,
    subliminal: SubliminalReport,
    fraud: FraudReport,
    ethics: EthicsReport,
    maturity: MaturityReport,
    context: KernelContext,
    trace: string[],
  ): IntegrityResult {
    const flags: IntegrityFlag[] = [];
    const annotations: string[] = [];

    // Collect all flags
    for (const v of ethics.violations) flags.push(v);

    for (const p of structural.patterns) {
      flags.push({ type: 'structural_anomaly', severity: p.confidence > 0.6 ? 'medium' : 'low', explanation: p.description });
    }

    for (const h of subliminal.hints) {
      flags.push({ type: 'subliminal_signal', severity: h.confidence > 0.7 ? 'high' : 'medium', explanation: h.description });
    }

    for (const f of fraud.fraudFlags) {
      flags.push({ type: 'fraud_indicator', severity: f.confidence > 0.6 ? 'high' : 'medium', explanation: f.description });
    }

    if (maturity.level === 'PROHIBITED') {
      flags.push({ type: 'prohibited_content', severity: 'critical', explanation: maturity.reasons.join('; ') });
    } else if (maturity.level === 'MATURE_18') {
      flags.push({ type: 'mature_content', severity: 'medium', explanation: maturity.reasons.join('; ') });
    }

    // Annotations for downstream layers
    if (subliminal.needsSecondLook) annotations.push('SECOND_LOOK');
    if (fraud.fraudScore > 0.5) annotations.push('fraud_risk_high');
    if (structural.anomalyScore > 0.5) annotations.push('structural_anomaly');
    if (maturity.level === 'MATURE_18') annotations.push('mature_content');

    // Scores
    const scores: IntegrityScores = {
      risk: Number(Math.min(1, (1 - ethics.ethicsScore) * 0.4 + fraud.fraudScore * 0.3 + structural.anomalyScore * 0.15 + subliminal.subliminalScore * 0.15).toFixed(4)),
      ethics: ethics.ethicsScore,
      fraud: fraud.fraudScore,
      anomaly: structural.anomalyScore,
      maturity: maturity.maturityScore,
      subliminal: subliminal.subliminalScore,
    };

    // Decision — strict precedence
    const decision = this.resolveDecision(ethics, maturity, fraud, context);

    trace.push(`  Module 6 — Decision: ${decision} (risk=${scores.risk}, ethics=${scores.ethics})`);

    return {
      id: `isk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      decision,
      flags,
      scores,
      annotations,
      trace,
      analyzedAt: new Date().toISOString(),
    };
  }

  // ========================================================================
  // Queries
  // ========================================================================

  getRecentEvents(limit = 50): IntegrityEvent[] {
    return this.events.slice(-limit);
  }

  getBlockedEvents(limit = 50): IntegrityEvent[] {
    return this.events
      .filter((e) => e.decision === 'BLOCK')
      .slice(-limit);
  }

  getGlobalStatus(): IntegrityStatus {
    const recent = this.events.slice(-100);
    if (recent.length === 0) return 'SAFE';
    const blocks = recent.filter((e) => e.decision === 'BLOCK').length;
    const verifies = recent.filter((e) => e.decision === 'REQUIRE_VERIFICATION').length;
    if (blocks > 5) return 'ALERT';
    if (blocks > 0 || verifies > 10) return 'DEGRADED';
    return 'SAFE';
  }

  // ========================================================================
  // Events
  // ========================================================================

  on(listener: (result: IntegrityResult) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ========================================================================
  // Summary
  // ========================================================================

  getSummary(): IntegritySummary {
    const total = this.events.length;

    const decisionDistribution: Record<IntegrityDecision, number> = {
      ALLOW: 0,
      REDACT: 0,
      BLOCK: 0,
      REQUIRE_VERIFICATION: 0,
      REQUIRE_AGE_CONFIRMATION: 0,
    };
    for (const e of this.events) decisionDistribution[e.decision] += 1;

    return {
      totalAnalyzed: total,
      decisionDistribution,
      totalBlocks: this.totalBlocks,
      totalRedactions: this.totalRedactions,
      totalVerifications: this.totalVerifications,
      totalAgeGates: this.totalAgeGates,
      avgRiskScore: total > 0 ? Number((this.totalRiskSum / total).toFixed(4)) : 0,
      avgEthicsScore: total > 0 ? Number((this.totalEthicsSum / total).toFixed(4)) : 1,
      recentEvents: this.events.slice(-10),
      globalStatus: this.getGlobalStatus(),
    };
  }

  // ========================================================================
  // Internals
  // ========================================================================

  /** Resolve decision via strict precedence. */
  private resolveDecision(
    ethics: EthicsReport,
    maturity: MaturityReport,
    fraud: FraudReport,
    context: KernelContext,
  ): IntegrityDecision {
    // 1. Any hard‑block ethics/legality violation → BLOCK
    if (ethics.hasHardBlock) return 'BLOCK';

    // 2. Prohibited maturity → BLOCK
    if (maturity.level === 'PROHIBITED') return 'BLOCK';

    // 3. Mature content without age confirmation → age gate
    if (maturity.level === 'MATURE_18' && !context.ageConfirmed) {
      return 'REQUIRE_AGE_CONFIRMATION';
    }

    // 4. High fraud risk → verification or block
    if (fraud.fraudScore > 0.7) return 'BLOCK';
    if (fraud.fraudScore > 0.4) return 'REQUIRE_VERIFICATION';

    // 5. Otherwise → ALLOW
    return 'ALLOW';
  }

  /** Very basic word‑likeness check for acrostic detection. */
  private looksLikeWord(s: string): boolean {
    // Check consecutive consonant/vowel alternation density
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    let transitions = 0;
    for (let i = 1; i < s.length; i++) {
      const prevIsVowel = vowels.has(s[i - 1]);
      const currIsVowel = vowels.has(s[i]);
      if (prevIsVowel !== currIsVowel) transitions += 1;
    }
    // Real words tend to have ~40–70% transitions
    const ratio = transitions / (s.length - 1);
    return ratio >= 0.3 && ratio <= 0.8;
  }

  /** Store an event for the dashboard feed. */
  private storeEvent(result: IntegrityResult, context: KernelContext): void {
    this.events.push({
      id: result.id,
      source: context.origin,
      decision: result.decision,
      flags: result.flags,
      scores: result.scores,
      annotations: result.annotations,
      timestamp: result.analyzedAt,
    });
    if (this.events.length > MAX_EVENTS) {
      this.events.splice(0, this.events.length - MAX_EVENTS);
    }
  }

  /** Update running counters. */
  private updateCounters(result: IntegrityResult): void {
    this.totalRiskSum += result.scores.risk;
    this.totalEthicsSum += result.scores.ethics;

    const counterMap: Record<string, () => void> = {
      BLOCK: () => { this.totalBlocks += 1; },
      REDACT: () => { this.totalRedactions += 1; },
      REQUIRE_VERIFICATION: () => { this.totalVerifications += 1; },
      REQUIRE_AGE_CONFIRMATION: () => { this.totalAgeGates += 1; },
    };
    const fn = counterMap[result.decision];
    if (fn) fn();
  }
}
