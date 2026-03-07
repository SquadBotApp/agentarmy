/**
 * Unified Agent State Model
 * Central state for the honeycomb cognitive map visualization
 */

import { create } from 'zustand';

// ============================================
// Types
// ============================================

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'evaluating' | 'complete' | 'error';
export type ModuleType = 'planner' | 'executor' | 'critic' | 'governor' | 'memory' | 'learning' | 'tools';
export type BackgroundMode = 'subtle' | 'high-energy';

export interface ZPEComponents {
  usefulness: number;
  coherence: number;
  cost: number;
  risk: number;
  alignment: number;
}

export interface ZPEScore {
  total: number;
  components: ZPEComponents;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  duration: number;
  dependsOn: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  isCritical?: boolean;
}

export interface CPMTimeline {
  projectDuration: number;
  criticalPath: string[];
  tasks: Task[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: unknown;
  timestamp: string;
}

export interface Evaluation {
  qualityScore: number;
  alignmentScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  notes: string;
}

export interface PolicyCheck {
  passed: boolean;
  rule: string;
  action: 'allow' | 'warn' | 'block';
  reason?: string;
}

export interface MemoryItem {
  id: string;
  type: 'decision' | 'job' | 'weight';
  content: string;
  relevance: number;
  timestamp: string;
}

export interface LearningUpdate {
  type: 'agent_weight' | 'zpe_weight' | 'duration';
  agentId?: string;
  oldValue: number;
  newValue: number;
  reason: string;
  timestamp: string;
}

// Module States
export interface PlannerState {
  active: boolean;
  taskGraph: Task[];
  cpmTimeline: CPMTimeline | null;
  thinking: string;
}

export interface ExecutorState {
  active: boolean;
  output: string;
  artifacts: string[];
  toolCalls: ToolCall[];
  thinking: string;
}

export interface CriticState {
  active: boolean;
  evaluation: Evaluation | null;
  feedback: string;
  thinking: string;
}

export interface GovernorState {
  active: boolean;
  policyChecks: PolicyCheck[];
  overridden: boolean;
  thinking: string;
}

export interface MemoryState {
  active: boolean;
  retrieved: MemoryItem[];
  agentWeights: Record<string, number>;
  thinking: string;
}

export interface LearningState {
  active: boolean;
  updates: LearningUpdate[];
  zpeWeights: ZPEComponents;
  thinking: string;
}

export interface ToolsState {
  active: boolean;
  available: string[];
  selected: string | null;
  logs: ToolCall[];
  thinking: string;
}

// Core Agent State
export interface AgentCoreState {
  input: string;
  currentTask: Task | null;
  selectedAgent: ModuleType | null;
  zpe: ZPEScore;
  rationale: string;
  output: string;
  status: AgentStatus;
  jobId: string | null;
  error: string | null;
}

// Connection State (for visualization)
export interface ConnectionState {
  activePath: ModuleType[];
  pulseIntensity: Record<ModuleType, number>;
  flowDirection: 'forward' | 'backward' | 'bidirectional';
}

// Full Store State
export interface UnifiedAgentState {
  core: AgentCoreState;
  planner: PlannerState;
  executor: ExecutorState;
  critic: CriticState;
  governor: GovernorState;
  memory: MemoryState;
  learning: LearningState;
  tools: ToolsState;
  connections: ConnectionState;
  backgroundMode: BackgroundMode;
  
  // Actions
  setInput: (input: string) => void;
  setStatus: (status: AgentStatus) => void;
  setCurrentTask: (task: Task | null) => void;
  setSelectedAgent: (agent: ModuleType | null) => void;
  setZPE: (zpe: ZPEScore) => void;
  setRationale: (rationale: string) => void;
  setOutput: (output: string) => void;
  setJobId: (jobId: string | null) => void;
  setError: (error: string | null) => void;
  
  // Module actions
  updatePlanner: (update: Partial<PlannerState>) => void;
  updateExecutor: (update: Partial<ExecutorState>) => void;
  updateCritic: (update: Partial<CriticState>) => void;
  updateGovernor: (update: Partial<GovernorState>) => void;
  updateMemory: (update: Partial<MemoryState>) => void;
  updateLearning: (update: Partial<LearningState>) => void;
  updateTools: (update: Partial<ToolsState>) => void;
  
  // Connection actions
  setActivePath: (path: ModuleType[]) => void;
  setPulseIntensity: (module: ModuleType, intensity: number) => void;
  
  // Orchestration integration
  submitTask: (task: string) => Promise<void>;
  reset: () => void;
  
  // Background mode
  setBackgroundMode: (mode: BackgroundMode) => void;
}

// ============================================
// Initial States
// ============================================

const initialZPE: ZPEScore = {
  total: 0,
  components: {
    usefulness: 0,
    coherence: 0,
    cost: 0,
    risk: 0,
    alignment: 0,
  },
};

const initialCore: AgentCoreState = {
  input: '',
  currentTask: null,
  selectedAgent: null,
  zpe: initialZPE,
  rationale: '',
  output: '',
  status: 'idle',
  jobId: null,
  error: null,
};

const initialPlanner: PlannerState = {
  active: false,
  taskGraph: [],
  cpmTimeline: null,
  thinking: '',
};

const initialExecutor: ExecutorState = {
  active: false,
  output: '',
  artifacts: [],
  toolCalls: [],
  thinking: '',
};

const initialCritic: CriticState = {
  active: false,
  evaluation: null,
  feedback: '',
  thinking: '',
};

const initialGovernor: GovernorState = {
  active: false,
  policyChecks: [],
  overridden: false,
  thinking: '',
};

const initialMemory: MemoryState = {
  active: false,
  retrieved: [],
  agentWeights: {},
  thinking: '',
};

const initialLearning: LearningState = {
  active: false,
  updates: [],
  zpeWeights: {
    usefulness: 0.3,
    coherence: 0.2,
    cost: 0.2,
    risk: 0.15,
    alignment: 0.15,
  },
  thinking: '',
};

const initialTools: ToolsState = {
  active: false,
  available: [],
  selected: null,
  logs: [],
  thinking: '',
};

const initialConnections: ConnectionState = {
  activePath: [],
  pulseIntensity: {
    planner: 0,
    executor: 0,
    critic: 0,
    governor: 0,
    memory: 0,
    learning: 0,
    tools: 0,
  },
  flowDirection: 'forward',
};

// ============================================
// Store
// ============================================

export const useUnifiedAgentStore = create<UnifiedAgentState>((set, get) => ({
  core: initialCore,
  planner: initialPlanner,
  executor: initialExecutor,
  critic: initialCritic,
  governor: initialGovernor,
  memory: initialMemory,
  learning: initialLearning,
  tools: initialTools,
  connections: initialConnections,
  backgroundMode: 'subtle' as BackgroundMode,

  // Core actions
  setInput: (input) => set((state) => ({ core: { ...state.core, input } })),
  setStatus: (status) => set((state) => ({ core: { ...state.core, status } })),
  setCurrentTask: (currentTask) => set((state) => ({ core: { ...state.core, currentTask } })),
  setSelectedAgent: (selectedAgent) => set((state) => ({ core: { ...state.core, selectedAgent } })),
  setZPE: (zpe) => set((state) => ({ core: { ...state.core, zpe } })),
  setRationale: (rationale) => set((state) => ({ core: { ...state.core, rationale } })),
  setOutput: (output) => set((state) => ({ core: { ...state.core, output } })),
  setJobId: (jobId) => set((state) => ({ core: { ...state.core, jobId } })),
  setError: (error) => set((state) => ({ core: { ...state.core, error } })),

  // Module actions
  updatePlanner: (update) => set((state) => ({ planner: { ...state.planner, ...update } })),
  updateExecutor: (update) => set((state) => ({ executor: { ...state.executor, ...update } })),
  updateCritic: (update) => set((state) => ({ critic: { ...state.critic, ...update } })),
  updateGovernor: (update) => set((state) => ({ governor: { ...state.governor, ...update } })),
  updateMemory: (update) => set((state) => ({ memory: { ...state.memory, ...update } })),
  updateLearning: (update) => set((state) => ({ learning: { ...state.learning, ...update } })),
  updateTools: (update) => set((state) => ({ tools: { ...state.tools, ...update } })),

  // Connection actions
  setActivePath: (activePath) => set((state) => ({
    connections: { ...state.connections, activePath },
  })),
  setPulseIntensity: (module, intensity) => set((state) => ({
    connections: {
      ...state.connections,
      pulseIntensity: { ...state.connections.pulseIntensity, [module]: intensity },
    },
  })),

  // Orchestration integration
  submitTask: async (task: string) => {
    const store = get();
    
    // Reset state
    store.reset();
    store.setInput(task);
    store.setStatus('thinking');
    
    // Activate memory module (retrieving context)
    store.updateMemory({ active: true, thinking: 'Retrieving past decisions and learned weights...' });
    store.setActivePath(['memory']);
    store.setPulseIntensity('memory', 1);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Submit to orchestration endpoint
      const response = await fetch('/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ task }),
      });

      if (!response.ok) {
        throw new Error(`Orchestration failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update memory with agent weights
      store.updateMemory({ 
        active: false, 
        thinking: '',
        agentWeights: result.result?.metrics?.agent_weights || {},
      });
      store.setPulseIntensity('memory', 0);

      // Activate planner
      store.updatePlanner({ 
        active: true, 
        thinking: 'Planning task execution...',
      });
      store.setActivePath(['memory', 'planner']);
      store.setPulseIntensity('planner', 1);

      // Parse orchestration decision
      const decision = result.result?.decision || {};
      const zpe = decision.zpe || { total: 0.5, components: {} };
      
      store.setZPE({
        total: zpe.total || 0.5,
        components: {
          usefulness: zpe.components?.usefulness || 0,
          coherence: zpe.components?.coherence || 0,
          cost: zpe.components?.cost || 0,
          risk: zpe.components?.risk || 0,
          alignment: zpe.components?.alignment || 0,
        },
      });
      store.setRationale(decision.rationale || 'Task processed');
      store.setJobId(result.job_id);

      // Deactivate planner, activate executor
      store.updatePlanner({ active: false, thinking: '' });
      store.setPulseIntensity('planner', 0);
      store.setStatus('executing');
      
      store.updateExecutor({ 
        active: true, 
        thinking: 'Generating response...',
        output: decision.rationale || '',
      });
      store.setActivePath(['planner', 'executor']);
      store.setPulseIntensity('executor', 1);

      // Simulate executor completing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Activate critic
      store.updateExecutor({ active: false, thinking: '' });
      store.setPulseIntensity('executor', 0);
      store.setStatus('evaluating');
      
      store.updateCritic({ 
        active: true, 
        thinking: 'Evaluating output quality...',
        evaluation: result.result?.evaluation ? {
          qualityScore: result.result.evaluation.quality_score || 1,
          alignmentScore: 1,
          riskLevel: 'low',
          notes: result.result.evaluation.notes || '',
        } : null,
      });
      store.setActivePath(['executor', 'critic']);
      store.setPulseIntensity('critic', 1);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Activate governor
      store.updateCritic({ active: false, thinking: '' });
      store.setPulseIntensity('critic', 0);
      
      store.updateGovernor({ 
        active: true, 
        thinking: 'Checking safety policies...',
        policyChecks: [{ passed: true, rule: 'safety', action: 'allow' }],
      });
      store.setActivePath(['critic', 'governor']);
      store.setPulseIntensity('governor', 1);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Activate learning
      store.updateGovernor({ active: false, thinking: '' });
      store.setPulseIntensity('governor', 0);
      
      store.updateLearning({ 
        active: true, 
        thinking: 'Recording performance metrics...',
      });
      store.setActivePath(['governor', 'learning']);
      store.setPulseIntensity('learning', 1);

      await new Promise(resolve => setTimeout(resolve, 200));

      // Complete
      store.updateLearning({ active: false, thinking: '' });
      store.setPulseIntensity('learning', 0);
      store.setActivePath([]);
      
      store.setOutput(decision.rationale || 'Task completed successfully.');
      store.setStatus('complete');

    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Unknown error');
      store.setStatus('error');
      store.setActivePath([]);
      
      // Reset all modules
      store.updatePlanner({ active: false, thinking: '' });
      store.updateExecutor({ active: false, thinking: '' });
      store.updateCritic({ active: false, thinking: '' });
      store.updateGovernor({ active: false, thinking: '' });
      store.updateMemory({ active: false, thinking: '' });
      store.updateLearning({ active: false, thinking: '' });
      store.updateTools({ active: false, thinking: '' });
    }
  },

  reset: () => set((state) => ({
    core: initialCore,
    planner: initialPlanner,
    executor: initialExecutor,
    critic: initialCritic,
    governor: initialGovernor,
    memory: initialMemory,
    learning: initialLearning,
    tools: initialTools,
    connections: initialConnections,
    backgroundMode: state.backgroundMode, // Preserve background mode
  })),
  
  // Background mode
  setBackgroundMode: (mode) => set({ backgroundMode: mode }),
}));
