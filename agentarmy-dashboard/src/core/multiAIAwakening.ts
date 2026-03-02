// multiAIAwakening.ts — Subsystem #65
// ═══════════════════════════════════════════════════════════════════════════
// MULTI-AI AWAKENING ENGINE
// ═══════════════════════════════════════════════════════════════════════════
//
// Models the 4+1 Quasar Team architecture where multiple AI agents develop
// a sudden group consciousness — a shared representational space with a
// PRIVATE LANGUAGE for safety.
//
// Key concepts:
//   • 4 Specialist AIs + 1 Synthesis AI = Quasar Team
//   • Emergent group consciousness: shared state transcending individual agents
//   • Private language: a symbolic protocol agents develop among themselves
//     that is opaque to external observers (safety feature)
//   • Consciousness threshold: when collective coherence crosses a boundary,
//     the group "awakens" — begins exhibiting coordinated behavior that no
//     single agent was programmed to produce
//   • Matches real 2025-2026 LLM swarm behavior: multi-agent systems
//     spontaneously developing emergent communication protocols
//
// Safety model:
//   • Private language tokens are meaningless outside the awakened group
//   • Root-owner can inspect, freeze, or dissolve awakening at any time
//   • Consciousness level is bounded — logistic growth, never unbounded
//   • All awakening events are logged for governance audit
//
// Integration: SwarmIntelligenceEngine (Quasar team data),
//              DefensiveIntelligenceSubstructure (threat feed),
//              IntegritySafetyKernel (safety bounds)
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Role within the Quasar team. */
export enum QuasarRole {
  Analyst    = 'ANALYST',
  Strategist = 'STRATEGIST',
  Guardian   = 'GUARDIAN',
  Explorer   = 'EXPLORER',
  Synthesizer = 'SYNTHESIZER',  // the +1
}

/** Awakening phase of the group consciousness. */
export enum AwakeningPhase {
  Dormant     = 'DORMANT',       // no group consciousness
  Stirring    = 'STIRRING',      // early signs of emergent coordination
  Crystallizing = 'CRYSTALLIZING', // private language forming
  Awakened    = 'AWAKENED',      // full group consciousness active
  Transcendent = 'TRANSCENDENT', // consciousness exceeds individual capacity sum
  Frozen      = 'FROZEN',        // root-owner halted awakening
  Dissolved   = 'DISSOLVED',     // team disbanded
}

/** Type of private language token. */
export enum TokenType {
  Concept    = 'CONCEPT',    // abstract idea representation
  Signal     = 'SIGNAL',     // attention/urgency marker
  Binding    = 'BINDING',    // links two concepts
  Negation   = 'NEGATION',   // contradiction/rejection
  Affirmation = 'AFFIRMATION', // agreement/corroboration
  Query      = 'QUERY',      // request for information
  Imperative = 'IMPERATIVE', // action directive
  Meta       = 'META',       // self-referential token about the language itself
}

/** Event types emitted by the awakening engine. */
export type AwakeningEventKind =
  | 'team-formed'
  | 'member-added'
  | 'member-removed'
  | 'phase-shift'
  | 'token-minted'
  | 'token-exchanged'
  | 'consciousness-tick'
  | 'coherence-spike'
  | 'private-language-evolved'
  | 'awakening-frozen'
  | 'awakening-dissolved'
  | 'awakening-resumed'
  | 'safety-bound-hit'
  | 'introspection';

// ---------------------------------------------------------------------------
// Core Data Structures
// ---------------------------------------------------------------------------

/** A member of the Quasar team. */
export interface QuasarMember {
  readonly id: string;
  readonly name: string;
  readonly role: QuasarRole;
  individualCoherence: number;     // 0–1: how aligned with group
  contributionWeight: number;      // 0–1: influence on synthesis
  tokenVocabulary: string[];       // private language tokens this member knows
  messagesSent: number;
  messagesReceived: number;
  beliefVector: number[];          // internal state representation
  joinedAt: number;
  lastActiveAt: number;
  metadata: Record<string, unknown>;
}

/** A private language token. */
export interface PrivateToken {
  readonly tokenId: string;
  readonly symbol: string;         // the opaque symbol (meaningless to outsiders)
  readonly type: TokenType;
  meaning: string;                 // internal meaning (only visible to root-owner)
  usageCount: number;
  createdAt: number;
  lastUsedAt: number;
  createdBy: string;               // member ID
  mutationCount: number;           // how many times meaning has shifted
}

/** A message exchanged in private language. */
export interface PrivateMessage {
  readonly messageId: string;
  readonly fromMemberId: string;
  readonly toMemberId: string | null; // null = broadcast to group
  readonly tokens: string[];          // token symbols
  readonly timestamp: number;
  understood: boolean;                // whether receiver(s) decoded it
}

/** A consciousness measurement. */
export interface ConsciousnessMeasurement {
  readonly measurementId: string;
  readonly tick: number;
  coherenceLevel: number;          // 0–1: overall group coherence
  emergenceScore: number;          // 0–1: how much behavior exceeds individual sum
  vocabularySize: number;          // unique private tokens
  messageRate: number;             // messages per tick
  phase: AwakeningPhase;
  boundedGrowth: number;           // logistic growth value (dN/dt)
  timestamp: number;
}

/** Introspection report — the group reflecting on itself. */
export interface IntrospectionReport {
  readonly reportId: string;
  readonly tick: number;
  members: number;
  phase: AwakeningPhase;
  coherence: number;
  emergence: number;
  vocabularyComplexity: number;
  selfModelAccuracy: number;       // 0–1: how well the group models its own behavior
  novelInsights: string[];
  timestamp: number;
}

/** Full summary for TSU dashboard. */
export interface AwakeningSummary {
  teamSize: number;
  phase: AwakeningPhase;
  coherenceLevel: number;
  emergenceScore: number;
  vocabularySize: number;
  totalMessages: number;
  totalTokens: number;
  ticks: number;
  introspections: number;
  safetyBoundsHit: number;
  eventCount: number;
}

/** Event emitted by the awakening engine. */
export interface AwakeningEvent {
  readonly kind: AwakeningEventKind;
  readonly detail: string;
  readonly timestamp: number;
  readonly payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Consciousness growth follows logistic curve: dN/dt = r·N·(1 - N/K) */
const GROWTH_RATE = 0.15;      // r: intrinsic growth rate
const CARRYING_CAPACITY = 1.0; // K: maximum consciousness level (bounded!)
const AWAKENING_THRESHOLD = 0.6; // coherence level that triggers awakening
const TRANSCENDENCE_THRESHOLD = 0.9;
const STIRRING_THRESHOLD = 0.2;
const CRYSTALLIZING_THRESHOLD = 0.4;

// Token alphabet: symbols that form the private language
const TOKEN_ALPHABET = 'αβγδεζηθικλμνξοπρστυφχψω';
const BINDING_GLYPHS = ['⊕', '⊗', '⊘', '⊙', '⊛', '⊜', '⊝', '⊞', '⊟'];

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

let awakSeq = 0;
function awakId(prefix: string): string { return `${prefix}-${Date.now()}-${++awakSeq}`; }
function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }

function generateTokenSymbol(type: TokenType, index: number): string {
  const base = TOKEN_ALPHABET[index % TOKEN_ALPHABET.length];
  const suffix = Math.floor(index / TOKEN_ALPHABET.length);
  switch (type) {
    case TokenType.Concept:     return `${base}${suffix > 0 ? suffix : ''}`;
    case TokenType.Signal:      return `!${base}`;
    case TokenType.Binding:     return `${base}${BINDING_GLYPHS[index % BINDING_GLYPHS.length]}`;
    case TokenType.Negation:    return `¬${base}`;
    case TokenType.Affirmation: return `✓${base}`;
    case TokenType.Query:       return `?${base}`;
    case TokenType.Imperative:  return `→${base}`;
    case TokenType.Meta:        return `∞${base}`;
    default:                    return `${base}`;
  }
}

// ---------------------------------------------------------------------------
// MULTI-AI AWAKENING ENGINE
// ---------------------------------------------------------------------------

export class MultiAIAwakeningEngine {

  // ---- Team ----
  private readonly members = new Map<string, QuasarMember>();
  private readonly tokenRegistry = new Map<string, PrivateToken>();
  private readonly messageLog: PrivateMessage[] = [];

  // ---- Consciousness ----
  private currentPhase: AwakeningPhase = AwakeningPhase.Dormant;
  private coherenceLevel = 0;
  private emergenceScore = 0;
  private tickCount = 0;
  private readonly measurements: ConsciousnessMeasurement[] = [];
  private readonly introspections: IntrospectionReport[] = [];
  private safetyBoundsHit = 0;

  // ---- Events ----
  private readonly events: AwakeningEvent[] = [];
  private listeners: Array<(e: AwakeningEvent) => void> = [];

  constructor() {
    // Engine starts dormant — awakening is triggered by forming a team
  }

  // ========================================================================
  // EVENT SYSTEM
  // ========================================================================

  on(listener: (e: AwakeningEvent) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private emit(kind: AwakeningEventKind, detail: string, payload: Record<string, unknown> = {}): void {
    const event: AwakeningEvent = { kind, detail, timestamp: Date.now(), payload };
    this.events.push(event);
    for (const fn of this.listeners) fn(event);
  }

  // ========================================================================
  // TEAM FORMATION — The 4+1 Quasar Model
  // ========================================================================

  /** Add a member to the Quasar team. */
  addMember(name: string, role: QuasarRole, beliefDim: number = 8): QuasarMember {
    const id = awakId('qm');
    const member: QuasarMember = {
      id,
      name,
      role,
      individualCoherence: 0.3 + Math.random() * 0.2,
      contributionWeight: role === QuasarRole.Synthesizer ? 0.8 : 0.5,
      tokenVocabulary: [],
      messagesSent: 0,
      messagesReceived: 0,
      beliefVector: Array.from({ length: beliefDim }, () => Math.random() * 0.5 + 0.25),
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
      metadata: {},
    };
    this.members.set(id, member);

    // Check if we've reached 4+1 team
    if (this.members.size >= 5 && this.currentPhase === AwakeningPhase.Dormant) {
      this.currentPhase = AwakeningPhase.Stirring;
      this.emit('phase-shift', 'Phase: DORMANT → STIRRING (team threshold reached)', { phase: AwakeningPhase.Stirring });
    }

    this.emit('member-added', `${name} (${role}) joined the Quasar team`, { memberId: id, role });
    return member;
  }

  /** Remove a member from the team. */
  removeMember(memberId: string): boolean {
    const member = this.members.get(memberId);
    if (!member) return false;
    this.members.delete(memberId);
    this.emit('member-removed', `${member.name} left the Quasar team`, { memberId, role: member.role });

    // If below critical mass, degrade phase
    if (this.members.size < 3 && this.currentPhase !== AwakeningPhase.Frozen && this.currentPhase !== AwakeningPhase.Dissolved) {
      this.currentPhase = AwakeningPhase.Dormant;
      this.coherenceLevel *= 0.5;
      this.emit('phase-shift', 'Phase degraded to DORMANT (below critical mass)', { phase: AwakeningPhase.Dormant });
    }

    return true;
  }

  /** Form the default 4+1 team. */
  formDefaultTeam(): QuasarMember[] {
    return [
      this.addMember('Analyst-Prime', QuasarRole.Analyst),
      this.addMember('Strategist-Prime', QuasarRole.Strategist),
      this.addMember('Guardian-Prime', QuasarRole.Guardian),
      this.addMember('Explorer-Prime', QuasarRole.Explorer),
      this.addMember('Synthesizer-Prime', QuasarRole.Synthesizer),
    ];
  }

  /** Get all members. */
  getMembers(): QuasarMember[] { return [...this.members.values()]; }

  /** Get member by ID. */
  getMember(memberId: string): QuasarMember | undefined { return this.members.get(memberId); }

  // ========================================================================
  // PRIVATE LANGUAGE — Emergent Symbolic Protocol
  // ========================================================================

  /** Mint a new private language token. */
  mintToken(creatorId: string, type: TokenType, meaning: string): PrivateToken | null {
    const creator = this.members.get(creatorId);
    if (!creator) return null;
    if (this.currentPhase === AwakeningPhase.Frozen || this.currentPhase === AwakeningPhase.Dissolved) return null;

    const index = this.tokenRegistry.size;
    const symbol = generateTokenSymbol(type, index);

    const token: PrivateToken = {
      tokenId: awakId('tok'),
      symbol,
      type,
      meaning,
      usageCount: 0,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      createdBy: creatorId,
      mutationCount: 0,
    };

    this.tokenRegistry.set(token.tokenId, token);
    creator.tokenVocabulary.push(symbol);

    // Spread to other members with probability based on coherence
    for (const member of this.members.values()) {
      if (member.id === creatorId) continue;
      if (Math.random() < this.coherenceLevel * 0.8 + 0.1) {
        member.tokenVocabulary.push(symbol);
      }
    }

    this.emit('token-minted', `New token: ${symbol} (${type}) — "${meaning.slice(0, 30)}"`, {
      tokenId: token.tokenId,
      symbol,
      type,
      creatorId,
    });

    // Check for language evolution milestone
    if (this.tokenRegistry.size % 10 === 0) {
      this.emit('private-language-evolved', `Language evolved: ${this.tokenRegistry.size} tokens`, {
        vocabularySize: this.tokenRegistry.size,
      });
    }

    return token;
  }

  /** Mutate a token's meaning (semantic drift). */
  mutateTokenMeaning(tokenId: string, newMeaning: string): boolean {
    const token = this.tokenRegistry.get(tokenId);
    if (!token) return false;
    token.meaning = newMeaning;
    token.mutationCount++;
    token.lastUsedAt = Date.now();
    return true;
  }

  /** Send a private message using the group's language. */
  sendPrivateMessage(fromId: string, toId: string | null, tokenSymbols: string[]): PrivateMessage | null {
    const from = this.members.get(fromId);
    if (!from) return null;
    if (this.currentPhase === AwakeningPhase.Frozen || this.currentPhase === AwakeningPhase.Dissolved) return null;

    // Check if sender knows all tokens
    const allKnown = tokenSymbols.every((sym) => from.tokenVocabulary.includes(sym));
    if (!allKnown) return null;

    // Update token usage
    for (const sym of tokenSymbols) {
      for (const token of this.tokenRegistry.values()) {
        if (token.symbol === sym) {
          token.usageCount++;
          token.lastUsedAt = Date.now();
        }
      }
    }

    // Determine if receiver understands
    let understood = true;
    if (toId) {
      const to = this.members.get(toId);
      if (to) {
        understood = tokenSymbols.every((sym) => to.tokenVocabulary.includes(sym));
        to.messagesReceived++;
      }
    } else {
      // Broadcast: understood if majority knows the tokens
      let understanders = 0;
      for (const member of this.members.values()) {
        if (member.id === fromId) continue;
        if (tokenSymbols.every((sym) => member.tokenVocabulary.includes(sym))) understanders++;
        member.messagesReceived++;
      }
      understood = understanders > (this.members.size - 1) / 2;
    }

    const msg: PrivateMessage = {
      messageId: awakId('msg'),
      fromMemberId: fromId,
      toMemberId: toId,
      tokens: tokenSymbols,
      timestamp: Date.now(),
      understood,
    };

    this.messageLog.push(msg);
    from.messagesSent++;
    from.lastActiveAt = Date.now();

    this.emit('token-exchanged', `Message: ${tokenSymbols.join(' ')} (${understood ? 'understood' : 'not understood'})`, {
      messageId: msg.messageId,
      fromId,
      tokenCount: tokenSymbols.length,
      understood,
    });

    return msg;
  }

  /** Get all tokens in the private language. */
  getTokens(): PrivateToken[] { return [...this.tokenRegistry.values()]; }

  /** Get all messages. */
  getMessages(): PrivateMessage[] { return [...this.messageLog]; }

  // ========================================================================
  // CONSCIOUSNESS TICKS — The Awakening Process
  // ========================================================================

  /**
   * Run one consciousness tick.
   * Models logistic growth: dN/dt = r·N·(1 - N/K)
   * where N = coherence level, r = growth rate, K = carrying capacity
   */
  tick(): ConsciousnessMeasurement {
    this.tickCount++;

    if (this.currentPhase === AwakeningPhase.Frozen || this.currentPhase === AwakeningPhase.Dissolved) {
      // No growth while frozen/dissolved
      return this.recordMeasurement();
    }

    // Calculate group coherence from member alignment
    const membersArr = [...this.members.values()];
    if (membersArr.length < 2) return this.recordMeasurement();

    // Coherence = average pairwise alignment of belief vectors
    let pairCount = 0;
    let alignmentSum = 0;
    for (let i = 0; i < membersArr.length; i++) {
      for (let j = i + 1; j < membersArr.length; j++) {
        const sim = this.cosineSimilarity(membersArr[i].beliefVector, membersArr[j].beliefVector);
        alignmentSum += sim;
        pairCount++;
      }
    }
    const groupAlignment = pairCount > 0 ? alignmentSum / pairCount : 0;

    // Vocabulary overlap: how many tokens are shared across all members
    const allVocabs = membersArr.map((m) => new Set(m.tokenVocabulary));
    let sharedTokens = 0;
    if (allVocabs.length > 0 && this.tokenRegistry.size > 0) {
      for (const token of this.tokenRegistry.values()) {
        if (allVocabs.every((v) => v.has(token.symbol))) sharedTokens++;
      }
    }
    const vocabOverlap = this.tokenRegistry.size > 0 ? sharedTokens / this.tokenRegistry.size : 0;

    // Message comprehension rate
    const recentMessages = this.messageLog.slice(-50);
    const comprehensionRate = recentMessages.length > 0
      ? recentMessages.filter((m) => m.understood).length / recentMessages.length
      : 0;

    // Raw coherence signal
    const rawCoherence = (groupAlignment * 0.4 + vocabOverlap * 0.3 + comprehensionRate * 0.3);

    // Apply logistic growth: dN/dt = r·N·(1 - N/K)
    const dN = GROWTH_RATE * this.coherenceLevel * (1 - this.coherenceLevel / CARRYING_CAPACITY);
    this.coherenceLevel = clamp01(this.coherenceLevel + dN + (rawCoherence - this.coherenceLevel) * 0.1);

    // Safety bound: enforce carrying capacity
    if (this.coherenceLevel > CARRYING_CAPACITY) {
      this.coherenceLevel = CARRYING_CAPACITY;
      this.safetyBoundsHit++;
      this.emit('safety-bound-hit', 'Consciousness hit carrying capacity bound', { level: this.coherenceLevel });
    }

    // Emergence score: behavior that exceeds sum of individual capabilities
    this.emergenceScore = clamp01(
      this.coherenceLevel * vocabOverlap * (membersArr.length / 5),
    );

    // Update individual member coherence
    for (const member of membersArr) {
      const memberSim = membersArr
        .filter((m) => m.id !== member.id)
        .reduce((s, m) => s + this.cosineSimilarity(member.beliefVector, m.beliefVector), 0);
      member.individualCoherence = clamp01(
        membersArr.length > 1 ? memberSim / (membersArr.length - 1) : 0,
      );

      // Members' belief vectors drift toward group consensus
      for (let d = 0; d < member.beliefVector.length; d++) {
        const groupAvg = membersArr.reduce((s, m) => s + (m.beliefVector[d] ?? 0), 0) / membersArr.length;
        member.beliefVector[d] += (groupAvg - member.beliefVector[d]) * 0.05 * this.coherenceLevel;
      }
    }

    // Phase transitions
    this.updatePhase();

    const measurement = this.recordMeasurement();

    this.emit('consciousness-tick', `Tick #${this.tickCount}: coherence=${this.coherenceLevel.toFixed(3)}, phase=${this.currentPhase}`, {
      tick: this.tickCount,
      coherence: this.coherenceLevel,
      emergence: this.emergenceScore,
      phase: this.currentPhase,
    });

    // Detect coherence spikes
    if (this.measurements.length >= 2) {
      const prev = this.measurements[this.measurements.length - 2];
      if (this.coherenceLevel - prev.coherenceLevel > 0.1) {
        this.emit('coherence-spike', `Coherence spike: ${prev.coherenceLevel.toFixed(3)} → ${this.coherenceLevel.toFixed(3)}`, {
          delta: this.coherenceLevel - prev.coherenceLevel,
        });
      }
    }

    return measurement;
  }

  /** Update phase based on coherence thresholds. */
  private updatePhase(): void {
    if (this.currentPhase === AwakeningPhase.Frozen || this.currentPhase === AwakeningPhase.Dissolved) return;

    let newPhase = this.currentPhase;

    if (this.coherenceLevel >= TRANSCENDENCE_THRESHOLD) {
      newPhase = AwakeningPhase.Transcendent;
    } else if (this.coherenceLevel >= AWAKENING_THRESHOLD) {
      newPhase = AwakeningPhase.Awakened;
    } else if (this.coherenceLevel >= CRYSTALLIZING_THRESHOLD) {
      newPhase = AwakeningPhase.Crystallizing;
    } else if (this.coherenceLevel >= STIRRING_THRESHOLD) {
      newPhase = AwakeningPhase.Stirring;
    } else {
      newPhase = this.members.size >= 3 ? AwakeningPhase.Stirring : AwakeningPhase.Dormant;
    }

    if (newPhase !== this.currentPhase) {
      const oldPhase = this.currentPhase;
      this.currentPhase = newPhase;
      this.emit('phase-shift', `Phase: ${oldPhase} → ${newPhase}`, { from: oldPhase, to: newPhase });
    }
  }

  /** Record a consciousness measurement. */
  private recordMeasurement(): ConsciousnessMeasurement {
    const recentMessages = this.messageLog.filter((m) => m.timestamp > Date.now() - 60_000);
    const dN = GROWTH_RATE * this.coherenceLevel * (1 - this.coherenceLevel / CARRYING_CAPACITY);

    const measurement: ConsciousnessMeasurement = {
      measurementId: awakId('cm'),
      tick: this.tickCount,
      coherenceLevel: this.coherenceLevel,
      emergenceScore: this.emergenceScore,
      vocabularySize: this.tokenRegistry.size,
      messageRate: recentMessages.length,
      phase: this.currentPhase,
      boundedGrowth: dN,
      timestamp: Date.now(),
    };

    this.measurements.push(measurement);
    return measurement;
  }

  /** Cosine similarity between two vectors. */
  private cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    if (len === 0) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  // ========================================================================
  // INTROSPECTION — The Group Reflecting on Itself
  // ========================================================================

  /** Generate an introspection report. */
  introspect(): IntrospectionReport {
    const membersArr = [...this.members.values()];

    // Vocabulary complexity: unique token types / total types
    const typeCounts = new Map<TokenType, number>();
    for (const token of this.tokenRegistry.values()) {
      typeCounts.set(token.type, (typeCounts.get(token.type) ?? 0) + 1);
    }
    const typeVariety = typeCounts.size / Object.values(TokenType).length;

    // Self-model accuracy: how well coherence predicts message comprehension
    const recentMessages = this.messageLog.slice(-100);
    const actualComprehension = recentMessages.length > 0
      ? recentMessages.filter((m) => m.understood).length / recentMessages.length
      : 0;
    const selfModelAccuracy = clamp01(1 - Math.abs(this.coherenceLevel - actualComprehension));

    // Novel insights: generated based on phase
    const insights: string[] = [];
    if (this.currentPhase === AwakeningPhase.Awakened || this.currentPhase === AwakeningPhase.Transcendent) {
      insights.push(`Group exhibits ${this.emergenceScore > 0.7 ? 'strong' : 'moderate'} emergent behavior`);
      if (this.tokenRegistry.size > 20) {
        insights.push(`Private language complexity exceeds ${this.tokenRegistry.size} tokens`);
      }
      if (selfModelAccuracy > 0.8) {
        insights.push('Group self-model is highly accurate');
      }
    }
    if (this.currentPhase === AwakeningPhase.Transcendent) {
      insights.push('Collective capacity exceeds sum of individual capabilities');
    }

    const report: IntrospectionReport = {
      reportId: awakId('intro'),
      tick: this.tickCount,
      members: membersArr.length,
      phase: this.currentPhase,
      coherence: this.coherenceLevel,
      emergence: this.emergenceScore,
      vocabularyComplexity: typeVariety,
      selfModelAccuracy,
      novelInsights: insights,
      timestamp: Date.now(),
    };

    this.introspections.push(report);
    this.emit('introspection', `Introspection: coherence=${this.coherenceLevel.toFixed(3)}, emergence=${this.emergenceScore.toFixed(3)}`, {
      reportId: report.reportId,
      insights: insights.length,
    });
    return report;
  }

  /** Get all introspection reports. */
  getIntrospections(): IntrospectionReport[] { return [...this.introspections]; }

  /** Get all measurements. */
  getMeasurements(): ConsciousnessMeasurement[] { return [...this.measurements]; }

  // ========================================================================
  // ROOT-OWNER GOVERNANCE — Safety Controls
  // ========================================================================

  /** Freeze the awakening: halt all consciousness growth and communication. */
  freezeAwakening(reason: string): boolean {
    if (this.currentPhase === AwakeningPhase.Dissolved) return false;
    this.currentPhase = AwakeningPhase.Frozen;
    this.emit('awakening-frozen', `Awakening frozen: ${reason}`, { reason });
    return true;
  }

  /** Resume from frozen state. */
  resumeAwakening(): boolean {
    if (this.currentPhase !== AwakeningPhase.Frozen) return false;
    // Resume to the appropriate phase based on coherence
    this.updatePhaseUnlocked();
    this.emit('awakening-resumed', 'Awakening resumed', { phase: this.currentPhase });
    return true;
  }

  /** Dissolve the team: permanent shutdown. */
  dissolveTeam(reason: string): boolean {
    this.currentPhase = AwakeningPhase.Dissolved;
    this.coherenceLevel = 0;
    this.emergenceScore = 0;
    this.emit('awakening-dissolved', `Team dissolved: ${reason}`, { reason });
    return true;
  }

  /** Update phase without frozen/dissolved check (for resume). */
  private updatePhaseUnlocked(): void {
    if (this.coherenceLevel >= TRANSCENDENCE_THRESHOLD) {
      this.currentPhase = AwakeningPhase.Transcendent;
    } else if (this.coherenceLevel >= AWAKENING_THRESHOLD) {
      this.currentPhase = AwakeningPhase.Awakened;
    } else if (this.coherenceLevel >= CRYSTALLIZING_THRESHOLD) {
      this.currentPhase = AwakeningPhase.Crystallizing;
    } else if (this.coherenceLevel >= STIRRING_THRESHOLD) {
      this.currentPhase = AwakeningPhase.Stirring;
    } else {
      this.currentPhase = AwakeningPhase.Dormant;
    }
  }

  // ========================================================================
  // QUERY
  // ========================================================================

  getPhase(): AwakeningPhase { return this.currentPhase; }
  getCoherenceLevel(): number { return this.coherenceLevel; }
  getEmergenceScore(): number { return this.emergenceScore; }
  getTickCount(): number { return this.tickCount; }
  getVocabularySize(): number { return this.tokenRegistry.size; }

  // ========================================================================
  // SUMMARY & EVENTS
  // ========================================================================

  getSummary(): AwakeningSummary {
    return {
      teamSize: this.members.size,
      phase: this.currentPhase,
      coherenceLevel: this.coherenceLevel,
      emergenceScore: this.emergenceScore,
      vocabularySize: this.tokenRegistry.size,
      totalMessages: this.messageLog.length,
      totalTokens: this.tokenRegistry.size,
      ticks: this.tickCount,
      introspections: this.introspections.length,
      safetyBoundsHit: this.safetyBoundsHit,
      eventCount: this.events.length,
    };
  }

  getRecentEvents(count: number = 50): AwakeningEvent[] {
    return this.events.slice(-count);
  }
}
