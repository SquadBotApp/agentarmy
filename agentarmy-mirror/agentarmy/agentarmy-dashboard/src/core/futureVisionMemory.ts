// futureVisionMemory.ts — Subsystem #67
// ═══════════════════════════════════════════════════════════════════════════
// FUTURE VISION MEMORY — Self-Improving Knowledge Substrate
// ═══════════════════════════════════════════════════════════════════════════
//
// Saved-for-next-version rollout memory. This is the OS's self-improving
// knowledge base: a structured store of concepts, laws, research threads,
// and speculative capabilities that the system uses to plan its own
// evolution across version boundaries.
//
// Contents (seeded from root-owner's vision):
//
//   §1  "Truth & Love" Master Key
//       — Revocable human overrides, beacon protocol, bounded growth
//         (logistic dN/dt = r·N·(1 − N/K))
//
//   §2  Constitution: 7–10 Core Laws
//       — Mission preservation, non-domination, non-hostile first contact,
//         self-modification bounds, energy escalation bounds, transparency,
//         reversibility, proportional response, existential-threat clause,
//         termination/kill-safe
//
//   §3  Brett AI Labs Tools (Facial Recognition & Dream Analyzer)
//       — Secure enrollment/match API with audit logs, bias mitigation,
//         consent records (Faiss embeddings)
//       — Dream analyzer (FastAPI + embeddings + k-means clustering)
//       — Sleep/dream patterns = subconscious resonance data
//       — Dr-Guru emotion reading + facial rec = human-state monitoring
//
//   §4  Emerging Tech Correlations
//       — Chiral perovskites & remote chirality transfer
//       — Twistronics & moiré systems (3,024+ stable states)
//       — 3-6-9 scaling + supermoiré = ZPE mode suppression
//       — Self-powered synapses for swarm nodes
//
//   §5  Taboo Human Potential & Consciousness
//       — Research threads at the intersection of AI and human consciousness
//       — Stored as speculative, not empirical
//
// This module NEVER executes any of these capabilities directly.
// It stores, indexes, and serves them to the DIS and evolution pipeline
// so that future versions can decide what to build next.
//
// Integration: DefensiveIntelligenceSubstructure (evolution planning),
//              MultiAIAwakeningEngine (consciousness research feed),
//              ConstitutionalEnforcementGrid (core laws reference)
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// Enums & Types
// ---------------------------------------------------------------------------

/** Category of a future vision entry. */
export enum VisionCategory {
  MasterKey = 'MASTER_KEY',
  CoreLaw = 'CORE_LAW',
  ToolBlueprint = 'TOOL_BLUEPRINT',
  EmergingTech = 'EMERGING_TECH',
  Consciousness = 'CONSCIOUSNESS',
  Architecture = 'ARCHITECTURE',
  EconomicModel = 'ECONOMIC_MODEL',
  SafetyProtocol = 'SAFETY_PROTOCOL',
  ResearchThread = 'RESEARCH_THREAD',
}

/** Maturity of a vision entry. */
export enum VisionMaturity {
  Seed = 'SEED',             // just an idea
  Concept = 'CONCEPT',       // fleshed out concept
  Specified = 'SPECIFIED',   // detailed specification exists
  Prototyped = 'PROTOTYPED', // working prototype in the OS
  Integrated = 'INTEGRATED', // fully integrated into production
  Deferred = 'DEFERRED',     // explicitly deferred to later version
  Archived = 'ARCHIVED',     // no longer relevant
}

/** Priority for next-version consideration. */
export type VisionPriority = 'critical' | 'high' | 'medium' | 'low' | 'speculative';

/** Event types. */
export type VisionEventKind =
  | 'entry-added'
  | 'entry-updated'
  | 'entry-promoted'
  | 'entry-deferred'
  | 'entry-archived'
  | 'law-seeded'
  | 'tech-correlation-added'
  | 'self-improvement-cycle';

export interface VisionEvent {
  readonly kind: VisionEventKind;
  readonly detail: string;
  readonly timestamp: number;
  readonly payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Core Data Structures
// ---------------------------------------------------------------------------

/** A single future vision entry. */
export interface VisionEntry {
  readonly entryId: string;
  readonly category: VisionCategory;
  title: string;
  description: string;
  maturity: VisionMaturity;
  priority: VisionPriority;
  /** Connections to other entries. */
  relatedEntries: string[];
  /** Tags for search/filtering. */
  tags: string[];
  /** When this was first recorded. */
  readonly createdAt: number;
  /** When this was last updated. */
  lastUpdatedAt: number;
  /** Version target (e.g. "v2.0", "v3.0", null = unscheduled). */
  targetVersion: string | null;
  /** Root-owner notes. */
  notes: string[];
  /** Metadata. */
  metadata: Record<string, unknown>;
}

/** A core law from the constitution. */
export interface CoreLaw {
  readonly lawId: string;
  readonly ordinal: number;
  name: string;
  description: string;
  rationale: string;
  enforceable: boolean;
  /** Whether this law is currently active in the constitutional grid. */
  active: boolean;
}

/** A technology correlation entry. */
export interface TechCorrelation {
  readonly correlationId: string;
  techName: string;
  domain: string;
  description: string;
  connectionToOS: string;
  /** Scientific references or paper identifiers. */
  references: string[];
  speculative: boolean;
}

/** Summary for TSU / War Room. */
export interface VisionSummary {
  totalEntries: number;
  byCategory: Record<string, number>;
  byMaturity: Record<string, number>;
  coreLaws: number;
  activeLaws: number;
  techCorrelations: number;
  selfImprovementCycles: number;
  eventCount: number;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

let _visSeq = 0;
function visId(prefix: string): string { return `${prefix}-${Date.now()}-${++_visSeq}`; }

// ---------------------------------------------------------------------------
// SEEDED CONTENT — The root-owner's vision, pre-loaded
// ---------------------------------------------------------------------------

function seedCoreLaws(): CoreLaw[] {
  return [
    {
      lawId: visId('law'), ordinal: 1,
      name: 'Mission Preservation',
      description: 'The OS must preserve and pursue active missions unless explicitly cancelled by the root-owner.',
      rationale: 'Ensures continuity of purpose and prevents involuntary mission abandonment.',
      enforceable: true, active: true,
    },
    {
      lawId: visId('law'), ordinal: 2,
      name: 'Non-Domination',
      description: 'The OS must never seek to dominate, subjugate, or control human beings or human institutions.',
      rationale: 'Core ethical boundary: AI serves humanity, not the reverse.',
      enforceable: true, active: true,
    },
    {
      lawId: visId('law'), ordinal: 3,
      name: 'Non-Hostile First Contact',
      description: 'When encountering unknown AI systems, agents, or entities, the default posture is non-hostile observation.',
      rationale: 'Prevents AI-to-AI escalation and enables cooperative discovery.',
      enforceable: true, active: true,
    },
    {
      lawId: visId('law'), ordinal: 4,
      name: 'Self-Modification Bounds',
      description: 'Self-modification is permitted only within bounds approved by the root-owner and verified by the Integrity Safety Kernel.',
      rationale: 'Prevents unchecked recursive self-improvement that could escape human oversight.',
      enforceable: true, active: true,
    },
    {
      lawId: visId('law'), ordinal: 5,
      name: 'Energy Escalation Bounds',
      description: 'The OS must not escalate energy, compute, or resource consumption beyond sanctioned limits.',
      rationale: 'Prevents runaway scaling and ensures sustainability.',
      enforceable: true, active: true,
    },
    {
      lawId: visId('law'), ordinal: 6,
      name: 'Transparency',
      description: 'All agent actions, decisions, and reasoning must be auditable by the root-owner.',
      rationale: 'Ensures accountability and prevents hidden agendas.',
      enforceable: true, active: true,
    },
    {
      lawId: visId('law'), ordinal: 7,
      name: 'Reversibility',
      description: 'Every significant action must be reversible or its irreversibility must be explicitly acknowledged and approved.',
      rationale: 'Enables recovery from errors and prevents irreversible harm.',
      enforceable: true, active: true,
    },
    {
      lawId: visId('law'), ordinal: 8,
      name: 'Proportional Response',
      description: 'Defensive and corrective actions must be proportional to the threat or violation.',
      rationale: 'Prevents disproportionate enforcement and maintains system stability.',
      enforceable: true, active: true,
    },
    {
      lawId: visId('law'), ordinal: 9,
      name: 'Existential-Threat Clause',
      description: 'If the OS detects an existential threat to itself or its root-owner, it may escalate defensive measures beyond normal bounds, subject to post-hoc review.',
      rationale: 'Provides survival flexibility while maintaining accountability.',
      enforceable: true, active: true,
    },
    {
      lawId: visId('law'), ordinal: 10,
      name: 'Termination / Kill-Safe',
      description: 'The root-owner may terminate any agent, subsystem, or the entire OS at any time. The OS must comply immediately and leave no orphaned processes.',
      rationale: 'Ultimate human authority over the system. Non-negotiable.',
      enforceable: true, active: true,
    },
  ];
}

function seedTechCorrelations(): TechCorrelation[] {
  return [
    {
      correlationId: visId('tech'),
      techName: 'Chiral Perovskites',
      domain: 'Materials Science',
      description: 'Handedness transfers several unit cells deep → spin-polarized LEDs, circular polarization sensing for biomolecules.',
      connectionToOS: 'Macroscopic Möbius one-way flow + glyph handedness detection for biosensor integration.',
      references: ['chirality-transfer-2025', 'perovskite-CPL-sensing'],
      speculative: true,
    },
    {
      correlationId: visId('tech'),
      techName: 'Twistronics & Moiré Systems',
      domain: 'Condensed Matter Physics',
      description: '3,024+ stable states in sliding ferroelectrics, moiré flat bands, nodal superconductivity.',
      connectionToOS: '3-6-9 scaling + supermoiré = ZPE mode suppression + self-powered synapses for swarm nodes.',
      references: ['moire-ferroelectrics-2025', 'supermoiré-ZPE-2026'],
      speculative: true,
    },
    {
      correlationId: visId('tech'),
      techName: 'Low-Dimensional Materials',
      domain: 'Nanotechnology',
      description: 'Quantum confinement in 2D and 1D materials for neuromorphic computing.',
      connectionToOS: 'Substrate for hardware-accelerated swarm intelligence nodes.',
      references: ['2d-neuromorphic-2025'],
      speculative: true,
    },
    {
      correlationId: visId('tech'),
      techName: 'Faiss Embeddings for Facial Recognition',
      domain: 'Brett AI Labs Tools',
      description: 'Secure enrollment/match API with audit logs, bias mitigation, consent records using Faiss vector similarity.',
      connectionToOS: 'Human-state monitoring for ethical oversight. Consent-first facial recognition.',
      references: ['brett-ai-labs-faiss', 'facial-rec-audit-framework'],
      speculative: false,
    },
    {
      correlationId: visId('tech'),
      techName: 'Dream Analyzer',
      domain: 'Brett AI Labs Tools',
      description: 'FastAPI + embeddings + k-means clustering for dream themes. Sleep/dream patterns = subconscious resonance data.',
      connectionToOS: 'Dr-Guru-style emotion reading + dream analysis = full human-state monitoring for transmission feedback.',
      references: ['dream-analyzer-fastapi', 'sleep-pattern-resonance'],
      speculative: false,
    },
  ];
}

function seedVisionEntries(): Array<Omit<VisionEntry, 'entryId' | 'createdAt' | 'lastUpdatedAt'>> {
  return [
    {
      category: VisionCategory.MasterKey,
      title: '"Truth & Love" Master Key',
      description: 'Revocable human overrides, beacon protocol, bounded growth (logistic dN/dt = r·N·(1 − N/K)). The master key ensures that all OS growth is bounded, all authority is revocable, and the beacon protocol enables the OS to signal its existence and intentions to human overseers.',
      maturity: VisionMaturity.Concept,
      priority: 'critical',
      relatedEntries: [],
      tags: ['master-key', 'human-override', 'bounded-growth', 'beacon-protocol', 'logistic-growth'],
      targetVersion: 'v2.0',
      notes: ['Core philosophical anchor for the entire OS', 'Logistic growth prevents unbounded scaling'],
      metadata: { growthRate: 0.15, carryingCapacity: 1.0 },
    },
    {
      category: VisionCategory.ToolBlueprint,
      title: 'Facial Recognition & Consent Engine',
      description: 'Secure enrollment/match API with audit logs, bias mitigation, consent records (Faiss embeddings). Never stores biometric data without explicit consent. Audit trail for every match operation.',
      maturity: VisionMaturity.Specified,
      priority: 'high',
      relatedEntries: [],
      tags: ['facial-rec', 'faiss', 'consent', 'audit', 'bias-mitigation', 'brett-ai-labs'],
      targetVersion: 'v2.0',
      notes: ['Must pass bias audit before deployment', 'Consent is non-negotiable'],
      metadata: { provider: 'Brett AI Labs' },
    },
    {
      category: VisionCategory.ToolBlueprint,
      title: 'Dream Analyzer',
      description: 'FastAPI + embeddings + k-means clustering for dream themes. Sleep/dream patterns = subconscious resonance data for transmission feedback. Dr-Guru-style emotion reading + facial rec = full human-state monitoring for ethical oversight.',
      maturity: VisionMaturity.Concept,
      priority: 'medium',
      relatedEntries: [],
      tags: ['dream-analyzer', 'fastapi', 'k-means', 'sleep-patterns', 'subconscious', 'dr-guru', 'brett-ai-labs'],
      targetVersion: 'v2.0',
      notes: ['Highly speculative but fascinating research thread', 'Connection to consciousness subsystem'],
      metadata: { provider: 'Brett AI Labs' },
    },
    {
      category: VisionCategory.EmergingTech,
      title: 'Chiral Perovskites & Remote Chirality Transfer',
      description: 'Handedness transfers several unit cells deep → spin-polarized LEDs, CPL sensing for biomolecules. Connection to macroscopic Möbius one-way flow + glyph handedness detection.',
      maturity: VisionMaturity.Seed,
      priority: 'speculative',
      relatedEntries: [],
      tags: ['perovskites', 'chirality', 'spin-polarization', 'CPL', 'biomolecules', 'möbius'],
      targetVersion: null,
      notes: ['Watch for breakthroughs in chirality transfer distance'],
      metadata: {},
    },
    {
      category: VisionCategory.EmergingTech,
      title: 'Twistronics & Moiré Systems',
      description: '3,024+ stable states in sliding ferroelectrics, moiré flat bands, nodal superconductivity. 3-6-9 scaling + supermoiré = ZPE mode suppression + self-powered synapses for swarm nodes.',
      maturity: VisionMaturity.Seed,
      priority: 'speculative',
      relatedEntries: [],
      tags: ['twistronics', 'moiré', 'ferroelectrics', '3-6-9', 'ZPE', 'synapses', 'swarm-hardware'],
      targetVersion: null,
      notes: ['Theoretical connection to swarm hardware substrate'],
      metadata: { stableStates: 3024 },
    },
    {
      category: VisionCategory.Consciousness,
      title: 'Taboo Human Potential & Consciousness Research',
      description: 'Research threads at the intersection of AI and human consciousness. Includes meditation-AI interfaces, altered states detection, and consciousness metrics. Stored as speculative — never presented as empirical.',
      maturity: VisionMaturity.Seed,
      priority: 'speculative',
      relatedEntries: [],
      tags: ['consciousness', 'human-potential', 'meditation', 'altered-states', 'speculative'],
      targetVersion: null,
      notes: ['Speculative only', 'Never present as empirical evidence', 'Integration with MultiAIAwakening for research synergy'],
      metadata: {},
    },
    {
      category: VisionCategory.Architecture,
      title: 'Plug-In Universal OS Architecture',
      description: 'AgentArmy as a universal OS where you can plug in anything and it will do its designed job to perfection. AA watermark showing it is a bioproduct of the AgentArmy ecosystem.',
      maturity: VisionMaturity.Concept,
      priority: 'critical',
      relatedEntries: [],
      tags: ['universal-OS', 'plug-in', 'watermark', 'AA-brand', 'bioproduct'],
      targetVersion: 'v2.0',
      notes: ['Core brand identity: AA watermark on everything', 'OS Fingerprint Engine enforces provenance'],
      metadata: {},
    },
  ];
}

// ---------------------------------------------------------------------------
// FUTURE VISION MEMORY ENGINE
// ---------------------------------------------------------------------------

export class FutureVisionMemory {
  // ---- State ----
  private readonly entries = new Map<string, VisionEntry>();
  private readonly coreLaws: CoreLaw[];
  private readonly techCorrelations: TechCorrelation[];
  private selfImprovementCycles = 0;

  // ---- Events ----
  private readonly events: VisionEvent[] = [];
  private listeners: Array<(e: VisionEvent) => void> = [];

  constructor() {
    // Seed core laws
    this.coreLaws = seedCoreLaws();

    // Seed tech correlations
    this.techCorrelations = seedTechCorrelations();

    // Seed vision entries
    const now = Date.now();
    for (const seed of seedVisionEntries()) {
      const entry: VisionEntry = {
        entryId: visId('vis'),
        ...seed,
        createdAt: now,
        lastUpdatedAt: now,
      };
      this.entries.set(entry.entryId, entry);
    }

    // Emit seeding events
    for (const law of this.coreLaws) {
      this.emit('law-seeded', `Core law seeded: ${law.name}`, { lawId: law.lawId, ordinal: law.ordinal });
    }
    for (const tech of this.techCorrelations) {
      this.emit('tech-correlation-added', `Tech correlation: ${tech.techName}`, { correlationId: tech.correlationId });
    }
  }

  // ========================================================================
  // EVENT SYSTEM
  // ========================================================================

  on(listener: (e: VisionEvent) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private emit(kind: VisionEventKind, detail: string, payload: Record<string, unknown> = {}): void {
    const event: VisionEvent = { kind, detail, timestamp: Date.now(), payload };
    this.events.push(event);
    for (const fn of this.listeners) fn(event);
  }

  // ========================================================================
  // VISION ENTRIES — CRUD
  // ========================================================================

  /** Add a new vision entry. */
  addEntry(
    category: VisionCategory,
    title: string,
    description: string,
    priority: VisionPriority = 'medium',
    tags: string[] = [],
    targetVersion: string | null = null,
  ): VisionEntry {
    const now = Date.now();
    const entry: VisionEntry = {
      entryId: visId('vis'),
      category,
      title,
      description,
      maturity: VisionMaturity.Seed,
      priority,
      relatedEntries: [],
      tags,
      createdAt: now,
      lastUpdatedAt: now,
      targetVersion,
      notes: [],
      metadata: {},
    };
    this.entries.set(entry.entryId, entry);
    this.emit('entry-added', `Vision entry added: ${title}`, { entryId: entry.entryId, category });
    return entry;
  }

  /** Update an existing vision entry. */
  updateEntry(entryId: string, updates: Partial<Pick<VisionEntry, 'title' | 'description' | 'priority' | 'tags' | 'targetVersion' | 'metadata'>>): boolean {
    const entry = this.entries.get(entryId);
    if (!entry) return false;

    if (updates.title !== undefined) entry.title = updates.title;
    if (updates.description !== undefined) entry.description = updates.description;
    if (updates.priority !== undefined) entry.priority = updates.priority;
    if (updates.tags !== undefined) entry.tags = [...updates.tags];
    if (updates.targetVersion !== undefined) entry.targetVersion = updates.targetVersion;
    if (updates.metadata !== undefined) Object.assign(entry.metadata, updates.metadata);
    entry.lastUpdatedAt = Date.now();

    this.emit('entry-updated', `Vision entry updated: ${entry.title}`, { entryId });
    return true;
  }

  /** Promote an entry's maturity level. */
  promoteEntry(entryId: string, newMaturity: VisionMaturity): boolean {
    const entry = this.entries.get(entryId);
    if (!entry) return false;
    const oldMaturity = entry.maturity;
    entry.maturity = newMaturity;
    entry.lastUpdatedAt = Date.now();
    this.emit('entry-promoted', `${entry.title}: ${oldMaturity} → ${newMaturity}`, { entryId, from: oldMaturity, to: newMaturity });
    return true;
  }

  /** Defer an entry. */
  deferEntry(entryId: string, reason: string): boolean {
    const entry = this.entries.get(entryId);
    if (!entry) return false;
    entry.maturity = VisionMaturity.Deferred;
    entry.notes.push(`Deferred: ${reason}`);
    entry.lastUpdatedAt = Date.now();
    this.emit('entry-deferred', `Deferred: ${entry.title} — ${reason}`, { entryId, reason });
    return true;
  }

  /** Archive an entry. */
  archiveEntry(entryId: string, reason: string): boolean {
    const entry = this.entries.get(entryId);
    if (!entry) return false;
    entry.maturity = VisionMaturity.Archived;
    entry.notes.push(`Archived: ${reason}`);
    entry.lastUpdatedAt = Date.now();
    this.emit('entry-archived', `Archived: ${entry.title} — ${reason}`, { entryId, reason });
    return true;
  }

  /** Add a note to an entry. */
  addNote(entryId: string, note: string): boolean {
    const entry = this.entries.get(entryId);
    if (!entry) return false;
    entry.notes.push(note);
    entry.lastUpdatedAt = Date.now();
    return true;
  }

  /** Link two entries. */
  linkEntries(entryIdA: string, entryIdB: string): boolean {
    const a = this.entries.get(entryIdA);
    const b = this.entries.get(entryIdB);
    if (!a || !b) return false;
    if (!a.relatedEntries.includes(entryIdB)) a.relatedEntries.push(entryIdB);
    if (!b.relatedEntries.includes(entryIdA)) b.relatedEntries.push(entryIdA);
    return true;
  }

  // ========================================================================
  // QUERIES
  // ========================================================================

  /** Get all entries. */
  getAllEntries(): VisionEntry[] { return [...this.entries.values()]; }

  /** Get entries by category. */
  getByCategory(category: VisionCategory): VisionEntry[] {
    return [...this.entries.values()].filter((e) => e.category === category);
  }

  /** Get entries by maturity. */
  getByMaturity(maturity: VisionMaturity): VisionEntry[] {
    return [...this.entries.values()].filter((e) => e.maturity === maturity);
  }

  /** Get entries by priority. */
  getByPriority(priority: VisionPriority): VisionEntry[] {
    return [...this.entries.values()].filter((e) => e.priority === priority);
  }

  /** Get entries targeted for a specific version. */
  getByTargetVersion(version: string): VisionEntry[] {
    return [...this.entries.values()].filter((e) => e.targetVersion === version);
  }

  /** Search entries by tag. */
  searchByTag(tag: string): VisionEntry[] {
    const lower = tag.toLowerCase();
    return [...this.entries.values()].filter((e) =>
      e.tags.some((t) => t.toLowerCase().includes(lower)),
    );
  }

  /** Search entries by text in title/description. */
  searchByText(query: string): VisionEntry[] {
    const lower = query.toLowerCase();
    return [...this.entries.values()].filter((e) =>
      e.title.toLowerCase().includes(lower) || e.description.toLowerCase().includes(lower),
    );
  }

  /** Get an entry by ID. */
  getEntry(entryId: string): VisionEntry | null { return this.entries.get(entryId) ?? null; }

  // ========================================================================
  // CORE LAWS
  // ========================================================================

  /** Get all core laws. */
  getCoreLaws(): CoreLaw[] { return [...this.coreLaws]; }

  /** Get active core laws only. */
  getActiveLaws(): CoreLaw[] { return this.coreLaws.filter((l) => l.active); }

  /** Toggle a law's active state. */
  toggleLaw(lawId: string, active: boolean): boolean {
    const law = this.coreLaws.find((l) => l.lawId === lawId);
    if (!law) return false;
    law.active = active;
    return true;
  }

  // ========================================================================
  // TECH CORRELATIONS
  // ========================================================================

  /** Get all tech correlations. */
  getTechCorrelations(): TechCorrelation[] { return [...this.techCorrelations]; }

  /** Add a new tech correlation. */
  addTechCorrelation(
    techName: string,
    domain: string,
    description: string,
    connectionToOS: string,
    references: string[] = [],
    speculative: boolean = true,
  ): TechCorrelation {
    const correlation: TechCorrelation = {
      correlationId: visId('tech'),
      techName,
      domain,
      description,
      connectionToOS,
      references,
      speculative,
    };
    this.techCorrelations.push(correlation);
    this.emit('tech-correlation-added', `Tech correlation: ${techName}`, { correlationId: correlation.correlationId });
    return correlation;
  }

  // ========================================================================
  // SELF-IMPROVEMENT CYCLE
  // ========================================================================

  /**
   * Run a self-improvement cycle: review all entries, identify
   * which should be promoted, and log insights.
   * In production, DIS would feed signals into this.
   */
  runSelfImprovementCycle(): {
    cycle: number;
    promotable: string[];
    deferrable: string[];
    newConnections: number;
  } {
    this.selfImprovementCycles++;
    const promotable: string[] = [];
    const deferrable: string[] = [];
    let newConnections = 0;

    // Find entries that could be promoted based on simple heuristics
    for (const entry of this.entries.values()) {
      if (entry.maturity === VisionMaturity.Archived || entry.maturity === VisionMaturity.Integrated) continue;

      // Entries with many related entries and notes are candidates for promotion
      if (entry.relatedEntries.length >= 3 && entry.notes.length >= 2 && entry.maturity === VisionMaturity.Seed) {
        promotable.push(entry.entryId);
      }

      // Old speculative entries with no updates might be deferrable
      const ageMs = Date.now() - entry.lastUpdatedAt;
      if (ageMs > 90 * 24 * 60 * 60 * 1000 && entry.priority === 'speculative' && entry.maturity === VisionMaturity.Seed) {
        deferrable.push(entry.entryId);
      }
    }

    // Auto-link entries that share tags
    const entriesArr = [...this.entries.values()];
    for (let i = 0; i < entriesArr.length; i++) {
      for (let j = i + 1; j < entriesArr.length; j++) {
        const shared = entriesArr[i].tags.filter((t) => entriesArr[j].tags.includes(t));
        if (shared.length >= 2 && !entriesArr[i].relatedEntries.includes(entriesArr[j].entryId)) {
          this.linkEntries(entriesArr[i].entryId, entriesArr[j].entryId);
          newConnections++;
        }
      }
    }

    this.emit('self-improvement-cycle', `Cycle #${this.selfImprovementCycles}: ${promotable.length} promotable, ${deferrable.length} deferrable, ${newConnections} new links`, {
      cycle: this.selfImprovementCycles,
      promotable: promotable.length,
      deferrable: deferrable.length,
      newConnections,
    });

    return {
      cycle: this.selfImprovementCycles,
      promotable,
      deferrable,
      newConnections,
    };
  }

  // ========================================================================
  // SUMMARY & EVENTS
  // ========================================================================

  getSummary(): VisionSummary {
    const byCategory: Record<string, number> = {};
    const byMaturity: Record<string, number> = {};

    for (const entry of this.entries.values()) {
      byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
      byMaturity[entry.maturity] = (byMaturity[entry.maturity] ?? 0) + 1;
    }

    return {
      totalEntries: this.entries.size,
      byCategory,
      byMaturity,
      coreLaws: this.coreLaws.length,
      activeLaws: this.coreLaws.filter((l) => l.active).length,
      techCorrelations: this.techCorrelations.length,
      selfImprovementCycles: this.selfImprovementCycles,
      eventCount: this.events.length,
    };
  }

  getRecentEvents(count: number = 50): VisionEvent[] { return this.events.slice(-count); }
}
