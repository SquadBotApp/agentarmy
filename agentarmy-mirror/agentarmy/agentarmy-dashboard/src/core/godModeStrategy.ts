// ---------------------------------------------------------------------------
// God Mode Strategy Layer (Subsystem #58)
// ---------------------------------------------------------------------------
// Strategic planning and amplification engine for the AgentArmy OS.
// Provides strategy modes, victory probability calculations, resource
// tracking, and action execution for god-mode operations across all
// subsystems. Referenced by SearchIntelligenceEngine and
// PredictiveAnalyticsLayer for amplified decision-making.
// ---------------------------------------------------------------------------

/**
 * Enum for Strategy Modes.
 * Defines operational postures that influence probability calculations
 * and resource allocation across the system.
 */
export enum StrategyMode {
  Defensive = 'defensive',
  Offensive = 'offensive',
  Balanced = 'balanced',
  AIPredictive = 'ai-predictive',
  Expansion = 'expansion',
  Stealth = 'stealth',
}

/**
 * Interface for Strategy State.
 * Tracks the full strategic context including resources, objectives,
 * and the computed victory probability.
 */
export interface StrategyState {
  mode: StrategyMode;
  timestamp: number;
  resources: Map<string, number>;
  amplificationFactor: number;
  objectives: Array<{ id: string; description: string; priority: number; progress: number }>;
  victoryProbability: number;
}

/**
 * Interface for Action Result.
 * Returned every time a strategic action is executed.
 */
export interface ActionResult {
  actionName: string;
  success: boolean;
  timestamp: number;
  payload: Record<string, unknown>;
}

/**
 * Summary for TSU subsystem status reporting.
 */
export interface GodModeStrategySummary {
  mode: string;
  amplificationFactor: number;
  resourceCount: number;
  objectiveCount: number;
  victoryProbability: number;
  actionsExecuted: number;
}

// ---------------------------------------------------------------------------
// Mode → base victory factor lookup
// ---------------------------------------------------------------------------
const MODE_FACTORS: Record<string, number> = {
  [StrategyMode.Defensive]: 0.6,
  [StrategyMode.Offensive]: 0.8,
  [StrategyMode.Balanced]: 0.75,
  [StrategyMode.AIPredictive]: 0.9,
  [StrategyMode.Expansion]: 0.7,
  [StrategyMode.Stealth]: 0.65,
};

// ---------------------------------------------------------------------------
// GodModeStrategy
// ---------------------------------------------------------------------------

export class GodModeStrategy {
  private currentState: StrategyState;
  private stateHistory: StrategyState[];
  private actionLog: ActionResult[];
  private listeners: Array<(result: ActionResult) => void> = [];

  constructor() {
    // Delegate to reset() to avoid duplicate implementation
    this.currentState = this.initializeState();
    this.stateHistory = [];
    this.actionLog = [];
    this.reset();
  }

  // ---- Initialization ----

  private initializeState(): StrategyState {
    const resources = new Map<string, number>();
    resources.set('empireSize', 1000);
    resources.set('agentCount', 100);
    resources.set('knowledgeBase', 500);
    resources.set('computeCapacity', 750);
    resources.set('networkReach', 300);

    return {
      mode: StrategyMode.Balanced,
      timestamp: Date.now(),
      resources,
      amplificationFactor: 1000,
      objectives: [
        { id: 'obj-001', description: 'Maximize intelligence coverage', priority: 1, progress: 0 },
        { id: 'obj-002', description: 'Optimize resource allocation', priority: 2, progress: 0 },
        { id: 'obj-003', description: 'Expand domain reach', priority: 3, progress: 0 },
      ],
      victoryProbability: 0.75,
    };
  }

  // ---- Mode management ----

  /** Set the strategy mode and recalculate base probability. */
  public setMode(mode: StrategyMode): void {
    this.currentState.mode = mode;
    this.currentState.timestamp = Date.now();
    this.currentState.victoryProbability = MODE_FACTORS[mode] ?? 0.75;
    this.stateHistory.push({
      ...this.currentState,
      resources: new Map(this.currentState.resources),
    });
  }

  // ---- Probability calculations ----

  /** Calculate victory probability for the given state snapshot. */
  public calculateVictoryProbability(state: StrategyState): number {
    let totalResources = 0;
    state.resources.forEach((value) => { totalResources += value; });
    const resourceFactor = Math.min(totalResources / 5000, 1);

    const objectiveProgress = state.objectives.length > 0
      ? state.objectives.reduce((sum, o) => sum + o.progress, 0) / state.objectives.length
      : 0;

    const base = state.victoryProbability;
    return Math.min(base * 0.5 + resourceFactor * 0.3 + objectiveProgress * 0.2, 1);
  }

  // ---- State access ----

  /** Returns a shallow copy of the current strategy state. */
  public getCurrentState(): StrategyState {
    return { ...this.currentState, resources: new Map(this.currentState.resources) };
  }

  // ---- Action execution ----

  /** Execute a named strategic action. */
  public executeAction(actionName: string, payload: Record<string, unknown>): ActionResult {
    const result: ActionResult = {
      actionName,
      success: true,
      timestamp: Date.now(),
      payload,
    };

    this.processAction(actionName);
    this.actionLog.push(result);
    this.listeners.forEach((fn) => fn(result));
    return result;
  }

  /** Internal action processor — keeps executeAction cognitive complexity low. */
  private processAction(actionName: string): void {
    switch (actionName) {
      case 'integrateIntel':
        this.currentState.resources.set(
          'knowledgeBase',
          (this.currentState.resources.get('knowledgeBase') ?? 0) + 10,
        );
        break;
      case 'updateForecast':
        this.currentState.victoryProbability = Math.min(
          this.currentState.victoryProbability + 0.01,
          1,
        );
        break;
      case 'expandDomain':
        this.currentState.resources.set(
          'networkReach',
          (this.currentState.resources.get('networkReach') ?? 0) + 50,
        );
        break;
      default:
        break;
    }
  }

  // ---- Resource & objective management ----

  /** Update a single resource value. */
  public setResource(key: string, value: number): void {
    this.currentState.resources.set(key, value);
  }

  /** Update objective progress (clamped 0–1). Returns false if id not found. */
  public updateObjective(objectiveId: string, progress: number): boolean {
    const obj = this.currentState.objectives.find((o) => o.id === objectiveId);
    if (!obj) return false;
    obj.progress = Math.min(Math.max(progress, 0), 1);
    return true;
  }

  // ---- Events ----

  /** Register a listener for action execution events. */
  public on(listener: (result: ActionResult) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ---- Lifecycle ----

  /** Reset the strategy layer to initial state, clearing all history. */
  public reset(): void {
    this.currentState = this.initializeState();
    this.stateHistory = [this.currentState];
    this.actionLog = [];
    this.listeners = [];
  }

  // ---- Summary ----

  /** Get summary for TSU subsystem status. */
  public getSummary(): GodModeStrategySummary {
    return {
      mode: this.currentState.mode,
      amplificationFactor: this.currentState.amplificationFactor,
      resourceCount: this.currentState.resources.size,
      objectiveCount: this.currentState.objectives.length,
      victoryProbability: this.calculateVictoryProbability(this.currentState),
      actionsExecuted: this.actionLog.length,
    };
  }
}
