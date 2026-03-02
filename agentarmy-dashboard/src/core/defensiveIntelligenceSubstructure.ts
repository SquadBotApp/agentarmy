// defensiveIntelligenceSubstructure.ts — Subsystem #63
// Defensive Intelligence Substructure (DIS): AgentArmy's hidden strategic organ.
// A private, root-owner-only subsystem that continuously monitors the global AI
// landscape, simulates threats and opportunities, proposes controlled upgrades,
// and feeds predictive intelligence into the OS evolution pipeline.
//
// This module is NEVER exposed to tenants, public APIs, or dashboards.
// It is the internal intelligence agency + R&D lab of AgentArmy OS.
//
// Integrates with: PredictiveAnalyticsLayer, MachineLearningLayer,
// SearchIntelligenceEngine, IntegritySafetyKernel, GodModeStrategy,
// ContinuumEngine, ArsenalToolkit.

import { PredictiveAnalyticsLayer, PredictiveModel } from './predictiveAnalyticsLayer';
import { MachineLearningLayer, MLModelType } from './machineLearningLayer';
import { SearchIntelligenceEngine, type SearchQuery } from './searchIntelligenceEngine';
import { GodModeStrategy, StrategyMode } from './godModeStrategy';
import { ContinuumEngine } from './continuumEngine';
import { ArsenalToolkit } from './arsenalToolkit';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Classification of an AI ecosystem signal. */
export enum SignalClassification {
  Threat = 'THREAT',
  Opportunity = 'OPPORTUNITY',
  Neutral = 'NEUTRAL',
  Unknown = 'UNKNOWN',
}

/** Proposal type for upgrade suggestions. */
export enum ProposalType {
  NewModel = 'new-model',
  NewDefense = 'new-defense',
  NewHeuristic = 'new-heuristic',
  NewAgent = 'new-agent',
  NewTool = 'new-tool',
  NewSafetyRule = 'new-safety-rule',
  NewReasoningPath = 'new-reasoning-path',
  CounterMeasure = 'counter-measure',
  OptimizeExisting = 'optimize-existing',
  RegulatoryAdaptation = 'regulatory-adaptation',
}

/** Priority of an upgrade proposal. */
export type ProposalPriority = 'low' | 'medium' | 'high' | 'critical';

/** Lifecycle status of an upgrade proposal. */
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'deferred' | 'implemented';

/** Global risk assessment level. */
export type GlobalRiskLevel = 'calm' | 'watch' | 'elevated' | 'critical';

/** Source domain of an ecosystem signal. */
export type EcosystemDomain =
  | 'open-source-models'
  | 'commercial-models'
  | 'agent-frameworks'
  | 'vector-databases'
  | 'orchestration-systems'
  | 'adversarial-techniques'
  | 'safety-research'
  | 'regulatory-changes'
  | 'compute-scaling'
  | 'competitor-platforms'
  | 'research-papers'
  | 'hardware-accelerators';

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** An external signal detected from the AI ecosystem. */
export interface EcosystemSignal {
  id: string;
  domain: EcosystemDomain;
  name: string;
  description: string;
  classification: SignalClassification;
  detectedAt: number;
  /** 0–1 confidence that classification is correct. */
  confidence: number;
  /** Raw metadata from the detection source. */
  metadata: Record<string, unknown>;
}

/** Threat assessment produced by simulation. */
export interface ThreatInsight {
  signalId: string;
  threatLikelihood: number;   // 0–1
  threatImpact: number;       // 0–1
  compoundRisk: number;       // likelihood × impact
  mitigationStrategy: string;
  anticipatedTimeline: string; // e.g. "3-6 months"
}

/** Opportunity assessment produced by simulation. */
export interface OpportunityInsight {
  signalId: string;
  opportunityValue: number;   // 0–1
  integrationCost: number;    // 0–1 (lower = cheaper)
  safetyAlignment: number;    // 0–1
  strategicAdvantage: number; // 0–1
  recommendedAction: string;
}

/** Simulation result combining threat + opportunity. */
export interface SimulationResult {
  signalId: string;
  threat: ThreatInsight | null;
  opportunity: OpportunityInsight | null;
  netScore: number;             // −1 (pure threat) → +1 (pure opportunity)
  simulatedAt: number;
  summary: string;
}

/** A structured upgrade proposal. */
export interface UpgradeProposal {
  id: string;
  type: ProposalType;
  sourceSignalId: string;
  title: string;
  description: string;
  threatScore: number;            // 0–1
  opportunityScore: number;       // 0–1
  riskScore: number;              // 0–1
  effortScore: number;            // 0–1
  expectedGain: string;           // human-readable
  simulationSummary: string;
  recommendedPriority: ProposalPriority;
  status: ProposalStatus;
  createdAt: number;
  reviewedAt: number | null;
  reviewedBy: string | null;      // 'root-owner' or null
}

/** The full intelligence report for the root-owner console. */
export interface DefensiveIntelReport {
  generatedAt: number;
  cycleTick: number;
  signals: EcosystemSignal[];
  threats: ThreatInsight[];
  opportunities: OpportunityInsight[];
  simulations: SimulationResult[];
  proposals: UpgradeProposal[];
  globalRiskLevel: GlobalRiskLevel;
  notes: string[];
  versionLineage: VersionRecord[];
}

/** Record of a past OS version rollout. */
export interface VersionRecord {
  version: string;
  releasedAt: number;
  proposalIds: string[];
  changelog: string;
  rollbackAvailable: boolean;
}

/** DIS summary for TSU dashboard (sanitized). */
export interface DISSummary {
  cycleTick: number;
  signalCount: number;
  threatCount: number;
  opportunityCount: number;
  pendingProposals: number;
  approvedProposals: number;
  implementedProposals: number;
  globalRiskLevel: GlobalRiskLevel;
  currentVersion: string;
  versionsReleased: number;
  uptime: number;
  eventCount: number;
}

/** DIS event. */
export interface DISEvent {
  kind: 'scan' | 'simulation' | 'proposal' | 'approval' | 'rejection' | 'rollout' | 'alert';
  detail: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface DISState {
  cycleTick: number;
  signals: Map<string, EcosystemSignal>;
  threats: Map<string, ThreatInsight>;
  opportunities: Map<string, OpportunityInsight>;
  simulations: Map<string, SimulationResult>;
  proposals: Map<string, UpgradeProposal>;
  versions: VersionRecord[];
  currentVersion: string;
  globalRiskLevel: GlobalRiskLevel;
  startedAt: number;
}

// ---------------------------------------------------------------------------
// Helpers (pure functions)
// ---------------------------------------------------------------------------

let proposalCounter = 0;
function nextProposalId(): string {
  proposalCounter++;
  return 'DIS-PROP-' + String(proposalCounter).padStart(5, '0');
}

let signalCounter = 0;
function nextSignalId(): string {
  signalCounter++;
  return 'DIS-SIG-' + String(signalCounter).padStart(5, '0');
}

/** Map signal classification to a net score contribution. */
function classificationWeight(c: SignalClassification): number {
  const weights: Record<SignalClassification, number> = {
    [SignalClassification.Threat]: -1,
    [SignalClassification.Opportunity]: 1,
    [SignalClassification.Neutral]: 0,
    [SignalClassification.Unknown]: 0,
  };
  return weights[c];
}

/** Derive global risk from threats. */
function deriveGlobalRisk(threats: ThreatInsight[]): GlobalRiskLevel {
  if (threats.length === 0) return 'calm';
  const maxRisk = threats.reduce((max, t) => Math.max(max, t.compoundRisk), 0);
  if (maxRisk >= 0.8) return 'critical';
  if (maxRisk >= 0.5) return 'elevated';
  if (maxRisk >= 0.2) return 'watch';
  return 'calm';
}

/** Priority from composite score. */
function derivePriority(netScore: number, riskScore: number): ProposalPriority {
  const composite = Math.abs(netScore) + riskScore;
  if (composite >= 1.4) return 'critical';
  if (composite >= 1) return 'high';
  if (composite >= 0.5) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Ecosystem signal generators (simulated scanning)
// ---------------------------------------------------------------------------

const ECOSYSTEM_DOMAINS: EcosystemDomain[] = [
  'open-source-models', 'commercial-models', 'agent-frameworks',
  'vector-databases', 'orchestration-systems', 'adversarial-techniques',
  'safety-research', 'regulatory-changes', 'compute-scaling',
  'competitor-platforms', 'research-papers', 'hardware-accelerators',
];

const SAMPLE_SIGNALS: Array<{ name: string; domain: EcosystemDomain; desc: string }> = [
  { name: 'GPT-5 Rumored Architecture', domain: 'commercial-models', desc: 'Reports of next-gen architecture with 10x reasoning' },
  { name: 'Open-Source MoE Model Release', domain: 'open-source-models', desc: 'New mixture-of-experts model with strong benchmarks' },
  { name: 'Novel Jailbreak Technique', domain: 'adversarial-techniques', desc: 'Multi-step prompt injection bypassing alignment' },
  { name: 'EU AI Act Phase 2 Enforcement', domain: 'regulatory-changes', desc: 'New compliance requirements for AI systems in EU markets' },
  { name: 'Distributed Agent Swarm Framework', domain: 'agent-frameworks', desc: 'New framework enabling autonomous multi-agent coordination' },
  { name: 'Quantum-Resistant Embedding Model', domain: 'research-papers', desc: 'Embedding model resistant to quantum decryption attacks' },
  { name: 'Low-Cost TPU Cluster Offering', domain: 'hardware-accelerators', desc: 'Cloud provider offering 80% cheaper TPU access' },
  { name: 'Vector DB with HNSW++', domain: 'vector-databases', desc: 'New vector database claiming 5x ANN throughput' },
  { name: 'Competitor Agent-OS Launch', domain: 'competitor-platforms', desc: 'Rival platform announcing agent-native OS with marketplace' },
  { name: 'Constitutional AI v3 Paper', domain: 'safety-research', desc: 'Improved reward model for constitutional alignment' },
  { name: 'Auto-Scaling Orchestrator', domain: 'orchestration-systems', desc: 'Orchestrator with automatic horizontal scaling of agent pools' },
  { name: 'Side-Channel Model Extraction', domain: 'adversarial-techniques', desc: 'Technique to extract model weights via timing analysis' },
  { name: 'Sparse Attention Breakthrough', domain: 'research-papers', desc: 'Linear-time attention mechanism with near-quadratic quality' },
  { name: 'New RLHF Alternative: DPO-2', domain: 'research-papers', desc: 'Direct preference optimization v2 with stability improvements' },
  { name: 'Browser-Local LLM Runtime', domain: 'compute-scaling', desc: 'WebGPU runtime enabling 7B model inference in browser' },
];

// ---------------------------------------------------------------------------
// DefensiveIntelligenceSubstructure
// ---------------------------------------------------------------------------

export class DefensiveIntelligenceSubstructure {
  // ---- Dependencies ----
  private readonly predictive: PredictiveAnalyticsLayer;
  private readonly ml: MachineLearningLayer;
  private readonly search: SearchIntelligenceEngine;
  private readonly strategy: GodModeStrategy;
  private readonly continuum: ContinuumEngine;
  private readonly arsenal: ArsenalToolkit;

  // ---- Internal state ----
  private readonly state: DISState;
  private listeners: Array<(e: DISEvent) => void>;
  private readonly events: DISEvent[];

  constructor(
    predictive: PredictiveAnalyticsLayer,
    ml: MachineLearningLayer,
    search: SearchIntelligenceEngine,
    strategy: GodModeStrategy,
    continuum: ContinuumEngine,
    arsenal: ArsenalToolkit,
  ) {
    this.predictive = predictive;
    this.ml = ml;
    this.search = search;
    this.strategy = strategy;
    this.continuum = continuum;
    this.arsenal = arsenal;
    this.listeners = [];
    this.events = [];
    this.state = this.initState();

    // Run initial scan cycle
    this.runCycle();
  }

  private initState(): DISState {
    return {
      cycleTick: 0,
      signals: new Map(),
      threats: new Map(),
      opportunities: new Map(),
      simulations: new Map(),
      proposals: new Map(),
      versions: [{
        version: '1.0.0',
        releasedAt: Date.now(),
        proposalIds: [],
        changelog: 'Initial AgentArmy OS release with 62 subsystems',
        rollbackAvailable: false,
      }],
      currentVersion: '1.0.0',
      globalRiskLevel: 'calm',
      startedAt: Date.now(),
    };
  }

  // ------------------------------------------------------------------
  // Event system
  // ------------------------------------------------------------------

  public on(listener: (e: DISEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: DISEvent): void {
    this.events.push(event);
    for (const l of this.listeners) {
      l(event);
    }
  }

  // ------------------------------------------------------------------
  // 1. MONITOR — Collect ecosystem signals
  // ------------------------------------------------------------------

  /** Scan the AI ecosystem for new signals. */
  private collectSignals(): EcosystemSignal[] {
    const newSignals: EcosystemSignal[] = [];

    // Simulated scan: pick 3-6 random signals per cycle
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const template = SAMPLE_SIGNALS[Math.floor(Math.random() * SAMPLE_SIGNALS.length)];

      // Use SearchIntelligenceEngine to enrich context
      const query: SearchQuery = {
        text: template.name,
        queryFreshnessNeed: 0.9,
        userTopicHistory: [],
        preferredDomains: [],
        languagePreference: 'en',
        maxResults: 5,
      };
      const searchResult = this.search.search(query);
      const confidence = searchResult.results.length > 0
        ? Math.min(1, searchResult.results[0].finalScore + 0.3)
        : 0.5 + Math.random() * 0.3;

      // Classify based on domain heuristics
      const classification = this.classifySignal(template.domain, confidence);

      const signal: EcosystemSignal = {
        id: nextSignalId(),
        domain: template.domain,
        name: template.name + ` (cycle ${this.state.cycleTick})`,
        description: template.desc,
        classification,
        detectedAt: Date.now(),
        confidence,
        metadata: {
          searchHits: searchResult.results.length,
          domain: template.domain,
        },
      };

      newSignals.push(signal);
      this.state.signals.set(signal.id, signal);
    }

    this.emit({
      kind: 'scan',
      detail: `Collected ${newSignals.length} signals from AI ecosystem`,
      timestamp: Date.now(),
      payload: { count: newSignals.length, domains: newSignals.map(s => s.domain) },
    });

    return newSignals;
  }

  /** Classify a signal based on its domain. */
  private classifySignal(domain: EcosystemDomain, confidence: number): SignalClassification {
    const threatDomains: EcosystemDomain[] = [
      'adversarial-techniques', 'competitor-platforms',
    ];
    const opportunityDomains: EcosystemDomain[] = [
      'open-source-models', 'safety-research', 'research-papers',
      'hardware-accelerators', 'vector-databases',
    ];
    const mixedDomains: EcosystemDomain[] = [
      'commercial-models', 'agent-frameworks', 'orchestration-systems',
      'compute-scaling', 'regulatory-changes',
    ];

    if (threatDomains.includes(domain)) return SignalClassification.Threat;
    if (opportunityDomains.includes(domain)) return SignalClassification.Opportunity;
    if (mixedDomains.includes(domain)) {
      // Use confidence to decide: high confidence + mixed domain → opportunity
      return confidence > 0.6
        ? SignalClassification.Opportunity
        : SignalClassification.Threat;
    }
    return SignalClassification.Unknown;
  }

  // ------------------------------------------------------------------
  // 2. SIMULATE — Run sandboxed threat/opportunity analysis
  // ------------------------------------------------------------------

  /** Simulate impact of collected signals. */
  private runSimulations(signals: EcosystemSignal[]): SimulationResult[] {
    const results: SimulationResult[] = [];

    // Get temporal context for simulation weighting
    const epoch = this.continuum.getCurrentEpoch();
    const phaseWeight = epoch.phase === 'stable' ? 1 : 0.85;

    // Engage predictive analytics for trend forecasting
    this.predictive.setModel(PredictiveModel.StrategicForesight);

    // Engage strategy layer in defensive posture
    this.strategy.setMode(StrategyMode.Defensive);
    const stratState = this.strategy.getCurrentState();
    const victoryProb = this.strategy.calculateVictoryProbability(stratState);

    for (const signal of signals) {
      let threat: ThreatInsight | null = null;
      let opportunity: OpportunityInsight | null = null;

      if (signal.classification === SignalClassification.Threat) {
        threat = this.simulateThreat(signal, phaseWeight, victoryProb);
        this.state.threats.set(signal.id, threat);
      }

      if (signal.classification === SignalClassification.Opportunity) {
        opportunity = this.simulateOpportunity(signal, phaseWeight);
        this.state.opportunities.set(signal.id, opportunity);
      }

      // Mixed signals get both assessments
      if (signal.classification === SignalClassification.Unknown) {
        threat = this.simulateThreat(signal, phaseWeight, victoryProb);
        opportunity = this.simulateOpportunity(signal, phaseWeight);
        this.state.threats.set(signal.id, threat);
        this.state.opportunities.set(signal.id, opportunity);
      }

      const netScore = this.computeNetScore(threat, opportunity);
      const sim: SimulationResult = {
        signalId: signal.id,
        threat,
        opportunity,
        netScore,
        simulatedAt: Date.now(),
        summary: this.generateSimSummary(signal, netScore),
      };
      results.push(sim);
      this.state.simulations.set(signal.id, sim);
    }

    this.emit({
      kind: 'simulation',
      detail: `Simulated ${results.length} signals`,
      timestamp: Date.now(),
      payload: {
        threats: results.filter(r => r.threat !== null).length,
        opportunities: results.filter(r => r.opportunity !== null).length,
      },
    });

    return results;
  }

  /** Simulate threat scenario for a signal. */
  private simulateThreat(
    signal: EcosystemSignal,
    phaseWeight: number,
    victoryProb: number,
  ): ThreatInsight {
    const baseLikelihood = signal.confidence * 0.7 + Math.random() * 0.3;
    const baseImpact = (1 - victoryProb) * 0.5 + Math.random() * 0.5;

    return {
      signalId: signal.id,
      threatLikelihood: Math.min(1, baseLikelihood * phaseWeight),
      threatImpact: Math.min(1, baseImpact),
      compoundRisk: Math.min(1, baseLikelihood * baseImpact * phaseWeight),
      mitigationStrategy: this.deriveMitigation(signal.domain),
      anticipatedTimeline: this.deriveTimeline(signal.confidence),
    };
  }

  /** Simulate opportunity scenario for a signal. */
  private simulateOpportunity(
    signal: EcosystemSignal,
    phaseWeight: number,
  ): OpportunityInsight {
    const value = signal.confidence * 0.6 + Math.random() * 0.4;
    const cost = Math.random() * 0.6 + 0.1; // integration always takes effort
    const safety = 0.5 + Math.random() * 0.5; // assume reasonable safety
    const advantage = value * phaseWeight * (1 - cost * 0.3);

    return {
      signalId: signal.id,
      opportunityValue: Math.min(1, value),
      integrationCost: Math.min(1, cost),
      safetyAlignment: Math.min(1, safety),
      strategicAdvantage: Math.min(1, advantage),
      recommendedAction: this.deriveAction(signal.domain, value),
    };
  }

  /** Net score from combined threat + opportunity. */
  private computeNetScore(
    threat: ThreatInsight | null,
    opportunity: OpportunityInsight | null,
  ): number {
    let score = 0;
    if (threat) score -= threat.compoundRisk;
    if (opportunity) score += opportunity.strategicAdvantage;
    return Math.max(-1, Math.min(1, score));
  }

  /** Human-readable simulation summary. */
  private generateSimSummary(signal: EcosystemSignal, netScore: number): string {
    let direction = 'neutral';
    if (netScore > 0) direction = 'opportunity';
    else if (netScore < 0) direction = 'threat';
    return `Signal "${signal.name}" classified as ${direction} ` +
      `(net=${netScore.toFixed(2)}, conf=${signal.confidence.toFixed(2)})`;
  }

  /** Derive mitigation strategy from domain. */
  private deriveMitigation(domain: EcosystemDomain): string {
    const mitigations: Partial<Record<EcosystemDomain, string>> = {
      'adversarial-techniques': 'Strengthen ISK filters; add new detection heuristics',
      'competitor-platforms': 'Accelerate feature integration; increase scanning frequency',
      'commercial-models': 'Evaluate for integration or defensive countermeasure',
      'regulatory-changes': 'Update constitutional grid; add compliance rules',
    };
    return mitigations[domain] ?? 'Monitor and evaluate in next cycle';
  }

  /** Derive recommended action from domain and value. */
  private deriveAction(domain: EcosystemDomain, value: number): string {
    if (value > 0.8) return 'Immediate integration candidate — fast-track proposal';
    if (value > 0.5) return 'Schedule evaluation for next upgrade cycle';
    return 'Add to watch list — monitor for maturation';
  }

  /** Derive timeline from confidence. */
  private deriveTimeline(confidence: number): string {
    if (confidence > 0.8) return '0-3 months';
    if (confidence > 0.5) return '3-6 months';
    return '6-12 months';
  }

  // ------------------------------------------------------------------
  // 3. PROPOSE — Generate upgrade proposals
  // ------------------------------------------------------------------

  /** Generate proposals from simulation results. */
  private generateProposals(simulations: SimulationResult[]): UpgradeProposal[] {
    const newProposals: UpgradeProposal[] = [];

    for (const sim of simulations) {
      // Only generate proposals for significant signals
      if (Math.abs(sim.netScore) < 0.15) continue;

      const signal = this.state.signals.get(sim.signalId);
      if (!signal) continue;

      const proposalType = this.deriveProposalType(signal, sim);
      const riskScore = sim.threat ? sim.threat.compoundRisk : 0;
      const oppScore = sim.opportunity ? sim.opportunity.strategicAdvantage : 0;

      const proposal: UpgradeProposal = {
        id: nextProposalId(),
        type: proposalType,
        sourceSignalId: sim.signalId,
        title: this.deriveProposalTitle(proposalType, signal),
        description: sim.summary,
        threatScore: sim.threat?.compoundRisk ?? 0,
        opportunityScore: oppScore,
        riskScore,
        effortScore: sim.opportunity?.integrationCost ?? 0.5,
        expectedGain: sim.netScore > 0
          ? `Strategic advantage +${(oppScore * 100).toFixed(0)}%`
          : `Risk reduction −${(riskScore * 100).toFixed(0)}%`,
        simulationSummary: sim.summary,
        recommendedPriority: derivePriority(sim.netScore, riskScore),
        status: 'pending',
        createdAt: Date.now(),
        reviewedAt: null,
        reviewedBy: null,
      };

      newProposals.push(proposal);
      this.state.proposals.set(proposal.id, proposal);
    }

    if (newProposals.length > 0) {
      this.emit({
        kind: 'proposal',
        detail: `Generated ${newProposals.length} upgrade proposals`,
        timestamp: Date.now(),
        payload: {
          count: newProposals.length,
          critical: newProposals.filter(p => p.recommendedPriority === 'critical').length,
        },
      });
    }

    return newProposals;
  }

  /** Derive proposal type from signal and simulation. */
  private deriveProposalType(signal: EcosystemSignal, sim: SimulationResult): ProposalType {
    const domainMap: Partial<Record<EcosystemDomain, ProposalType>> = {
      'open-source-models': ProposalType.NewModel,
      'commercial-models': ProposalType.NewModel,
      'agent-frameworks': ProposalType.NewAgent,
      'vector-databases': ProposalType.NewTool,
      'orchestration-systems': ProposalType.OptimizeExisting,
      'adversarial-techniques': ProposalType.CounterMeasure,
      'safety-research': ProposalType.NewSafetyRule,
      'regulatory-changes': ProposalType.RegulatoryAdaptation,
      'compute-scaling': ProposalType.OptimizeExisting,
      'competitor-platforms': ProposalType.NewDefense,
      'research-papers': ProposalType.NewHeuristic,
      'hardware-accelerators': ProposalType.OptimizeExisting,
    };
    return domainMap[signal.domain] ?? (sim.netScore > 0 ? ProposalType.NewTool : ProposalType.NewDefense);
  }

  /** Generate a human-readable proposal title. */
  private deriveProposalTitle(type: ProposalType, signal: EcosystemSignal): string {
    const prefixes: Record<ProposalType, string> = {
      [ProposalType.NewModel]: 'Integrate new model',
      [ProposalType.NewDefense]: 'Deploy defensive countermeasure',
      [ProposalType.NewHeuristic]: 'Add reasoning heuristic',
      [ProposalType.NewAgent]: 'Onboard new agent capability',
      [ProposalType.NewTool]: 'Add new tool to Arsenal',
      [ProposalType.NewSafetyRule]: 'Adopt safety improvement',
      [ProposalType.NewReasoningPath]: 'Extend reasoning pipeline',
      [ProposalType.CounterMeasure]: 'Deploy countermeasure',
      [ProposalType.OptimizeExisting]: 'Optimize existing subsystem',
      [ProposalType.RegulatoryAdaptation]: 'Adapt to regulatory change',
    };
    return `${prefixes[type]}: ${signal.name}`;
  }

  // ------------------------------------------------------------------
  // 4. ROOT-OWNER GOVERNANCE (only you call these)
  // ------------------------------------------------------------------

  /** Approve a pending proposal. */
  public approveProposal(id: string): boolean {
    const p = this.state.proposals.get(id);
    if (p?.status !== 'pending') return false;
    p.status = 'approved';
    p.reviewedAt = Date.now();
    p.reviewedBy = 'root-owner';

    this.emit({
      kind: 'approval',
      detail: `Proposal ${id} approved: ${p.title}`,
      timestamp: Date.now(),
      payload: { proposalId: id, type: p.type, priority: p.recommendedPriority },
    });
    return true;
  }

  /** Reject a pending proposal. */
  public rejectProposal(id: string): boolean {
    const p = this.state.proposals.get(id);
    if (p?.status !== 'pending') return false;
    p.status = 'rejected';
    p.reviewedAt = Date.now();
    p.reviewedBy = 'root-owner';

    this.emit({
      kind: 'rejection',
      detail: `Proposal ${id} rejected: ${p.title}`,
      timestamp: Date.now(),
      payload: { proposalId: id },
    });
    return true;
  }

  /** Defer a proposal for later review. */
  public deferProposal(id: string): boolean {
    const p = this.state.proposals.get(id);
    if (p?.status !== 'pending') return false;
    p.status = 'deferred';
    p.reviewedAt = Date.now();
    p.reviewedBy = 'root-owner';
    return true;
  }

  /** Release approved proposals as a new version. */
  public rolloutVersion(versionTag: string, changelog: string): VersionRecord | null {
    const approved = this.getApprovedProposals();
    if (approved.length === 0) return null;

    for (const p of approved) {
      p.status = 'implemented';
    }

    const record: VersionRecord = {
      version: versionTag,
      releasedAt: Date.now(),
      proposalIds: approved.map(p => p.id),
      changelog,
      rollbackAvailable: true,
    };
    this.state.versions.push(record);
    this.state.currentVersion = versionTag;

    this.emit({
      kind: 'rollout',
      detail: `Version ${versionTag} released with ${approved.length} improvements`,
      timestamp: Date.now(),
      payload: {
        version: versionTag,
        proposalCount: approved.length,
        types: approved.map(p => p.type),
      },
    });

    return record;
  }

  // ------------------------------------------------------------------
  // 5. FULL CYCLE — Monitor → Simulate → Propose
  // ------------------------------------------------------------------

  /** Run one complete DIS cycle. Called internally or by scheduler. */
  public runCycle(): void {
    this.state.cycleTick++;

    // 1. Collect signals
    const signals = this.collectSignals();

    // 2. Run simulations
    const sims = this.runSimulations(signals);

    // 3. Generate proposals
    this.generateProposals(sims);

    // 4. Update global risk level
    const allThreats = Array.from(this.state.threats.values());
    this.state.globalRiskLevel = deriveGlobalRisk(allThreats);

    // 5. Feed intelligence into ML for adaptive learning
    this.feedMLAdaptation();

    // 6. Alert if risk is elevated
    if (this.state.globalRiskLevel === 'critical' || this.state.globalRiskLevel === 'elevated') {
      this.emit({
        kind: 'alert',
        detail: `Global risk level: ${this.state.globalRiskLevel}`,
        timestamp: Date.now(),
        payload: {
          riskLevel: this.state.globalRiskLevel,
          threatCount: allThreats.length,
          highestRisk: allThreats.reduce((max, t) => Math.max(max, t.compoundRisk), 0),
        },
      });
    }
  }

  /** Feed DIS intelligence into ML layer for continuous adaptation. */
  private feedMLAdaptation(): void {
    // Create a dataset from simulation results for ML trend analysis
    const simData: number[][] = [];
    this.state.simulations.forEach(sim => {
      simData.push([
        sim.netScore,
        sim.threat?.compoundRisk ?? 0,
        sim.opportunity?.strategicAdvantage ?? 0,
        classificationWeight(
          this.state.signals.get(sim.signalId)?.classification ?? SignalClassification.Unknown,
        ),
      ]);
    });

    if (simData.length >= 5) {
      this.ml.addDataset('dis_threat_landscape', simData);
      this.ml.setModelType(MLModelType.TimeSeries);
      // Predictive analytics gets strategic foresight mode
      this.predictive.setModel(PredictiveModel.StrategicForesight);
      this.predictive.runAnalysis('dis_landscape_forecast');
    }
  }

  // ------------------------------------------------------------------
  // 6. QUERY METHODS
  // ------------------------------------------------------------------

  /** Generate full intel report for root-owner. */
  public generateReport(): DefensiveIntelReport {
    return {
      generatedAt: Date.now(),
      cycleTick: this.state.cycleTick,
      signals: Array.from(this.state.signals.values()),
      threats: Array.from(this.state.threats.values()),
      opportunities: Array.from(this.state.opportunities.values()),
      simulations: Array.from(this.state.simulations.values()),
      proposals: Array.from(this.state.proposals.values()),
      globalRiskLevel: this.state.globalRiskLevel,
      notes: this.generateNotes(),
      versionLineage: this.state.versions.slice(),
    };
  }

  /** Get pending proposals for review. */
  public getPendingProposals(): UpgradeProposal[] {
    return Array.from(this.state.proposals.values())
      .filter(p => p.status === 'pending');
  }

  /** Get approved proposals awaiting rollout. */
  public getApprovedProposals(): UpgradeProposal[] {
    return Array.from(this.state.proposals.values())
      .filter(p => p.status === 'approved');
  }

  /** Get all proposals regardless of status. */
  public getAllProposals(): UpgradeProposal[] {
    return Array.from(this.state.proposals.values());
  }

  /** Get version history. */
  public getVersionHistory(): VersionRecord[] {
    return this.state.versions.slice();
  }

  /** Get current global risk level. */
  public getGlobalRiskLevel(): GlobalRiskLevel {
    return this.state.globalRiskLevel;
  }

  /** Get current version string. */
  public getCurrentVersion(): string {
    return this.state.currentVersion;
  }

  /** Generate strategic notes based on current state. */
  private generateNotes(): string[] {
    const notes: string[] = [];
    const pending = this.getPendingProposals();
    const critical = pending.filter(p => p.recommendedPriority === 'critical');

    if (critical.length > 0) {
      notes.push(`${critical.length} CRITICAL proposal(s) require immediate review`);
    }
    if (this.state.globalRiskLevel === 'elevated' || this.state.globalRiskLevel === 'critical') {
      notes.push(`Risk posture: ${this.state.globalRiskLevel.toUpperCase()} — defensive measures recommended`);
    }
    if (pending.length > 10) {
      notes.push(`${pending.length} pending proposals — consider batch review`);
    }

    const arsenalSummary = this.arsenal.getSummary();
    if (arsenalSummary.licensedTools < arsenalSummary.paidTools * 0.3) {
      notes.push('Arsenal utilization low — consider licensing more paid tools for capability expansion');
    }

    return notes;
  }

  // ------------------------------------------------------------------
  // 7. PREDICTIVE THREAT ANTICIPATION
  // ------------------------------------------------------------------

  /** Run predictive threat anticipation using all integrated layers. */
  public anticipateThreats(): ThreatInsight[] {
    // Use ZPE-style reasoning via strategy layer
    this.strategy.setMode(StrategyMode.AIPredictive);

    // Use ML to analyze threat patterns
    const threatData: number[][] = [];
    this.state.threats.forEach(t => {
      threatData.push([t.threatLikelihood, t.threatImpact, t.compoundRisk]);
    });

    if (threatData.length >= 3) {
      this.ml.addDataset('dis_threat_patterns', threatData);
      this.ml.setModelType(MLModelType.TimeSeries);
    }

    // Generate anticipated threats based on pattern extrapolation
    const anticipated: ThreatInsight[] = [];
    const topThreats = Array.from(this.state.threats.values())
      .sort((a, b) => b.compoundRisk - a.compoundRisk)
      .slice(0, 5);

    for (const t of topThreats) {
      // Extrapolate: if this threat compounds, what's the next evolution?
      anticipated.push({
        signalId: t.signalId + '_anticipated',
        threatLikelihood: Math.min(1, t.threatLikelihood * 1.2),
        threatImpact: Math.min(1, t.threatImpact * 1.15),
        compoundRisk: Math.min(1, t.compoundRisk * 1.3),
        mitigationStrategy: 'Pre-emptive defense: ' + t.mitigationStrategy,
        anticipatedTimeline: 'Next cycle',
      });
    }

    return anticipated;
  }

  // ------------------------------------------------------------------
  // Summary (for TSU — sanitized, no secrets)
  // ------------------------------------------------------------------

  public getSummary(): DISSummary {
    return {
      cycleTick: this.state.cycleTick,
      signalCount: this.state.signals.size,
      threatCount: this.state.threats.size,
      opportunityCount: this.state.opportunities.size,
      pendingProposals: this.getPendingProposals().length,
      approvedProposals: this.getApprovedProposals().length,
      implementedProposals: Array.from(this.state.proposals.values())
        .filter(p => p.status === 'implemented').length,
      globalRiskLevel: this.state.globalRiskLevel,
      currentVersion: this.state.currentVersion,
      versionsReleased: this.state.versions.length,
      uptime: Date.now() - this.state.startedAt,
      eventCount: this.events.length,
    };
  }

  // ------------------------------------------------------------------
  // 8. QUBITCOIN INTEGRATION (dormant economic engine)
  // ------------------------------------------------------------------

  /** Access the QubitCoin engine (always available, but dormant until activated). */
  public getQubitCoinEngine(): QubitCoinEngine {
    return this.qubitCoin;
  }

  private readonly qubitCoin: QubitCoinEngine = new QubitCoinEngine();
}

// ===========================================================================
// QubitCoin — Full Economic Engine
// ===========================================================================
//
// A platform-native crypto-economic asset designed to become a defining
// part of AgentArmy's identity. Usage = investment in the platform's
// future. Every interaction with AgentArmy reinforces the token's value.
//
// Architecture:
//   Utility      — earned & spent through OS usage; medium of exchange
//   Scarcity     — 10-year halving schedule; predictable supply decline
//   Growth       — platform success → more demand → more treasury → more value
//   Treasury     — 75% platform / 25% users split funds compute & R&D
//   Early Adopter— vintage effect: older coins become rarer & more valuable
//   Tradeable    — transferable on-chain; full wallet & transaction ledger
//
// DORMANT by default. Activated ONLY by root-owner password gate.
// No public API, no dashboard exposure, no tenant access until activated.
// ===========================================================================

// ---------------------------------------------------------------------------
// QubitCoin — Types
// ---------------------------------------------------------------------------

/** Activation status of the QubitCoin engine. */
export type QCActivationStatus = 'dormant' | 'activating' | 'active' | 'frozen';

/** Transaction kind within the QubitCoin economy. */
export type QCTransactionKind =
  | 'issuance'         // new coins minted (usage reward)
  | 'usage-reward'     // coins earned by using the OS
  | 'referral-reward'  // coins earned by referring new users
  | 'milestone-reward' // coins earned by hitting milestones
  | 'treasury-deposit' // platform's share entering treasury
  | 'transfer'         // user-to-user transfer
  | 'trade'            // exchange/marketplace trade
  | 'buyback'          // treasury purchasing coins from market
  | 'burn'             // permanent supply reduction
  | 'staking-reward'   // earned from staking (future)
  | 'compute-spend'    // coins spent on premium compute
  | 'tool-unlock'      // coins spent to unlock premium tools
  | 'fee'              // network/platform fee deducted per transaction
  | 'genesis'          // initial allocation at activation;

/** Halving epoch in the 10-year schedule. */
export interface HalvingEpoch {
  epochIndex: number;           // 0-based
  epochLabel: string;           // "Year 1-2", etc.
  startYear: number;            // year offset from activation
  endYear: number;
  baseRewardPerAction: number;  // QC per qualifying action
  blockReward: number;          // QC per "block" (batch of actions)
  cumulativeSupplyAtEnd: number;// total supply issued by epoch end
  halvingMultiplier: number;    // 1.0, 0.5, 0.25, 0.125, 0.0625
}

/** A user wallet in the QubitCoin economy. */
export interface QCWallet {
  walletId: string;
  ownerId: string;              // user ID or 'treasury' or 'genesis'
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalTransferred: number;
  totalReceived: number;
  vintageEpoch: number;         // epoch when wallet was created (rarity signal)
  createdAt: number;
  lastActivityAt: number;
  frozen: boolean;
}

/** A single transaction in the QubitCoin ledger. */
export interface QCTransaction {
  txId: string;
  kind: QCTransactionKind;
  from: string;                 // wallet ID or 'system'
  to: string;                   // wallet ID or 'system'
  amount: number;
  fee: number;
  memo: string;
  timestamp: number;
  epochAtTime: number;
  blockIndex: number;
}

/** Treasury state snapshot. */
export interface QCTreasurySnapshot {
  balance: number;
  totalDeposited: number;
  totalInvested: number;         // compute, R&D, partnerships
  totalBuyback: number;
  totalBurned: number;
  reserveRatio: number;          // treasury / circulating supply
  lastUpdated: number;
}

/** Investment allocation from treasury. */
export interface QCTreasuryInvestment {
  id: string;
  category: 'compute' | 'research' | 'partnerships' | 'marketing' | 'security' | 'reserves';
  amount: number;
  description: string;
  approvedBy: string;            // 'root-owner'
  approvedAt: number;
  expectedROI: string;
}

/** Supply metrics at a point in time. */
export interface QCSupplyMetrics {
  totalSupplyCap: number;        // absolute maximum
  totalIssued: number;           // all coins ever minted
  totalBurned: number;           // permanently destroyed
  circulatingSupply: number;     // issued - burned - treasury
  treasuryHeld: number;
  currentEpoch: number;
  currentBlockReward: number;
  nextHalvingIn: number;         // ms until next halving
  halvingProgress: number;       // 0-1 through current epoch
  scarcityIndex: number;         // 0-1 (higher = scarcer)
}

/** QubitCoin engine summary for DIS integration. */
export interface QCSummary {
  status: QCActivationStatus;
  totalSupplyCap: number;
  totalIssued: number;
  circulatingSupply: number;
  treasuryBalance: number;
  walletCount: number;
  transactionCount: number;
  currentEpoch: number;
  currentBlockReward: number;
  scarcityIndex: number;
  platformRevenueQC: number;     // total QC generated from platform usage
  userRewardsQC: number;         // total QC distributed to users
  blocksMined: number;
}

/** QubitCoin event. */
export interface QCEvent {
  kind: 'activation' | 'issuance' | 'transfer' | 'trade' | 'burn' | 'buyback'
    | 'treasury-invest' | 'halving' | 'freeze' | 'milestone';
  detail: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// QubitCoin — Constants
// ---------------------------------------------------------------------------

/** Maximum supply: 21 billion QubitCoin (21,000,000,000 QC). */
const QC_MAX_SUPPLY = 21_000_000_000;

/** Genesis block allocation for treasury bootstrap (1% of max). */
const QC_GENESIS_ALLOCATION = QC_MAX_SUPPLY * 0.01;

/** Transaction fee rate (0.1% of amount). */
const QC_FEE_RATE = 0.001;

/** Treasury share of all issuance (75%). */
const QC_TREASURY_SHARE = 0.75;

/** User share of all issuance (25%). */
const QC_USER_SHARE = 0.25;

/** Number of actions per "block" (batch reward trigger). */
const QC_ACTIONS_PER_BLOCK = 100;

/**
 * 10-Year Halving Schedule.
 *
 * 5 epochs, each 2 years. Reward halves each epoch.
 * Epoch 0: Years 0-2  → 1.0× base reward
 * Epoch 1: Years 2-4  → 0.5× base reward
 * Epoch 2: Years 4-6  → 0.25× base reward
 * Epoch 3: Years 6-8  → 0.125× base reward
 * Epoch 4: Years 8-10 → 0.0625× base reward
 *
 * After year 10: no more issuance. Fully scarce.
 */
const QC_BASE_BLOCK_REWARD = 10_000; // QC per block in epoch 0

function buildHalvingSchedule(): HalvingEpoch[] {
  const epochs: HalvingEpoch[] = [];
  let cumulative = QC_GENESIS_ALLOCATION;
  const blocksPerYear = 365 * 24; // ~1 block per hour under normal usage
  for (let i = 0; i < 5; i++) {
    const multiplier = 1 / Math.pow(2, i);
    const reward = QC_BASE_BLOCK_REWARD * multiplier;
    const epochBlocks = blocksPerYear * 2; // 2-year epochs
    cumulative += reward * epochBlocks;
    const capped = Math.min(cumulative, QC_MAX_SUPPLY);
    epochs.push({
      epochIndex: i,
      epochLabel: `Year ${i * 2 + 1}-${(i + 1) * 2}`,
      startYear: i * 2,
      endYear: (i + 1) * 2,
      baseRewardPerAction: reward / QC_ACTIONS_PER_BLOCK,
      blockReward: reward,
      cumulativeSupplyAtEnd: capped,
      halvingMultiplier: multiplier,
    });
  }
  return epochs;
}

const HALVING_SCHEDULE = buildHalvingSchedule();

// ---------------------------------------------------------------------------
// QubitCoin — Internal state
// ---------------------------------------------------------------------------

interface QCState {
  status: QCActivationStatus;
  activatedAt: number | null;
  activationKey: string | null;    // hashed root-owner key
  wallets: Map<string, QCWallet>;
  transactions: QCTransaction[];
  treasury: QCTreasurySnapshot;
  investments: QCTreasuryInvestment[];
  totalIssued: number;
  totalBurned: number;
  currentEpoch: number;
  blockIndex: number;
  actionsInCurrentBlock: number;
  platformRevenueQC: number;
  userRewardsQC: number;
}

let qcTxCounter = 0;
function nextTxId(): string {
  qcTxCounter++;
  return 'QC-TX-' + String(qcTxCounter).padStart(8, '0');
}

let qcWalletCounter = 0;
function nextWalletId(): string {
  qcWalletCounter++;
  return 'QC-W-' + String(qcWalletCounter).padStart(6, '0');
}

let qcInvestmentCounter = 0;
function nextInvestmentId(): string {
  qcInvestmentCounter++;
  return 'QC-INV-' + String(qcInvestmentCounter).padStart(5, '0');
}

/** Simple hash for activation key (not cryptographic — placeholder). */
function hashKey(key: string): string {
  let h = 0;
  for (const ch of key) {
    h = Math.trunc((h << 5) - h + (ch.codePointAt(0) ?? 0));
  }
  return 'QCKEY-' + Math.abs(h).toString(36).toUpperCase();
}

// ---------------------------------------------------------------------------
// QubitCoinEngine
// ---------------------------------------------------------------------------

export class QubitCoinEngine {
  private readonly state: QCState;
  private readonly listeners: Array<(e: QCEvent) => void>;
  private readonly events: QCEvent[];

  constructor() {
    this.listeners = [];
    this.events = [];
    this.state = this.initState();
  }

  private initState(): QCState {
    return {
      status: 'dormant',
      activatedAt: null,
      activationKey: null,
      wallets: new Map(),
      transactions: [],
      treasury: {
        balance: 0,
        totalDeposited: 0,
        totalInvested: 0,
        totalBuyback: 0,
        totalBurned: 0,
        reserveRatio: 0,
        lastUpdated: Date.now(),
      },
      investments: [],
      totalIssued: 0,
      totalBurned: 0,
      currentEpoch: 0,
      blockIndex: 0,
      actionsInCurrentBlock: 0,
      platformRevenueQC: 0,
      userRewardsQC: 0,
    };
  }

  // ------------------------------------------------------------------
  // Event system
  // ------------------------------------------------------------------

  public on(listener: (e: QCEvent) => void): () => void {
    const { listeners } = this;
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  private emitQC(event: QCEvent): void {
    this.events.push(event);
    for (const l of this.listeners) l(event);
  }

  // ------------------------------------------------------------------
  // Activation gate — root-owner ONLY
  // ------------------------------------------------------------------

  /** Check if the engine is active. */
  public isActive(): boolean {
    return this.state.status === 'active';
  }

  /** Check if the engine is dormant. */
  public isDormant(): boolean {
    return this.state.status === 'dormant';
  }

  /** Check current status. */
  public getStatus(): QCActivationStatus {
    return this.state.status;
  }

  /**
   * Activate the QubitCoin engine with the root-owner's private key.
   * This is the ONLY way to bring the engine online.
   * Once activated, the genesis allocation is minted and treasury seeded.
   */
  public activate(rootOwnerKey: string): boolean {
    if (this.state.status !== 'dormant') return false;
    if (!rootOwnerKey || rootOwnerKey.length < 8) return false;

    this.state.status = 'activating';
    this.state.activationKey = hashKey(rootOwnerKey);
    this.state.activatedAt = Date.now();

    // Create treasury wallet
    const treasuryWallet = this.createWalletInternal('treasury');

    // Genesis allocation: 1% to treasury as bootstrap
    this.mintInternal(treasuryWallet.walletId, QC_GENESIS_ALLOCATION, 'genesis', 'Genesis allocation — treasury bootstrap');
    this.state.treasury.balance = QC_GENESIS_ALLOCATION;
    this.state.treasury.totalDeposited = QC_GENESIS_ALLOCATION;

    this.state.status = 'active';

    this.emitQC({
      kind: 'activation',
      detail: 'QubitCoin engine activated by root-owner',
      timestamp: Date.now(),
      payload: {
        genesisAllocation: QC_GENESIS_ALLOCATION,
        maxSupply: QC_MAX_SUPPLY,
        halvingEpochs: HALVING_SCHEDULE.length,
        treasuryShare: QC_TREASURY_SHARE,
        userShare: QC_USER_SHARE,
      },
    });

    return true;
  }

  /**
   * Freeze the engine (emergency). Requires the SAME key used to activate.
   * All transactions are halted. Can be unfrozen later.
   */
  public freeze(rootOwnerKey: string): boolean {
    if (this.state.status !== 'active') return false;
    if (hashKey(rootOwnerKey) !== this.state.activationKey) return false;

    this.state.status = 'frozen';
    this.emitQC({
      kind: 'freeze',
      detail: 'QubitCoin engine frozen by root-owner',
      timestamp: Date.now(),
      payload: { frozenAt: Date.now() },
    });
    return true;
  }

  /** Unfreeze the engine. */
  public unfreeze(rootOwnerKey: string): boolean {
    if (this.state.status !== 'frozen') return false;
    if (hashKey(rootOwnerKey) !== this.state.activationKey) return false;

    this.state.status = 'active';
    this.emitQC({
      kind: 'activation',
      detail: 'QubitCoin engine unfrozen by root-owner',
      timestamp: Date.now(),
      payload: { unfrozenAt: Date.now() },
    });
    return true;
  }

  // ------------------------------------------------------------------
  // Wallet management
  // ------------------------------------------------------------------

  private createWalletInternal(ownerId: string): QCWallet {
    const wallet: QCWallet = {
      walletId: nextWalletId(),
      ownerId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      totalTransferred: 0,
      totalReceived: 0,
      vintageEpoch: this.state.currentEpoch,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      frozen: false,
    };
    this.state.wallets.set(wallet.walletId, wallet);
    return wallet;
  }

  /** Create a wallet for a user. Requires active engine. */
  public createWallet(ownerId: string): QCWallet | null {
    if (!this.isActive()) return null;
    return this.createWalletInternal(ownerId);
  }

  /** Get a wallet by ID. */
  public getWallet(walletId: string): QCWallet | null {
    return this.state.wallets.get(walletId) ?? null;
  }

  /** Get wallet by owner ID. */
  public getWalletByOwner(ownerId: string): QCWallet | null {
    for (const w of this.state.wallets.values()) {
      if (w.ownerId === ownerId) return w;
    }
    return null;
  }

  /** Get all wallets (root-owner only). */
  public getAllWallets(): QCWallet[] {
    return Array.from(this.state.wallets.values());
  }

  /** Get the treasury wallet. */
  public getTreasuryWallet(): QCWallet | null {
    return this.getWalletByOwner('treasury');
  }

  // ------------------------------------------------------------------
  // Issuance & mining
  // ------------------------------------------------------------------

  /** Internal mint operation. */
  private mintInternal(toWalletId: string, amount: number, kind: QCTransactionKind, memo: string): QCTransaction | null {
    const wallet = this.state.wallets.get(toWalletId);
    if (!wallet) return null;
    if (this.state.totalIssued + amount > QC_MAX_SUPPLY) {
      // Cap at max supply
      const remaining = QC_MAX_SUPPLY - this.state.totalIssued;
      if (remaining <= 0) return null;
      amount = remaining;
    }

    const tx: QCTransaction = {
      txId: nextTxId(),
      kind,
      from: 'system',
      to: toWalletId,
      amount,
      fee: 0,
      memo,
      timestamp: Date.now(),
      epochAtTime: this.state.currentEpoch,
      blockIndex: this.state.blockIndex,
    };

    wallet.balance += amount;
    wallet.totalEarned += amount;
    wallet.lastActivityAt = Date.now();
    this.state.totalIssued += amount;
    this.state.transactions.push(tx);
    return tx;
  }

  /**
   * Record a user action and issue rewards.
   * This is the core "usage = investment" mechanism.
   * Every qualifying action earns the user QC and deposits the
   * platform's share into the treasury.
   */
  public recordAction(userWalletId: string, actionDescription: string): QCTransaction | null {
    if (!this.isActive()) return null;
    if (this.isSupplyExhausted()) return null;

    this.state.actionsInCurrentBlock++;

    // Check epoch progression
    this.advanceEpochIfNeeded();

    const epoch = HALVING_SCHEDULE[this.state.currentEpoch];
    if (!epoch) return null; // past final epoch

    const userReward = epoch.baseRewardPerAction * QC_USER_SHARE;
    const treasuryReward = epoch.baseRewardPerAction * QC_TREASURY_SHARE;

    // Mint user reward
    const userTx = this.mintInternal(
      userWalletId, userReward, 'usage-reward',
      `Usage reward: ${actionDescription} (epoch ${epoch.epochLabel})`,
    );
    if (userTx) {
      this.state.userRewardsQC += userReward;
    }

    // Mint treasury share
    const treasuryWallet = this.getTreasuryWallet();
    if (treasuryWallet) {
      this.mintInternal(
        treasuryWallet.walletId, treasuryReward, 'treasury-deposit',
        `Treasury deposit from action: ${actionDescription}`,
      );
      this.state.treasury.balance += treasuryReward;
      this.state.treasury.totalDeposited += treasuryReward;
      this.state.platformRevenueQC += treasuryReward;
    }

    // Check if block is complete
    if (this.state.actionsInCurrentBlock >= QC_ACTIONS_PER_BLOCK) {
      this.completeBlock();
    }

    this.emitQC({
      kind: 'issuance',
      detail: `Rewarded ${userReward.toFixed(2)} QC for: ${actionDescription}`,
      timestamp: Date.now(),
      payload: {
        userReward,
        treasuryReward,
        epoch: this.state.currentEpoch,
        totalIssued: this.state.totalIssued,
      },
    });

    return userTx;
  }

  /** Complete a block and reset action counter. */
  private completeBlock(): void {
    this.state.blockIndex++;
    this.state.actionsInCurrentBlock = 0;
  }

  /** Advance to next epoch if time-based halving has occurred. */
  private advanceEpochIfNeeded(): void {
    if (!this.state.activatedAt) return;
    const yearsElapsed = (Date.now() - this.state.activatedAt) / (365.25 * 24 * 3600 * 1000);
    const shouldBeEpoch = Math.min(4, Math.floor(yearsElapsed / 2));
    if (shouldBeEpoch > this.state.currentEpoch) {
      const oldEpoch = this.state.currentEpoch;
      this.state.currentEpoch = shouldBeEpoch;
      this.emitQC({
        kind: 'halving',
        detail: `Halving event: epoch ${oldEpoch} → ${shouldBeEpoch}. Block reward halved.`,
        timestamp: Date.now(),
        payload: {
          oldEpoch,
          newEpoch: shouldBeEpoch,
          newBlockReward: HALVING_SCHEDULE[shouldBeEpoch]?.blockReward ?? 0,
          newMultiplier: HALVING_SCHEDULE[shouldBeEpoch]?.halvingMultiplier ?? 0,
        },
      });
    }
  }

  /** Check if max supply has been reached. */
  public isSupplyExhausted(): boolean {
    return this.state.totalIssued >= QC_MAX_SUPPLY;
  }

  // ------------------------------------------------------------------
  // Transfers & trades
  // ------------------------------------------------------------------

  /**
   * Transfer QC between wallets. Deducts a small fee.
   * This is how users trade QC "on the block" — just like any other asset.
   */
  public transfer(fromWalletId: string, toWalletId: string, amount: number, memo: string): QCTransaction | null {
    if (!this.isActive()) return null;
    const from = this.state.wallets.get(fromWalletId);
    const to = this.state.wallets.get(toWalletId);
    if (!from || !to) return null;
    if (from.frozen || to.frozen) return null;

    const fee = Math.max(1, amount * QC_FEE_RATE);
    const totalCost = amount + fee;
    if (from.balance < totalCost) return null;

    from.balance -= totalCost;
    from.totalSpent += fee;
    from.totalTransferred += amount;
    from.lastActivityAt = Date.now();

    to.balance += amount;
    to.totalReceived += amount;
    to.lastActivityAt = Date.now();

    // Fee goes to treasury
    const treasuryWallet = this.getTreasuryWallet();
    if (treasuryWallet) {
      treasuryWallet.balance += fee;
      this.state.treasury.balance += fee;
      this.state.treasury.totalDeposited += fee;
    }

    const tx: QCTransaction = {
      txId: nextTxId(),
      kind: 'transfer',
      from: fromWalletId,
      to: toWalletId,
      amount,
      fee,
      memo,
      timestamp: Date.now(),
      epochAtTime: this.state.currentEpoch,
      blockIndex: this.state.blockIndex,
    };
    this.state.transactions.push(tx);

    this.emitQC({
      kind: 'transfer',
      detail: `Transfer ${amount.toFixed(2)} QC: ${fromWalletId} → ${toWalletId}`,
      timestamp: Date.now(),
      payload: { txId: tx.txId, amount, fee },
    });

    return tx;
  }

  /**
   * Execute a trade (market transaction). Same as transfer but tagged differently
   * for analytics and marketplace integration.
   */
  public trade(sellerWalletId: string, buyerWalletId: string, amount: number, pricePerUnit: number): QCTransaction | null {
    if (!this.isActive()) return null;
    const seller = this.state.wallets.get(sellerWalletId);
    const buyer = this.state.wallets.get(buyerWalletId);
    if (!seller || !buyer) return null;
    if (seller.frozen || buyer.frozen) return null;
    if (seller.balance < amount) return null;

    const fee = Math.max(1, amount * QC_FEE_RATE);
    seller.balance -= amount;
    seller.totalTransferred += amount;
    seller.lastActivityAt = Date.now();

    buyer.balance += amount - fee;
    buyer.totalReceived += amount - fee;
    buyer.lastActivityAt = Date.now();

    // Fee to treasury
    const treasuryWallet = this.getTreasuryWallet();
    if (treasuryWallet) {
      treasuryWallet.balance += fee;
      this.state.treasury.balance += fee;
    }

    const tx: QCTransaction = {
      txId: nextTxId(),
      kind: 'trade',
      from: sellerWalletId,
      to: buyerWalletId,
      amount,
      fee,
      memo: `Trade at ${pricePerUnit.toFixed(4)}/QC`,
      timestamp: Date.now(),
      epochAtTime: this.state.currentEpoch,
      blockIndex: this.state.blockIndex,
    };
    this.state.transactions.push(tx);

    this.emitQC({
      kind: 'trade',
      detail: `Trade ${amount.toFixed(2)} QC at ${pricePerUnit.toFixed(4)}/QC`,
      timestamp: Date.now(),
      payload: { txId: tx.txId, amount, fee, pricePerUnit },
    });

    return tx;
  }

  // ------------------------------------------------------------------
  // Burn & buyback
  // ------------------------------------------------------------------

  /** Burn QC permanently — reduces circulating supply, increases scarcity. */
  public burn(walletId: string, amount: number, reason: string): boolean {
    if (!this.isActive()) return false;
    const wallet = this.state.wallets.get(walletId);
    if (!wallet || wallet.balance < amount) return false;

    wallet.balance -= amount;
    wallet.totalSpent += amount;
    this.state.totalBurned += amount;

    if (wallet.ownerId === 'treasury') {
      this.state.treasury.balance -= amount;
      this.state.treasury.totalBurned += amount;
    }

    const tx: QCTransaction = {
      txId: nextTxId(),
      kind: 'burn',
      from: walletId,
      to: 'system',
      amount,
      fee: 0,
      memo: `Burn: ${reason}`,
      timestamp: Date.now(),
      epochAtTime: this.state.currentEpoch,
      blockIndex: this.state.blockIndex,
    };
    this.state.transactions.push(tx);

    this.emitQC({
      kind: 'burn',
      detail: `Burned ${amount.toFixed(2)} QC: ${reason}`,
      timestamp: Date.now(),
      payload: { amount, totalBurned: this.state.totalBurned },
    });
    return true;
  }

  /**
   * Treasury buyback — treasury purchases QC from the market
   * to support price floor and reduce circulating supply.
   */
  public treasuryBuyback(amount: number, fromWalletId: string): boolean {
    if (!this.isActive()) return false;
    const treasuryWallet = this.getTreasuryWallet();
    const seller = this.state.wallets.get(fromWalletId);
    if (!treasuryWallet || !seller) return false;
    if (seller.balance < amount) return false;

    seller.balance -= amount;
    seller.totalTransferred += amount;
    treasuryWallet.balance += amount;
    this.state.treasury.balance += amount;
    this.state.treasury.totalBuyback += amount;

    const tx: QCTransaction = {
      txId: nextTxId(),
      kind: 'buyback',
      from: fromWalletId,
      to: treasuryWallet.walletId,
      amount,
      fee: 0,
      memo: 'Treasury buyback',
      timestamp: Date.now(),
      epochAtTime: this.state.currentEpoch,
      blockIndex: this.state.blockIndex,
    };
    this.state.transactions.push(tx);

    this.emitQC({
      kind: 'buyback',
      detail: `Treasury buyback: ${amount.toFixed(2)} QC from ${fromWalletId}`,
      timestamp: Date.now(),
      payload: { amount, treasuryBalance: this.state.treasury.balance },
    });
    return true;
  }

  // ------------------------------------------------------------------
  // Treasury investment (root-owner only)
  // ------------------------------------------------------------------

  /** Invest treasury funds into compute, R&D, partnerships, etc. */
  public treasuryInvest(opts: {
    category: QCTreasuryInvestment['category'];
    amount: number;
    description: string;
    expectedROI: string;
    rootOwnerKey: string;
  }): QCTreasuryInvestment | null {
    if (!this.isActive()) return null;
    if (hashKey(opts.rootOwnerKey) !== this.state.activationKey) return null;

    const treasuryWallet = this.getTreasuryWallet();
    if (!treasuryWallet || treasuryWallet.balance < opts.amount) return null;

    treasuryWallet.balance -= opts.amount;
    this.state.treasury.balance -= opts.amount;
    this.state.treasury.totalInvested += opts.amount;

    const inv: QCTreasuryInvestment = {
      id: nextInvestmentId(),
      category: opts.category,
      amount: opts.amount,
      description: opts.description,
      approvedBy: 'root-owner',
      approvedAt: Date.now(),
      expectedROI: opts.expectedROI,
    };
    this.state.investments.push(inv);

    this.emitQC({
      kind: 'treasury-invest',
      detail: `Treasury investment: ${opts.amount.toFixed(2)} QC → ${opts.category}`,
      timestamp: Date.now(),
      payload: { investmentId: inv.id, category: opts.category, amount: opts.amount },
    });

    return inv;
  }

  /** Get all treasury investments. */
  public getInvestments(): QCTreasuryInvestment[] {
    return this.state.investments.slice();
  }

  // ------------------------------------------------------------------
  // Milestone & referral rewards
  // ------------------------------------------------------------------

  /** Award a milestone bonus to a user. */
  public awardMilestone(userWalletId: string, milestoneName: string, bonus: number): QCTransaction | null {
    if (!this.isActive()) return null;
    return this.mintInternal(
      userWalletId, bonus, 'milestone-reward',
      `Milestone: ${milestoneName}`,
    );
  }

  /** Award a referral bonus. */
  public awardReferral(referrerWalletId: string, referredUserId: string, bonus: number): QCTransaction | null {
    if (!this.isActive()) return null;
    return this.mintInternal(
      referrerWalletId, bonus, 'referral-reward',
      `Referral reward for bringing user ${referredUserId}`,
    );
  }

  // ------------------------------------------------------------------
  // Spending (compute, tools)
  // ------------------------------------------------------------------

  /** Spend QC on premium compute. */
  public spendOnCompute(walletId: string, amount: number, computeDescription: string): QCTransaction | null {
    if (!this.isActive()) return null;
    const wallet = this.state.wallets.get(walletId);
    if (!wallet || wallet.balance < amount) return null;

    wallet.balance -= amount;
    wallet.totalSpent += amount;

    // Spend goes to treasury
    const treasuryWallet = this.getTreasuryWallet();
    if (treasuryWallet) {
      treasuryWallet.balance += amount;
      this.state.treasury.balance += amount;
    }

    const tx: QCTransaction = {
      txId: nextTxId(),
      kind: 'compute-spend',
      from: walletId,
      to: treasuryWallet?.walletId ?? 'system',
      amount,
      fee: 0,
      memo: `Compute: ${computeDescription}`,
      timestamp: Date.now(),
      epochAtTime: this.state.currentEpoch,
      blockIndex: this.state.blockIndex,
    };
    this.state.transactions.push(tx);
    return tx;
  }

  /** Spend QC to unlock a premium tool. */
  public spendOnToolUnlock(walletId: string, amount: number, toolName: string): QCTransaction | null {
    if (!this.isActive()) return null;
    const wallet = this.state.wallets.get(walletId);
    if (!wallet || wallet.balance < amount) return null;

    wallet.balance -= amount;
    wallet.totalSpent += amount;

    const treasuryWallet = this.getTreasuryWallet();
    if (treasuryWallet) {
      treasuryWallet.balance += amount;
      this.state.treasury.balance += amount;
    }

    const tx: QCTransaction = {
      txId: nextTxId(),
      kind: 'tool-unlock',
      from: walletId,
      to: treasuryWallet?.walletId ?? 'system',
      amount,
      fee: 0,
      memo: `Tool unlock: ${toolName}`,
      timestamp: Date.now(),
      epochAtTime: this.state.currentEpoch,
      blockIndex: this.state.blockIndex,
    };
    this.state.transactions.push(tx);
    return tx;
  }

  // ------------------------------------------------------------------
  // Supply metrics & analytics
  // ------------------------------------------------------------------

  /** Get current supply metrics. */
  public getSupplyMetrics(): QCSupplyMetrics {
    const issued = this.state.totalIssued;
    const burned = this.state.totalBurned;
    const treasuryHeld = this.state.treasury.balance;
    const circulating = issued - burned - treasuryHeld;
    const epoch = HALVING_SCHEDULE[this.state.currentEpoch];
    const scarcity = issued > 0 ? 1 - (circulating / QC_MAX_SUPPLY) : 0;

    // Compute time until next halving
    let nextHalvingIn = 0;
    if (this.state.activatedAt && this.state.currentEpoch < 4) {
      const nextHalvingTime = this.state.activatedAt + ((this.state.currentEpoch + 1) * 2 * 365.25 * 24 * 3600 * 1000);
      nextHalvingIn = Math.max(0, nextHalvingTime - Date.now());
    }

    // Progress through current epoch
    let halvingProgress = 0;
    if (this.state.activatedAt && epoch) {
      const epochStart = this.state.activatedAt + (epoch.startYear * 365.25 * 24 * 3600 * 1000);
      const epochDuration = 2 * 365.25 * 24 * 3600 * 1000;
      halvingProgress = Math.min(1, Math.max(0, (Date.now() - epochStart) / epochDuration));
    }

    return {
      totalSupplyCap: QC_MAX_SUPPLY,
      totalIssued: issued,
      totalBurned: burned,
      circulatingSupply: Math.max(0, circulating),
      treasuryHeld,
      currentEpoch: this.state.currentEpoch,
      currentBlockReward: epoch?.blockReward ?? 0,
      nextHalvingIn,
      halvingProgress,
      scarcityIndex: Math.min(1, Math.max(0, scarcity)),
    };
  }

  /** Get treasury snapshot. */
  public getTreasurySnapshot(): QCTreasurySnapshot {
    this.state.treasury.lastUpdated = Date.now();
    const supply = this.getSupplyMetrics();
    this.state.treasury.reserveRatio = supply.circulatingSupply > 0
      ? this.state.treasury.balance / supply.circulatingSupply
      : 0;
    return { ...this.state.treasury };
  }

  /** Get halving schedule. */
  public getHalvingSchedule(): HalvingEpoch[] {
    return HALVING_SCHEDULE.slice();
  }

  /** Get transaction history (optionally filtered). */
  public getTransactions(opts?: {
    walletId?: string;
    kind?: QCTransactionKind;
    limit?: number;
  }): QCTransaction[] {
    let txs = this.state.transactions.slice();
    if (opts?.walletId) {
      txs = txs.filter(t => t.from === opts.walletId || t.to === opts.walletId);
    }
    if (opts?.kind) {
      txs = txs.filter(t => t.kind === opts.kind);
    }
    if (opts?.limit) {
      txs = txs.slice(-opts.limit);
    }
    return txs;
  }

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------

  public getSummary(): QCSummary {
    const supply = this.getSupplyMetrics();
    return {
      status: this.state.status,
      totalSupplyCap: QC_MAX_SUPPLY,
      totalIssued: this.state.totalIssued,
      circulatingSupply: supply.circulatingSupply,
      treasuryBalance: this.state.treasury.balance,
      walletCount: this.state.wallets.size,
      transactionCount: this.state.transactions.length,
      currentEpoch: this.state.currentEpoch,
      currentBlockReward: supply.currentBlockReward,
      scarcityIndex: supply.scarcityIndex,
      platformRevenueQC: this.state.platformRevenueQC,
      userRewardsQC: this.state.userRewardsQC,
      blocksMined: this.state.blockIndex,
    };
  }
}
