// ---------------------------------------------------------------------------
// Predictive Analytics Layer (Subsystem #60)
// ---------------------------------------------------------------------------
// Specialized component for forecasting, trend analysis, and probabilistic
// modeling within the AgentArmy OS. Integrates with GodModeStrategy for
// amplified predictions, SearchIntelligenceEngine for data sourcing, and
// ContinuumEngine for temporal projections. Amplified to 10^3 level for
// god-mode foresight.
// ---------------------------------------------------------------------------

import { GodModeStrategy, StrategyMode } from './godModeStrategy';
import { SearchIntelligenceEngine } from './searchIntelligenceEngine';
import { ContinuumEngine } from './continuumEngine';
import { OmniDomainIntegration } from './omniDomainIntegration';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Interface for Predictive State.
 * Tracks forecasts, trends, and probability distributions.
 */
interface PredictiveState {
  timestamp: number;
  forecasts: Map<string, { value: number; confidence: number }>;
  trends: Array<{ name: string; dataPoints: number[] }>;
  probabilities: Map<string, number>;
  entropy: number;
  amplificationFactor: number;
}

/**
 * Enum for Predictive Models.
 * Defines the analytics model used for a given analysis run.
 */
export enum PredictiveModel {
  TrendForecasting = 'trend-forecasting',
  ProbabilisticSimulation = 'probabilistic-simulation',
  StrategicForesight = 'strategic-foresight',
  TemporalProjection = 'temporal-projection',
  IntelligenceDriven = 'intelligence-driven',
}

/**
 * Event emitted after each analysis run.
 */
export interface PredictiveEvent {
  kind: 'forecast' | 'simulation' | 'projection';
  model: PredictiveModel;
  query: string;
  confidence: number;
}

/**
 * Summary for TSU subsystem status.
 */
export interface PredictiveAnalyticsSummary {
  model: string;
  amplificationFactor: number;
  forecastCount: number;
  trendCount: number;
  probabilityCount: number;
  entropy: number;
  historyDepth: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map PredictiveModel → event kind label. */
function eventKindForModel(model: PredictiveModel): 'forecast' | 'simulation' | 'projection' {
  if (model === PredictiveModel.ProbabilisticSimulation) return 'simulation';
  if (model === PredictiveModel.TemporalProjection) return 'projection';
  return 'forecast';
}

// ---------------------------------------------------------------------------
// PredictiveAnalyticsLayer
// ---------------------------------------------------------------------------

export class PredictiveAnalyticsLayer {
  private readonly strategy: GodModeStrategy;
  private readonly searchEngine: SearchIntelligenceEngine;
  private readonly continuum: ContinuumEngine;
  private readonly integration: OmniDomainIntegration;
  private currentState: PredictiveState;
  private stateHistory: PredictiveState[];
  private model: PredictiveModel;
  private listeners: Array<(event: PredictiveEvent) => void> = [];

  constructor(
    strategy: GodModeStrategy,
    searchEngine: SearchIntelligenceEngine,
    continuum: ContinuumEngine,
    integration: OmniDomainIntegration,
  ) {
    this.strategy = strategy;
    this.searchEngine = searchEngine;
    this.continuum = continuum;
    this.integration = integration;
    this.currentState = this.initializeState();
    this.stateHistory = [this.currentState];
    this.model = PredictiveModel.TrendForecasting;
    this.amplifyLayer();
  }

  // ---- Initialization ----

  private initializeState(): PredictiveState {
    return {
      timestamp: Date.now(),
      forecasts: new Map([['defaultTrend', { value: 100, confidence: 0.9 }]]),
      trends: [{ name: 'baseTrend', dataPoints: new Array(10).fill(50) }],
      probabilities: new Map([['eventSuccess', 0.75]]),
      entropy: 0,
      amplificationFactor: 1000,
    };
  }

  /** Scale forecasts and trends by the amplification factor. */
  private amplifyLayer(): void {
    this.currentState.forecasts.forEach((val, key) => {
      this.currentState.forecasts.set(key, {
        value: val.value * 1000,
        confidence: val.confidence,
      });
    });
    this.currentState.trends.forEach((trend) => {
      trend.dataPoints = trend.dataPoints.map((dp) => dp * 1000);
    });
  }

  // ---- Model management ----

  /** Set the predictive model, aligning dependent layers. */
  public setModel(model: PredictiveModel): void {
    this.model = model;
    if (model === PredictiveModel.StrategicForesight) {
      this.strategy.setMode(StrategyMode.AIPredictive);
    }
  }

  // ---- Analysis execution ----

  /**
   * Run a predictive analysis.
   * @param query - The analytics query (e.g., "forecast empire growth").
   * @param dataInput - Optional external data feed.
   */
  public runAnalysis(query: string, dataInput?: unknown): void {
    let externalData = dataInput;

    // Fetch intelligence data if model requires it
    if (this.model === PredictiveModel.IntelligenceDriven) {
      const response = this.searchEngine.search({
        text: query,
        queryFreshnessNeed: 0.5,
        userTopicHistory: [],
        preferredDomains: [],
        languagePreference: 'en',
        maxResults: 5,
      });
      externalData = response.results;
    }

    const newState: PredictiveState = {
      ...this.currentState,
      timestamp: Date.now(),
      forecasts: new Map(this.currentState.forecasts),
      probabilities: new Map(this.currentState.probabilities),
      trends: this.currentState.trends.map((t) => ({ ...t, dataPoints: [...t.dataPoints] })),
    };

    const confidence = this.runModel(query, newState, externalData);

    // Register a predictive domain in omni-domain integration
    this.enrichOmniDomain(query);

    this.currentState = newState;
    this.stateHistory.push(newState);

    // Emit event
    this.emitEvent(query, confidence);
  }

  /** Dispatch to the appropriate model handler. Returns confidence. */
  private runModel(query: string, state: PredictiveState, externalData: unknown): number {
    switch (this.model) {
      case PredictiveModel.TrendForecasting:
        return this.runTrendForecasting(query, state);
      case PredictiveModel.ProbabilisticSimulation:
        return this.runProbabilisticSimulation(query, state);
      case PredictiveModel.StrategicForesight:
        return this.runStrategicForesight(query, state);
      case PredictiveModel.TemporalProjection:
        return this.runTemporalProjection(state);
      case PredictiveModel.IntelligenceDriven:
        return this.runIntelligenceDriven(query, state, externalData);
      default:
        return 0.5;
    }
  }

  private runTrendForecasting(query: string, state: PredictiveState): number {
    state.trends.push({
      name: query,
      dataPoints: Array.from({ length: 10 }, () => Math.random() * 1000),
    });
    return 0.8;
  }

  private runProbabilisticSimulation(query: string, state: PredictiveState): number {
    let total = 0;
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      total += Math.random() * 1000;
    }
    state.probabilities.set(query, total / iterations);
    return 0.7;
  }

  private runStrategicForesight(query: string, state: PredictiveState): number {
    const strategyState = this.strategy.getCurrentState();
    const confidence = this.strategy.calculateVictoryProbability(strategyState);
    state.forecasts.set(query, {
      value: strategyState.resources.get('empireSize') ?? 0,
      confidence,
    });
    return confidence;
  }

  private runTemporalProjection(state: PredictiveState): number {
    const continuumSummary = this.continuum.getSummary();
    state.entropy = continuumSummary.totalEpochs * 1000;
    return 0.75;
  }

  private runIntelligenceDriven(
    query: string,
    state: PredictiveState,
    externalData: unknown,
  ): number {
    const dataLength = Array.isArray(externalData) ? externalData.length : 0;
    state.forecasts.set(query, { value: dataLength * 1000, confidence: 0.85 });
    return 0.85;
  }

  /** Register a predictive-analytics domain in OmniDomainIntegration. */
  private enrichOmniDomain(query: string): void {
    const onlineDomains = this.integration.getOnlineDomains();
    const alreadyRegistered = onlineDomains.some((d) => d.name === 'predictive-analytics');
    if (!alreadyRegistered) {
      this.integration.registerDomain(
        'conceptual',
        'predictive-analytics',
        `Predictive analytics for "${query}"`,
        ['trend-forecasting', 'probabilistic-simulation', 'strategic-foresight', 'temporal-projection'],
      );
    }
  }

  /** Emit a predictive event to registered listeners. */
  private emitEvent(query: string, confidence: number): void {
    const event: PredictiveEvent = {
      kind: eventKindForModel(this.model),
      model: this.model,
      query,
      confidence,
    };
    this.listeners.forEach((fn) => fn(event));
  }

  // ---- State access ----

  /** Retrieve the current predictive state (shallow copy). */
  public getCurrentState(): PredictiveState {
    return { ...this.currentState };
  }

  // ---- Lifecycle ----

  /** Reset the layer to initial state. */
  public reset(): void {
    this.currentState = this.initializeState();
    this.stateHistory = [this.currentState];
    this.amplifyLayer();
  }

  // ---- Intelligence propagation ----

  /**
   * Propagate predictions to the strategy and search layers.
   * @param eventType - Type of predictive event.
   * @param payload - Forecast payload.
   */
  public propagatePrediction(_eventType: string, _payload: unknown): void {
    this.strategy.executeAction('updateForecast', {
      predictiveData: Array.from(this.currentState.forecasts.entries()),
    });
  }

  // ---- Events ----

  /** Register a listener for predictive events. */
  public on(listener: (event: PredictiveEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ---- Summary ----

  /** Get summary for TSU subsystem status. */
  public getSummary(): PredictiveAnalyticsSummary {
    return {
      model: this.model,
      amplificationFactor: this.currentState.amplificationFactor,
      forecastCount: this.currentState.forecasts.size,
      trendCount: this.currentState.trends.length,
      probabilityCount: this.currentState.probabilities.size,
      entropy: this.currentState.entropy,
      historyDepth: this.stateHistory.length,
    };
  }
}
