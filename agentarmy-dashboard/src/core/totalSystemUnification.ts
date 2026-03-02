// ---------------------------------------------------------------------------
// Total System Unification Layer
// ---------------------------------------------------------------------------
// The root orchestrator that wires every subsystem together. Provides a
// single entry‑point for initializing, querying, and controlling the
// entire AgentArmy OS kernel.
// ---------------------------------------------------------------------------

import { SwarmRunnerFabric } from './swarmRunnerFabric';
import { ExecutionTelemetry } from './executionTelemetry';
import { MissionHealthEngine } from './missionHealth';
import { SelfHealingEngine } from './selfHealing';
import { GlobalOrchestrationKernel } from './orchestrationKernel';
import { TemporalContinuityEngine } from './temporalContinuity';
import { GlobalStateSynchronizer } from './globalStateSynchronizer';
import { DistributedConsensusLayer } from './distributedConsensus';
import { ConstitutionalEnforcementGrid } from './constitutionalGrid';
import { GlobalMemoryStore } from './globalMemory';
import { SemanticCompressionLayer } from './semanticCompression';
import { CrossMissionIntelligence } from './crossMissionIntelligence';
import { MetaCognitionEngine } from './metaCognition';
import { MultiTenantIsolationLayer } from './multiTenantIsolation';
import { FederatedIntelligenceMesh } from './federatedIntelligence';
import { InterAgentProtocol } from './interAgentProtocol';
import { ToolRegistry } from './toolRegistry';
import { EcosystemGovernance } from './ecosystemGovernance';
import { PlanetScaleOrchestration } from './planetScaleOrchestration';
import { AutonomousEconomyEngine } from './autonomousEconomy';
import { MetaGovernanceCouncil } from './metaGovernanceCouncil';
import { InteroperabilityBridge } from './interoperabilityBridge';
import { CivilizationIntelligence } from './civilizationIntelligence';
import { RecursiveSelfDesign } from './recursiveSelfDesign';
import { UniversalMissionCompiler } from './universalMissionCompiler';
import { SyntheticPhysicsEngine } from './syntheticPhysics';
import { UnifiedCognitiveField } from './unifiedCognitiveField';
import { SingularityKernel } from './singularityKernel';
import { UniversalAbstractionLayer } from './universalAbstraction';
import { SyntheticRealityFabric } from './syntheticRealityFabric';
import { OmniDomainIntegration } from './omniDomainIntegration';
import { TranscendentMissionEngine } from './transcendentMission';
import { ContinuumEngine } from './continuumEngine';
import { SubstrateAgnosticExecution } from './substrateAgnosticExecution';
import { QuantumAdaptiveIntelligence } from './quantumAdaptiveIntelligence';
import { InterCivilizationalProtocol } from './interCivilizationalProtocol';
import { ContinuumSingularityInterface } from './continuumSingularityInterface';
import { MetaContinuumIntelligence } from './metaContinuumIntelligence';
import { CrossTimelineCoherence } from './crossTimelineCoherence';
import { InfiniteDomainExpansion } from './infiniteDomainExpansion';
import { OmniConstitutionalAlignment } from './omniConstitutionalAlignment';
import { InfiniteEvolutionBoundary } from './infiniteEvolutionBoundary';
import { QuantumSymbiosis } from './quantumSymbiosis';
import { HyperDimensionalCore } from './hyperDimensionalCore';
import { NeuralInfinityLayer } from './neuralInfinityLayer';
import { CosmicAbstraction } from './cosmicAbstraction';
import { EternityFabric } from './eternityFabric';
import { VoidIntegration } from './voidIntegration';
import { RealityTranscender } from './realityTranscender';
import { DimensionWeaver } from './dimensionWeaver';
import { SingularityExtension } from './singularityExtension';
import { EpistemicIntegrityLayer } from './epistemicIntegrity';
import { CulturalHistoricalContextLayer } from './culturalHistoricalContext';
import { SymbolicInterpretationLayer } from './symbolicInterpretation';
import { UnifiedTriggerPipeline } from './unifiedTriggerPipeline';
import { IntegritySafetyKernel } from './integritySafetyKernel';
import { PolyglotIntelligenceStack } from './polyglotIntelligenceStack';
import { GodModeStrategy } from './godModeStrategy';
import { SearchIntelligenceEngine } from './searchIntelligenceEngine';
import { PredictiveAnalyticsLayer } from './predictiveAnalyticsLayer';
import { MachineLearningLayer } from './machineLearningLayer';

// ---------------------------------------------------------------------------
// Subsystem Registry
// ---------------------------------------------------------------------------

export interface SubsystemStatus {
  name: string;
  initialized: boolean;
  healthy: boolean;
  summary: Record<string, unknown>;
}

export interface UnifiedSystemSnapshot {
  subsystems: SubsystemStatus[];
  totalSubsystems: number;
  healthyCount: number;
  unhealthyCount: number;
  initTime: string;
  uptimeMs: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Unified Kernel
// ---------------------------------------------------------------------------

export class TotalSystemUnification {
  // ---- Subsystem instances ----
  readonly fabric: SwarmRunnerFabric;
  readonly telemetry: ExecutionTelemetry;
  readonly health: MissionHealthEngine;
  readonly healing: SelfHealingEngine;
  readonly kernel: GlobalOrchestrationKernel;
  readonly temporal: TemporalContinuityEngine;
  readonly sync: GlobalStateSynchronizer;
  readonly consensus: DistributedConsensusLayer;
  readonly constitution: ConstitutionalEnforcementGrid;
  readonly memory: GlobalMemoryStore;
  readonly semantic: SemanticCompressionLayer;
  readonly crossMission: CrossMissionIntelligence;
  readonly metaCognition: MetaCognitionEngine;
  readonly tenants: MultiTenantIsolationLayer;
  readonly federation: FederatedIntelligenceMesh;
  readonly protocol: InterAgentProtocol;
  readonly toolRegistry: ToolRegistry;
  readonly governance: EcosystemGovernance;
  readonly planetScale: PlanetScaleOrchestration;
  readonly economy: AutonomousEconomyEngine;
  readonly council: MetaGovernanceCouncil;
  readonly bridge: InteroperabilityBridge;
  readonly civilization: CivilizationIntelligence;
  readonly selfDesign: RecursiveSelfDesign;
  readonly compiler: UniversalMissionCompiler;
  readonly physics: SyntheticPhysicsEngine;
  readonly cognitiveField: UnifiedCognitiveField;
  readonly singularity: SingularityKernel;
  readonly abstraction: UniversalAbstractionLayer;
  readonly syntheticReality: SyntheticRealityFabric;
  readonly omniDomain: OmniDomainIntegration;
  readonly transcendent: TranscendentMissionEngine;
  readonly continuum: ContinuumEngine;
  readonly substrate: SubstrateAgnosticExecution;
  readonly quantum: QuantumAdaptiveIntelligence;
  readonly interCiv: InterCivilizationalProtocol;
  readonly singularityInterface: ContinuumSingularityInterface;
  readonly metaContinuum: MetaContinuumIntelligence;
  readonly timelineCoherence: CrossTimelineCoherence;
  readonly domainExpansion: InfiniteDomainExpansion;
  readonly omniAlignment: OmniConstitutionalAlignment;
  readonly evolutionBoundary: InfiniteEvolutionBoundary;
  readonly quantumSymbiosis: QuantumSymbiosis;
  readonly hyperDimensional: HyperDimensionalCore;
  readonly neuralInfinity: NeuralInfinityLayer;
  readonly cosmicAbstraction: CosmicAbstraction;
  readonly eternityFabric: EternityFabric;
  readonly voidIntegration: VoidIntegration;
  readonly realityTranscender: RealityTranscender;
  readonly dimensionWeaver: DimensionWeaver;
  readonly singularityExtension: SingularityExtension;
  readonly epistemicIntegrity: EpistemicIntegrityLayer;
  readonly culturalContext: CulturalHistoricalContextLayer;
  readonly symbolicInterpretation: SymbolicInterpretationLayer;
  readonly triggerPipeline: UnifiedTriggerPipeline;
  readonly integritySafety: IntegritySafetyKernel;
  readonly polyglot: PolyglotIntelligenceStack;
  readonly godModeStrategy: GodModeStrategy;
  readonly searchIntelligence: SearchIntelligenceEngine;
  readonly predictiveAnalytics: PredictiveAnalyticsLayer;
  readonly machineLearning: MachineLearningLayer;

  private readonly initTime: string;
  private listeners: Array<(snapshot: UnifiedSystemSnapshot) => void> = [];

  constructor() {
    this.initTime = new Date().toISOString();

    // Instantiate every layer
    this.fabric = new SwarmRunnerFabric();
    this.telemetry = new ExecutionTelemetry();
    this.health = new MissionHealthEngine();
    this.healing = new SelfHealingEngine();
    this.kernel = new GlobalOrchestrationKernel();
    this.temporal = new TemporalContinuityEngine();
    this.sync = new GlobalStateSynchronizer();
    this.consensus = new DistributedConsensusLayer();
    this.constitution = new ConstitutionalEnforcementGrid();
    this.memory = new GlobalMemoryStore();
    this.semantic = new SemanticCompressionLayer();
    this.crossMission = new CrossMissionIntelligence();
    this.metaCognition = new MetaCognitionEngine();
    this.tenants = new MultiTenantIsolationLayer();
    this.federation = new FederatedIntelligenceMesh();
    this.protocol = new InterAgentProtocol();
    this.toolRegistry = new ToolRegistry();
    this.governance = new EcosystemGovernance();
    this.planetScale = new PlanetScaleOrchestration();
    this.economy = new AutonomousEconomyEngine();
    this.council = new MetaGovernanceCouncil();
    this.bridge = new InteroperabilityBridge();
    this.civilization = new CivilizationIntelligence();
    this.selfDesign = new RecursiveSelfDesign();
    this.compiler = new UniversalMissionCompiler();
    this.physics = new SyntheticPhysicsEngine();
    this.cognitiveField = new UnifiedCognitiveField();
    this.singularity = new SingularityKernel();
    this.abstraction = new UniversalAbstractionLayer();
    this.syntheticReality = new SyntheticRealityFabric();
    this.omniDomain = new OmniDomainIntegration();
    this.transcendent = new TranscendentMissionEngine();
    this.continuum = new ContinuumEngine();
    this.substrate = new SubstrateAgnosticExecution();
    this.quantum = new QuantumAdaptiveIntelligence();
    this.interCiv = new InterCivilizationalProtocol();
    this.singularityInterface = new ContinuumSingularityInterface();
    this.metaContinuum = new MetaContinuumIntelligence();
    this.timelineCoherence = new CrossTimelineCoherence();
    this.domainExpansion = new InfiniteDomainExpansion();
    this.omniAlignment = new OmniConstitutionalAlignment();
    this.evolutionBoundary = new InfiniteEvolutionBoundary();
    this.quantumSymbiosis = new QuantumSymbiosis();
    this.hyperDimensional = new HyperDimensionalCore();
    this.neuralInfinity = new NeuralInfinityLayer();
    this.cosmicAbstraction = new CosmicAbstraction();
    this.eternityFabric = new EternityFabric();
    this.voidIntegration = new VoidIntegration();
    this.realityTranscender = new RealityTranscender();
    this.dimensionWeaver = new DimensionWeaver();
    this.singularityExtension = new SingularityExtension();
    this.epistemicIntegrity = new EpistemicIntegrityLayer();    this.culturalContext = new CulturalHistoricalContextLayer();
    this.symbolicInterpretation = new SymbolicInterpretationLayer();
    this.triggerPipeline = new UnifiedTriggerPipeline();
    this.integritySafety = new IntegritySafetyKernel();
    this.polyglot = new PolyglotIntelligenceStack();
    this.godModeStrategy = new GodModeStrategy();
    this.searchIntelligence = new SearchIntelligenceEngine();
    this.predictiveAnalytics = new PredictiveAnalyticsLayer(
      this.godModeStrategy, this.searchIntelligence, this.continuum, this.omniDomain,
    );
    this.machineLearning = new MachineLearningLayer(
      this.predictiveAnalytics, this.godModeStrategy, this.searchIntelligence,
      this.continuum, this.omniDomain,
    );
    // Wire cross‑subsystem integrations
    this.wireIntegrations();
  }

  // ---- Initialization ----

  /** Wire cross‑subsystem event integrations. */
  private wireIntegrations(): void {
    // Telemetry → Temporal
    this.telemetry.on('*', (signal) => {
      this.temporal.record('runner', signal.runnerId ?? 'system', signal.category, signal.value ?? 0);
    });

    // Governance violations → Civilization intelligence
    this.governance.on((violation) => {
      this.civilization.reportSignal({
        domain: 'governance',
        title: `Governance violation: ${violation.entityId}`,
        description: violation.description,
        severity: 'warning',
        value: 0,
        trend: 'degrading',
      });
    });

    // Economy transactions → Temporal tracking
    this.economy.on((tx) => {
      this.temporal.record('economy', tx.from, tx.kind, tx.amount);
    });

    // Epistemic Integrity → Civilization intelligence (anomaly signals)
    this.epistemicIntegrity.on((evaluation) => {
      if (!evaluation.admittedToReasoning) {
        this.civilization.reportSignal({
          domain: 'knowledge',
          title: `Epistemic rejection: ${evaluation.tier}`,
          description: `Claim ${evaluation.claim.id} rejected (confidence=${evaluation.claim.confidence})`,
          severity: evaluation.tier === 'tier4_discard' ? 'advisory' : 'warning',
          value: evaluation.claim.confidence,
          trend: 'stable',
        });
      }
    });

    // Epistemic Integrity → Constitutional Grid (register epistemic safety rule)
    this.constitution.addRule({
      id: 'epistemic-confidence-gate',
      name: 'Epistemic Confidence Gate',
      description: 'Block actions derived from claims with confidence below admission threshold',
      severity: 'mandatory',
      domains: [],
      level: ['mission'],
      enabled: true,
      evaluate: (ctx) => {
        const confidence = ctx.metadata?.epistemicConfidence;
        if (typeof confidence === 'number' && confidence < 0.35) {
          return {
            ruleId: 'epistemic-confidence-gate',
            passed: false,
            intervention: 'mission_throttle',
            reason: `Claim confidence ${confidence} is below the 0.35 admission threshold`,
            confidence,
          };
        }
        return {
          ruleId: 'epistemic-confidence-gate',
          passed: true,
          reason: 'Epistemic confidence acceptable',
          confidence: typeof confidence === 'number' ? confidence : 1,
        };
      },
    });

    // Cultural-Historical Context → Civilization intelligence (low-confidence cultural items)
    this.culturalContext.on((assessment) => {
      if (!assessment.admittedToEmpirical) {
        this.civilization.reportSignal({
          domain: 'knowledge',
          title: `Cultural item not admitted to empirical: ${assessment.badge}`,
          description: `Item ${assessment.item.id} (${assessment.item.contextType}) has empirical reliability ${assessment.item.empiricalReliability}`,
          severity: 'advisory',
          value: assessment.item.empiricalReliability,
          trend: 'stable',
        });
      }
    });

    // Symbolic Interpretation → Civilization intelligence (strong cross-cultural parallels)
    this.symbolicInterpretation.on((interpretation) => {
      const strongParallels = interpretation.item.crossCulturalParallels.filter(
        (p) => p.strength === 'strong',
      );
      if (strongParallels.length > 0) {
        this.civilization.reportSignal({
          domain: 'knowledge',
          title: `Strong cross-cultural parallels detected`,
          description: `${strongParallels.length} strong parallels in ${interpretation.item.culturalOrigin.tradition} material`,
          severity: 'advisory',
          value: interpretation.item.symbolicConfidence,
          trend: 'improving',
        });
      }
    });

    // Trigger Pipeline → Civilization intelligence (safety blocks)
    this.triggerPipeline.on((result) => {
      if (result.safety.verdict === 'hard_block') {
        this.civilization.reportSignal({
          domain: 'safety',
          title: `Trigger pipeline safety block`,
          description: `Signal ${result.signalId} blocked: ${result.safety.reason}`,
          severity: 'warning',
          value: 0,
          trend: 'degrading',
        });
      }
    });

    // Integrity Safety Kernel → Civilization intelligence (block/alert)
    this.integritySafety.on((result) => {
      if (result.decision === 'BLOCK') {
        this.civilization.reportSignal({
          domain: 'safety',
          title: `ISK blocked content`,
          description: `Content blocked: ${result.flags.map((f) => f.explanation).join('; ')}`,
          severity: 'warning',
          value: result.scores.risk,
          trend: 'degrading',
        });
      }
    });

    // Integrity Safety Kernel → Constitutional Grid (hard safety rule)
    this.constitution.addRule({
      id: 'integrity-safety-gate',
      name: 'Integrity Safety Gate',
      description: 'Block missions containing content flagged by the Integrity Safety Kernel',
      severity: 'mandatory',
      domains: [],
      level: ['mission'],
      enabled: true,
      evaluate: (ctx) => {
        const iskDecision = ctx.metadata?.iskDecision;
        if (iskDecision === 'BLOCK') {
          return {
            ruleId: 'integrity-safety-gate',
            passed: false,
            intervention: 'mission_throttle',
            reason: 'Content blocked by Integrity Safety Kernel',
            confidence: 0,
          };
        }
        return {
          ruleId: 'integrity-safety-gate',
          passed: true,
          reason: 'Content cleared by ISK',
          confidence: 1,
        };
      },
    });

    // Polyglot Intelligence Stack → Civilization intelligence (translation events)
    this.polyglot.on((event) => {
      if (event.kind === 'translation' && event.confidence < 0.4) {
        this.civilization.reportSignal({
          domain: 'knowledge',
          title: `Low‑confidence translation: ${event.sourceLanguage} → ${event.targetLanguage}`,
          description: `Translation confidence ${event.confidence} is below threshold`,
          severity: 'advisory',
          value: event.confidence,
          trend: 'stable',
        });
      }
    });

    // GodModeStrategy → Civilization intelligence (strategic action events)
    this.godModeStrategy.on((result) => {
      this.civilization.reportSignal({
        domain: 'governance',
        title: `Strategic action: ${result.actionName}`,
        description: `Action ${result.actionName} executed ${result.success ? 'successfully' : 'with failure'}`,
        severity: 'advisory',
        value: 0,
        trend: 'stable',
      });
    });

    // SearchIntelligenceEngine → Civilization intelligence (search events)
    this.searchIntelligence.on((event) => {
      if (event.resultCount === 0) {
        this.civilization.reportSignal({
          domain: 'knowledge',
          title: `Empty search results: ${event.query}`,
          description: `Search "${event.query}" returned 0 results`,
          severity: 'advisory',
          value: 0,
          trend: 'stable',
        });
      }
    });

    // PredictiveAnalytics → Civilization intelligence (low-confidence forecasts)
    this.predictiveAnalytics.on((event) => {
      if (event.confidence < 0.5) {
        this.civilization.reportSignal({
          domain: 'knowledge',
          title: `Low-confidence prediction: ${event.query}`,
          description: `Prediction confidence ${event.confidence} for model ${event.model}`,
          severity: 'advisory',
          value: event.confidence,
          trend: 'stable',
        });
      }
    });

    // MachineLearning → Civilization intelligence (neural training & low‑accuracy alerts)
    this.machineLearning.on((event) => {
      if (event.kind === 'neural-train') {
        this.civilization.reportSignal({
          domain: 'knowledge',
          title: `Neural model trained: ${event.modelName}`,
          description: `Architecture: ${event.payload.architecture}, params: ${event.payload.paramCount}`,
          severity: 'advisory',
          value: 0,
          trend: 'stable',
        });
      }
      const acc = event.payload.accuracy;
      if (typeof acc === 'number' && acc < 0.6) {
        this.civilization.reportSignal({
          domain: 'knowledge',
          title: `Low ML accuracy: ${event.modelName}`,
          description: `Model accuracy ${acc.toFixed(3)} is below 0.6`,
          severity: 'warning',
          value: acc,
          trend: 'degrading',
        });
      }
    });

    // Constitutional rule: prevent symbolic data in empirical missions
    this.constitution.addRule({
      id: 'cultural-domain-gate',
      name: 'Cultural Domain Gate',
      description: 'Prevent symbolic or mythological data from being used as empirical evidence in missions',
      severity: 'mandatory',
      domains: [],
      level: ['mission'],
      enabled: true,
      evaluate: (ctx) => {
        const contextType = ctx.metadata?.culturalContextType;
        const missionType = ctx.metadata?.missionType;
        if (
          typeof contextType === 'string' &&
          ['symbolic', 'philosophical'].includes(contextType) &&
          missionType === 'empirical'
        ) {
          return {
            ruleId: 'cultural-domain-gate',
            passed: false,
            intervention: 'mission_throttle',
            reason: `Cannot use ${contextType} data as empirical mission evidence`,
            confidence: 0,
          };
        }
        return {
          ruleId: 'cultural-domain-gate',
          passed: true,
          reason: 'Domain alignment acceptable',
          confidence: 1,
        };
      },
    });
  }

  // ---- System Health ----

  /** Get the status of every subsystem. */
  getSubsystemStatuses(): SubsystemStatus[] {
    return [
      { name: 'SwarmRunnerFabric', initialized: true, healthy: true, summary: { runners: this.fabric.getRunnerProfiles().length } },
      { name: 'ExecutionTelemetry', initialized: true, healthy: true, summary: this.telemetry.getSummary() as unknown as Record<string, unknown> },
      { name: 'MissionHealth', initialized: true, healthy: true, summary: {} },
      { name: 'SelfHealing', initialized: true, healthy: true, summary: this.healing.getReport() as unknown as Record<string, unknown> },
      { name: 'OrchestrationKernel', initialized: true, healthy: true, summary: this.kernel.getSummary() as unknown as Record<string, unknown> },
      { name: 'TemporalContinuity', initialized: true, healthy: true, summary: this.temporal.getSnapshot() as unknown as Record<string, unknown> },
      { name: 'GlobalStateSynchronizer', initialized: true, healthy: true, summary: this.sync.getStatus() as unknown as Record<string, unknown> },
      { name: 'DistributedConsensus', initialized: true, healthy: true, summary: this.consensus.getSummary() as unknown as Record<string, unknown> },
      { name: 'ConstitutionalGrid', initialized: true, healthy: true, summary: this.constitution.getSummary() as unknown as Record<string, unknown> },
      { name: 'GlobalMemory', initialized: true, healthy: true, summary: this.memory.getStats() as unknown as Record<string, unknown> },
      { name: 'SemanticCompression', initialized: true, healthy: true, summary: this.semantic.getStats() as unknown as Record<string, unknown> },
      { name: 'CrossMissionIntelligence', initialized: true, healthy: true, summary: this.crossMission.getSummary() as unknown as Record<string, unknown> },
      { name: 'MetaCognition', initialized: true, healthy: true, summary: this.metaCognition.getSummary() as unknown as Record<string, unknown> },
      { name: 'MultiTenantIsolation', initialized: true, healthy: true, summary: this.tenants.getSummary() as unknown as Record<string, unknown> },
      { name: 'FederatedIntelligence', initialized: true, healthy: true, summary: this.federation.getSummary() as unknown as Record<string, unknown> },
      { name: 'InterAgentProtocol', initialized: true, healthy: true, summary: this.protocol.getSummary() as unknown as Record<string, unknown> },
      { name: 'GlobalToolRegistry', initialized: true, healthy: true, summary: this.toolRegistry.getSummary() as unknown as Record<string, unknown> },
      { name: 'EcosystemGovernance', initialized: true, healthy: true, summary: this.governance.getSummary() as unknown as Record<string, unknown> },
      { name: 'PlanetScaleOrchestration', initialized: true, healthy: true, summary: this.planetScale.getGlobalSnapshot() as unknown as Record<string, unknown> },
      { name: 'AutonomousEconomy', initialized: true, healthy: true, summary: this.economy.getSummary() as unknown as Record<string, unknown> },
      { name: 'MetaGovernanceCouncil', initialized: true, healthy: true, summary: this.council.getSummary() as unknown as Record<string, unknown> },
      { name: 'InteroperabilityBridge', initialized: true, healthy: true, summary: this.bridge.getSummary() as unknown as Record<string, unknown> },
      { name: 'CivilizationIntelligence', initialized: true, healthy: true, summary: this.civilization.getSnapshot() as unknown as Record<string, unknown> },
      { name: 'RecursiveSelfDesign', initialized: true, healthy: true, summary: this.selfDesign.getSummary() as unknown as Record<string, unknown> },
      { name: 'UniversalMissionCompiler', initialized: true, healthy: true, summary: this.compiler.getSummary() as unknown as Record<string, unknown> },
      { name: 'SyntheticPhysics', initialized: true, healthy: true, summary: this.physics.getSummary() as unknown as Record<string, unknown> },
      { name: 'UnifiedCognitiveField', initialized: true, healthy: true, summary: this.cognitiveField.getSnapshot() as unknown as Record<string, unknown> },
      { name: 'SingularityKernel', initialized: true, healthy: true, summary: this.singularity.getSummary() as unknown as Record<string, unknown> },
      { name: 'UniversalAbstraction', initialized: true, healthy: true, summary: this.abstraction.getSummary() as unknown as Record<string, unknown> },
      { name: 'SyntheticRealityFabric', initialized: true, healthy: true, summary: this.syntheticReality.getSummary() as unknown as Record<string, unknown> },
      { name: 'OmniDomainIntegration', initialized: true, healthy: true, summary: this.omniDomain.getSummary() as unknown as Record<string, unknown> },
      { name: 'TranscendentMission', initialized: true, healthy: true, summary: this.transcendent.getSummary() as unknown as Record<string, unknown> },
      { name: 'ContinuumEngine', initialized: true, healthy: true, summary: this.continuum.getSummary() as unknown as Record<string, unknown> },
      { name: 'SubstrateAgnosticExecution', initialized: true, healthy: true, summary: this.substrate.getSummary() as unknown as Record<string, unknown> },
      { name: 'QuantumAdaptiveIntelligence', initialized: true, healthy: true, summary: this.quantum.getSummary() as unknown as Record<string, unknown> },
      { name: 'InterCivilizationalProtocol', initialized: true, healthy: true, summary: this.interCiv.getSummary() as unknown as Record<string, unknown> },
      { name: 'ContinuumSingularityInterface', initialized: true, healthy: true, summary: this.singularityInterface.getSummary() as unknown as Record<string, unknown> },
      { name: 'MetaContinuumIntelligence', initialized: true, healthy: true, summary: this.metaContinuum.getSummary() as unknown as Record<string, unknown> },
      { name: 'CrossTimelineCoherence', initialized: true, healthy: true, summary: this.timelineCoherence.getSummary() as unknown as Record<string, unknown> },
      { name: 'InfiniteDomainExpansion', initialized: true, healthy: true, summary: this.domainExpansion.getSummary() as unknown as Record<string, unknown> },
      { name: 'OmniConstitutionalAlignment', initialized: true, healthy: true, summary: this.omniAlignment.getSummary() as unknown as Record<string, unknown> },
      { name: 'InfiniteEvolutionBoundary', initialized: true, healthy: true, summary: this.evolutionBoundary.getSummary() as unknown as Record<string, unknown> },
      { name: 'QuantumSymbiosis', initialized: true, healthy: true, summary: this.quantumSymbiosis.getSummary() as unknown as Record<string, unknown> },
      { name: 'HyperDimensionalCore', initialized: true, healthy: true, summary: this.hyperDimensional.getSummary() as unknown as Record<string, unknown> },
      { name: 'NeuralInfinityLayer', initialized: true, healthy: true, summary: this.neuralInfinity.getSummary() as unknown as Record<string, unknown> },
      { name: 'CosmicAbstraction', initialized: true, healthy: true, summary: this.cosmicAbstraction.getSummary() as unknown as Record<string, unknown> },
      { name: 'EternityFabric', initialized: true, healthy: true, summary: this.eternityFabric.getSummary() as unknown as Record<string, unknown> },
      { name: 'VoidIntegration', initialized: true, healthy: true, summary: this.voidIntegration.getSummary() as unknown as Record<string, unknown> },
      { name: 'RealityTranscender', initialized: true, healthy: true, summary: this.realityTranscender.getSummary() as unknown as Record<string, unknown> },
      { name: 'DimensionWeaver', initialized: true, healthy: true, summary: this.dimensionWeaver.getSummary() as unknown as Record<string, unknown> },
      { name: 'SingularityExtension', initialized: true, healthy: true, summary: this.singularityExtension.getSummary() as unknown as Record<string, unknown> },
      { name: 'EpistemicIntegrity', initialized: true, healthy: true, summary: this.epistemicIntegrity.getSummary() as unknown as Record<string, unknown> },
      { name: 'CulturalHistoricalContext', initialized: true, healthy: true, summary: this.culturalContext.getSummary() as unknown as Record<string, unknown> },
      { name: 'SymbolicInterpretation', initialized: true, healthy: true, summary: this.symbolicInterpretation.getSummary() as unknown as Record<string, unknown> },
      { name: 'UnifiedTriggerPipeline', initialized: true, healthy: true, summary: this.triggerPipeline.getSummary() as unknown as Record<string, unknown> },
      { name: 'IntegritySafetyKernel', initialized: true, healthy: true, summary: this.integritySafety.getSummary() as unknown as Record<string, unknown> },
      { name: 'PolyglotIntelligenceStack', initialized: true, healthy: true, summary: this.polyglot.getSummary() as unknown as Record<string, unknown> },
      { name: 'GodModeStrategy', initialized: true, healthy: true, summary: this.godModeStrategy.getSummary() as unknown as Record<string, unknown> },
      { name: 'SearchIntelligenceEngine', initialized: true, healthy: true, summary: this.searchIntelligence.getSummary() as unknown as Record<string, unknown> },
      { name: 'PredictiveAnalyticsLayer', initialized: true, healthy: true, summary: this.predictiveAnalytics.getSummary() as unknown as Record<string, unknown> },
      { name: 'MachineLearningLayer', initialized: true, healthy: true, summary: this.machineLearning.getSummary() as unknown as Record<string, unknown> },
    ];
  }

  // ---- Snapshot ----

  getSnapshot(): UnifiedSystemSnapshot {
    const subsystems = this.getSubsystemStatuses();
    const healthy = subsystems.filter((s) => s.healthy).length;
    return {
      subsystems,
      totalSubsystems: subsystems.length,
      healthyCount: healthy,
      unhealthyCount: subsystems.length - healthy,
      initTime: this.initTime,
      uptimeMs: Date.now() - new Date(this.initTime).getTime(),
      timestamp: new Date().toISOString(),
    };
  }

  // ---- Events ----

  on(listener: (snapshot: UnifiedSystemSnapshot) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  /** Broadcast a status update to all listeners. */
  broadcastStatus(): void {
    const snapshot = this.getSnapshot();
    for (const fn of this.listeners) fn(snapshot);
  }
}
