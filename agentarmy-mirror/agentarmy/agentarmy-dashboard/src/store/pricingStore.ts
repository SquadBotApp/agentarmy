/**
 * Pricing Store - Qubit Economy System
 * Transparent, defensible monetization with internal currency
 * 
 * Qubits are the universal unit for:
 * - Plan tiers (Scout → Operator → Commander → Strategist)
 * - Add-ons (Tool Arsenal, Parallelism Boost, Memory+, Visual Intelligence)
 * - Boosts (temporary upgrades)
 * - Rewards (milestone achievements)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export type PlanTier = 'scout' | 'operator' | 'commander' | 'strategist';

export type AddOnId = 
  | 'tool_arsenal' 
  | 'parallelism_boost' 
  | 'memory_expansion' 
  | 'visual_intelligence';

export type BoostId = 
  | 'parallelism_surge' 
  | 'memory_burst' 
  | 'tool_swarm';

export type MilestoneId = 
  | 'tasks_50' 
  | 'tasks_100' 
  | 'tasks_500'
  | 'orchestrations_10' 
  | 'orchestrations_50'
  | 'tools_5_workflow'
  | 'streak_7'
  | 'streak_30'
  | 'first_upgrade'
  | 'addon_bundle';

export interface AddOn {
  id: AddOnId;
  name: string;
  description: string;
  QubitCost: number;
  icon: string;
  features: string[];
}

export interface Boost {
  id: BoostId;
  name: string;
  description: string;
  QubitCost: number;
  duration: string;
  icon: string;
}

export interface Milestone {
  id: MilestoneId;
  name: string;
  description: string;
  QubitReward: number;
  requirement: number;
  icon: string;
  category: 'usage' | 'streak' | 'achievement';
}

export interface TierConfig {
  id: PlanTier;
  name: string;
  QubitCost: number;
  description: string;
  features: string[];
  limits: {
    tasksPerDay: number;
    concurrentAgents: number;
    toolsAvailable: number;
    memoryRetention: string;
  };
}

export interface ActiveBoost {
  id: BoostId;
  expiresAt: number;
}

export interface UsageStats {
  tasksCompleted: number;
  tasksToday: number;
  orchestrationsCompleted: number;
  toolsUsedInWorkflow: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalQubitsEarned: number;
  totalQubitsSpent: number;
}

export interface UpgradeSuggestion {
  type: 'tier' | 'addon' | 'boost';
  id: string;
  reason: string;
  QubitCost: number;
  benefit: string;
  priority: number;
}

// =============================================================================
// CONFIGURATION DATA
// =============================================================================

export const TIERS: Record<PlanTier, TierConfig> = {
  scout: {
    id: 'scout',
    name: 'Scout',
    QubitCost: 0,
    description: 'Free tier - explore the cognitive OS',
    features: [
      'Limited tasks per day',
      'Basic tool access',
      'Single agent execution',
      'Community support',
    ],
    limits: {
      tasksPerDay: 10,
      concurrentAgents: 1,
      toolsAvailable: 5,
      memoryRetention: '24 hours',
    },
  },
  operator: {
    id: 'operator',
    name: 'Operator',
    QubitCost: 25,
    description: 'Full honeycomb access with basic orchestration',
    features: [
      'Unlimited tasks',
      'Full tool orchestration',
      'Priority execution',
      '2 concurrent agents',
      'Email support',
    ],
    limits: {
      tasksPerDay: -1, // unlimited
      concurrentAgents: 2,
      toolsAvailable: 15,
      memoryRetention: '7 days',
    },
  },
  commander: {
    id: 'commander',
    name: 'Commander',
    QubitCost: 60,
    description: 'Multi-agent parallelism and advanced tools',
    features: [
      'Everything in Operator',
      'Multi-agent parallelism',
      'Advanced tools (code, research, APIs)',
      'Team sharing',
      '5 concurrent agents',
      'Priority support',
    ],
    limits: {
      tasksPerDay: -1,
      concurrentAgents: 5,
      toolsAvailable: 30,
      memoryRetention: '30 days',
    },
  },
  strategist: {
    id: 'strategist',
    name: 'Strategist',
    QubitCost: 150,
    description: 'Enterprise-grade with custom tools and SLAs',
    features: [
      'Everything in Commander',
      'Custom tool integration',
      'Governance controls',
      'Audit logs & compliance',
      'Unlimited agents',
      'Dedicated support + SLA',
    ],
    limits: {
      tasksPerDay: -1,
      concurrentAgents: -1, // unlimited
      toolsAvailable: -1,
      memoryRetention: 'Unlimited',
    },
  },
};

export const ADDONS: Record<AddOnId, AddOn> = {
  tool_arsenal: {
    id: 'tool_arsenal',
    name: 'Tool Arsenal Pack',
    description: 'Unlock 20+ curated high-value tools',
    QubitCost: 12,
    icon: '🛠️',
    features: [
      'Code generation tools',
      'Research & analysis tools',
      'API integration helpers',
      'Data transformation tools',
    ],
  },
  parallelism_boost: {
    id: 'parallelism_boost',
    name: 'Parallelism Boost',
    description: 'Double your concurrent agent capacity',
    QubitCost: 15,
    icon: '⚡',
    features: [
      '+100% concurrent agents',
      'Priority queue access',
      'Faster orchestration',
      'Parallel tool execution',
    ],
  },
  memory_expansion: {
    id: 'memory_expansion',
    name: 'Memory+ Expansion',
    description: 'Extended context and persistent memory',
    QubitCost: 8,
    icon: '🧠',
    features: [
      '3x context window',
      '90-day memory retention',
      'Cross-session learning',
      'Knowledge graph storage',
    ],
  },
  visual_intelligence: {
    id: 'visual_intelligence',
    name: 'Visual Intelligence Pack',
    description: 'Advanced visualizations and analytics',
    QubitCost: 6,
    icon: '👁️',
    features: [
      'Advanced honeycomb views',
      'Real-time analytics dashboard',
      'Workflow visualization',
      'Performance heatmaps',
    ],
  },
};

export const BOOSTS: Record<BoostId, Boost> = {
  parallelism_surge: {
    id: 'parallelism_surge',
    name: '24h Parallelism Surge',
    description: 'Temporary boost to concurrent agents',
    QubitCost: 3,
    duration: '24 hours',
    icon: '🚀',
  },
  memory_burst: {
    id: 'memory_burst',
    name: '24h Memory+ Burst',
    description: 'Temporary extended memory access',
    QubitCost: 2,
    duration: '24 hours',
    icon: '💭',
  },
  tool_swarm: {
    id: 'tool_swarm',
    name: 'Tool Swarm Execution',
    description: 'One-time parallel tool execution',
    QubitCost: 4,
    duration: 'Single use',
    icon: '🐝',
  },
};

export const MILESTONES: Record<MilestoneId, Milestone> = {
  tasks_50: {
    id: 'tasks_50',
    name: 'Task Runner',
    description: 'Complete 50 tasks',
    QubitReward: 5,
    requirement: 50,
    icon: '🏃',
    category: 'usage',
  },
  tasks_100: {
    id: 'tasks_100',
    name: 'Task Master',
    description: 'Complete 100 tasks',
    QubitReward: 10,
    requirement: 100,
    icon: '🏆',
    category: 'usage',
  },
  tasks_500: {
    id: 'tasks_500',
    name: 'Task Legend',
    description: 'Complete 500 tasks',
    QubitReward: 25,
    requirement: 500,
    icon: '👑',
    category: 'usage',
  },
  orchestrations_10: {
    id: 'orchestrations_10',
    name: 'Orchestrator',
    description: 'Complete 10 orchestrations',
    QubitReward: 3,
    requirement: 10,
    icon: '🎭',
    category: 'usage',
  },
  orchestrations_50: {
    id: 'orchestrations_50',
    name: 'Symphony Conductor',
    description: 'Complete 50 orchestrations',
    QubitReward: 15,
    requirement: 50,
    icon: '🎼',
    category: 'usage',
  },
  tools_5_workflow: {
    id: 'tools_5_workflow',
    name: 'Tool Synergist',
    description: 'Use 5+ tools in one workflow',
    QubitReward: 2,
    requirement: 5,
    icon: '🔧',
    category: 'achievement',
  },
  streak_7: {
    id: 'streak_7',
    name: 'Weekly Warrior',
    description: '7-day activity streak',
    QubitReward: 4,
    requirement: 7,
    icon: '🔥',
    category: 'streak',
  },
  streak_30: {
    id: 'streak_30',
    name: 'Monthly Master',
    description: '30-day activity streak',
    QubitReward: 15,
    requirement: 30,
    icon: '💎',
    category: 'streak',
  },
  first_upgrade: {
    id: 'first_upgrade',
    name: 'First Steps',
    description: 'Purchase your first upgrade',
    QubitReward: 2,
    requirement: 1,
    icon: '🌟',
    category: 'achievement',
  },
  addon_bundle: {
    id: 'addon_bundle',
    name: 'Collector',
    description: 'Own 2+ add-ons',
    QubitReward: 5,
    requirement: 2,
    icon: '📦',
    category: 'achievement',
  },
};

// =============================================================================
// STORE STATE
// =============================================================================

interface PricingDataState {
  // Wallet
  Qubits: number;

  // Current plan
  currentTier: PlanTier;
  activeAddOns: AddOnId[];
  activeBoosts: ActiveBoost[];

  // Usage tracking
  usage: UsageStats;

  // Milestones
  completedMilestones: MilestoneId[];

  // Suggestions
  suggestions: UpgradeSuggestion[];
}

interface PricingActions {
  // Wallet
  addQubits: (amount: number, reason?: string) => void;
  spendQubits: (amount: number, reason?: string) => boolean;

  // Upgrades
  upgradeTier: (tier: PlanTier) => boolean;
  purchaseAddOn: (id: AddOnId) => boolean;
  activateBoost: (id: BoostId) => boolean;
  consumeBoost: (id: BoostId) => void;

  // Usage
  recordTask: () => void;
  recordOrchestration: () => void;
  recordToolsInWorkflow: (count: number) => void;
  updateStreak: () => void;

  // Milestones
  checkMilestones: () => MilestoneId[];
  claimMilestone: (id: MilestoneId) => boolean;

  // Suggestions
  generateSuggestions: () => void;

  // Utilities
  canAfford: (cost: number) => boolean;
  getEffectiveLimits: () => TierConfig['limits'];
  hasAddOn: (id: AddOnId) => boolean;
  hasActiveBoost: (id: BoostId) => boolean;
  cleanExpiredBoosts: () => void;
}

export type PricingState = PricingDataState & PricingActions;

const initialState: PricingDataState = {
  Qubits: 10, // Start with 10 Qubits to explore
  currentTier: 'scout',
  activeAddOns: [],
  activeBoosts: [],
  usage: {
    tasksCompleted: 0,
    tasksToday: 0,
    orchestrationsCompleted: 0,
    toolsUsedInWorkflow: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    totalQubitsEarned: 10,
    totalQubitsSpent: 0,
  },
  completedMilestones: [],
  suggestions: [],
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const usePricingStore = create<PricingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Wallet actions
      addQubits: (amount, reason) => {
        set((state) => ({
          Qubits: state.Qubits + amount,
          usage: {
            ...state.usage,
            totalQubitsEarned: state.usage.totalQubitsEarned + amount,
          },
        }));
        console.log(`+${amount} Qubits: ${reason || 'Unknown'}`);
      },

      spendQubits: (amount, reason) => {
        const { Qubits } = get();
        if (Qubits < amount) return false;
        
        set((state) => ({
          Qubits: state.Qubits - amount,
          usage: {
            ...state.usage,
            totalQubitsSpent: state.usage.totalQubitsSpent + amount,
          },
        }));
        console.log(`-${amount} Qubits: ${reason || 'Unknown'}`);
        return true;
      },

      // Upgrade actions
      upgradeTier: (tier) => {
        const { currentTier, spendQubits, completedMilestones, addQubits } = get();
        const tierConfig = TIERS[tier];
        const currentConfig = TIERS[currentTier];
        
        // Check if this is an actual upgrade
        const tierOrder: PlanTier[] = ['scout', 'operator', 'commander', 'strategist'];
        if (tierOrder.indexOf(tier) <= tierOrder.indexOf(currentTier)) {
          return false;
        }
        
        // Calculate cost (difference from current tier)
        const cost = tierConfig.QubitCost - currentConfig.QubitCost;
        
        if (!spendQubits(cost, `Upgrade to ${tierConfig.name}`)) {
          return false;
        }
        
        set({ currentTier: tier });
        
        // Check for first upgrade milestone
        if (!completedMilestones.includes('first_upgrade')) {
          addQubits(MILESTONES.first_upgrade.QubitReward, 'First upgrade milestone!');
          set((state) => ({
            completedMilestones: [...state.completedMilestones, 'first_upgrade'],
          }));
        }
        
        return true;
      },

      purchaseAddOn: (id) => {
        const { activeAddOns, spendQubits, completedMilestones, addQubits } = get();
        
        if (activeAddOns.includes(id)) return false;
        
        const addon = ADDONS[id];
        
        // Check for bundle discount (3rd addon at 50% off)
        const cost = activeAddOns.length >= 2 
          ? Math.floor(addon.QubitCost * 0.5) 
          : addon.QubitCost;
        
        if (!spendQubits(cost, `Purchase ${addon.name}`)) {
          return false;
        }
        
        set((state) => ({
          activeAddOns: [...state.activeAddOns, id],
        }));
        
        // Check for addon bundle milestone
        const newAddOnCount = activeAddOns.length + 1;
        if (newAddOnCount >= 2 && !completedMilestones.includes('addon_bundle')) {
          addQubits(MILESTONES.addon_bundle.QubitReward, 'Addon collector milestone!');
          set((state) => ({
            completedMilestones: [...state.completedMilestones, 'addon_bundle'],
          }));
        }
        
        return true;
      },

      activateBoost: (id) => {
        const { activeBoosts, spendQubits } = get();
        
        // Check if already active
        if (activeBoosts.some((b) => b.id === id && b.expiresAt > Date.now())) {
          return false;
        }
        
        const boost = BOOSTS[id];
        
        if (!spendQubits(boost.QubitCost, `Activate ${boost.name}`)) {
          return false;
        }
        
        const duration = boost.id === 'tool_swarm' 
          ? 5 * 60 * 1000 // Single use (5 min expiry window)
          : 24 * 60 * 60 * 1000; // 24 hours
        
        set((state) => ({
          activeBoosts: [
            ...state.activeBoosts.filter((b) => b.id !== id),
            { id, expiresAt: Date.now() + duration },
          ],
        }));
        
        return true;
      },

      consumeBoost: (id) => {
        set((state) => ({
          activeBoosts: state.activeBoosts.filter((b) => b.id !== id),
        }));
      },

      // Usage tracking
      recordTask: () => {
        get().updateStreak();
        set((state) => ({
          usage: {
            ...state.usage,
            tasksCompleted: state.usage.tasksCompleted + 1,
            tasksToday: (state.usage.tasksToday || 0) + 1,
          },
        }));
        get().checkMilestones();
      },

      recordOrchestration: () => {
        set((state) => ({
          usage: {
            ...state.usage,
            orchestrationsCompleted: state.usage.orchestrationsCompleted + 1,
          },
        }));
        get().updateStreak();
        get().checkMilestones();
      },

      recordToolsInWorkflow: (count) => {
        set((state) => ({
          usage: {
            ...state.usage,
            toolsUsedInWorkflow: Math.max(state.usage.toolsUsedInWorkflow, count),
          },
        }));
        get().checkMilestones();
      },

      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const { usage } = get();
        
        if (usage.lastActiveDate === today) return;
        
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        
        const newStreak = usage.lastActiveDate === yesterday 
          ? usage.currentStreak + 1 
          : 1;
        
        set((state) => ({
          usage: {
            ...state.usage,
            currentStreak: newStreak,
            longestStreak: Math.max(state.usage.longestStreak, newStreak),
            lastActiveDate: today,
            tasksToday: state.usage.lastActiveDate === today ? state.usage.tasksToday : 0,
          },
        }));
        
        get().checkMilestones();
      },

      // Milestone checking
      checkMilestones: () => {
        const { usage, completedMilestones, addQubits } = get();

        // Threshold table: [metric value, threshold, milestone id]
        const checks: [number, number, MilestoneId][] = [
          [usage.tasksCompleted, 50, 'tasks_50'],
          [usage.tasksCompleted, 100, 'tasks_100'],
          [usage.tasksCompleted, 500, 'tasks_500'],
          [usage.orchestrationsCompleted, 10, 'orchestrations_10'],
          [usage.orchestrationsCompleted, 50, 'orchestrations_50'],
          [usage.toolsUsedInWorkflow, 5, 'tools_5_workflow'],
          [usage.currentStreak, 7, 'streak_7'],
          [usage.currentStreak, 30, 'streak_30'],
        ];

        const newMilestones = checks
          .filter(([value, threshold, id]) => value >= threshold && !completedMilestones.includes(id))
          .map(([, , id]) => id);

        // Auto-claim new milestones
        for (const id of newMilestones) {
          const milestone = MILESTONES[id];
          addQubits(milestone.QubitReward, `Milestone: ${milestone.name}`);
          set((state) => ({
            completedMilestones: [...state.completedMilestones, id],
          }));
        }

        return newMilestones;
      },

      claimMilestone: (id) => {
        const { completedMilestones, addQubits } = get();
        if (completedMilestones.includes(id)) return false;
        
        const milestone = MILESTONES[id];
        addQubits(milestone.QubitReward, `Claimed: ${milestone.name}`);
        
        set((state) => ({
          completedMilestones: [...state.completedMilestones, id],
        }));
        
        return true;
      },

      // Suggestion engine
      generateSuggestions: () => {
        const { currentTier, activeAddOns, usage, Qubits } = get();
        const suggestions: UpgradeSuggestion[] = [];
        
        // Suggest tier upgrade based on usage
        if (currentTier === 'scout' && usage.tasksToday > 8) {
          suggestions.push({
            type: 'tier',
            id: 'operator',
            reason: 'You\'re hitting daily task limits',
            QubitCost: TIERS.operator.QubitCost,
            benefit: 'Unlimited tasks + full orchestration',
            priority: 1,
          });
        }
        
        if (currentTier === 'operator' && usage.orchestrationsCompleted > 20) {
          suggestions.push({
            type: 'tier',
            id: 'commander',
            reason: 'You\'re ready for multi-agent workflows',
            QubitCost: TIERS.commander.QubitCost - TIERS.operator.QubitCost,
            benefit: '5x concurrent agents + advanced tools',
            priority: 1,
          });
        }
        
        // Suggest add-ons based on usage patterns
        if (!activeAddOns.includes('tool_arsenal') && usage.toolsUsedInWorkflow >= 3) {
          suggestions.push({
            type: 'addon',
            id: 'tool_arsenal',
            reason: 'You frequently use multiple tools',
            QubitCost: ADDONS.tool_arsenal.QubitCost,
            benefit: '20+ additional tools',
            priority: 2,
          });
        }
        
        if (!activeAddOns.includes('memory_expansion') && usage.orchestrationsCompleted > 5) {
          suggestions.push({
            type: 'addon',
            id: 'memory_expansion',
            reason: 'Extended memory would help your workflows',
            QubitCost: ADDONS.memory_expansion.QubitCost,
            benefit: '3x context + 90-day retention',
            priority: 3,
          });
        }
        
        // Suggest boosts if user can afford them
        if (Qubits >= BOOSTS.parallelism_surge.QubitCost) {
          suggestions.push({
            type: 'boost',
            id: 'parallelism_surge',
            reason: 'Need more speed for a big task?',
            QubitCost: BOOSTS.parallelism_surge.QubitCost,
            benefit: '24h of extra parallel agents',
            priority: 4,
          });
        }
        
        // Sort by priority and limit
        const sorted = [...suggestions].sort((a, b) => a.priority - b.priority);
        set({ suggestions: sorted.slice(0, 3) });
      },

      // Utilities
      canAfford: (cost) => get().Qubits >= cost,

      getEffectiveLimits: () => {
        const { currentTier, activeAddOns, activeBoosts } = get();
        const baseLimits = { ...TIERS[currentTier].limits };
        
        // Apply add-on effects
        if (activeAddOns.includes('parallelism_boost')) {
          baseLimits.concurrentAgents = baseLimits.concurrentAgents === -1 
            ? -1 
            : baseLimits.concurrentAgents * 2;
        }
        
        if (activeAddOns.includes('memory_expansion')) {
          baseLimits.memoryRetention = '90 days';
        }
        
        if (activeAddOns.includes('tool_arsenal')) {
          baseLimits.toolsAvailable = baseLimits.toolsAvailable === -1 
            ? -1 
            : baseLimits.toolsAvailable + 20;
        }
        
        // Apply active boost effects
        const now = Date.now();
        if (activeBoosts.some((b) => b.id === 'parallelism_surge' && b.expiresAt > now)) {
          baseLimits.concurrentAgents = baseLimits.concurrentAgents === -1 
            ? -1 
            : baseLimits.concurrentAgents + 3;
        }
        
        return baseLimits;
      },

      hasAddOn: (id) => get().activeAddOns.includes(id),
      
      hasActiveBoost: (id) => {
        const { activeBoosts } = get();
        return activeBoosts.some((b) => b.id === id && b.expiresAt > Date.now());
      },

      cleanExpiredBoosts: () => {
        const now = Date.now();
        set((state) => ({
          activeBoosts: state.activeBoosts.filter((b) => b.expiresAt > now),
        }));
      },
    }),
    {
      name: 'agentarmy-pricing',
      partialize: (state) => ({
        Qubits: state.Qubits,
        currentTier: state.currentTier,
        activeAddOns: state.activeAddOns,
        activeBoosts: state.activeBoosts,
        usage: state.usage,
        completedMilestones: state.completedMilestones,
      }),
    }
  )
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get tier requirements for a specific capability
 */
export function getTierRequirement(capability: string): PlanTier | null {
  const requirements: Record<string, PlanTier> = {
    'multi_agent': 'commander',
    'custom_tools': 'strategist',
    'team_sharing': 'commander',
    'governance': 'strategist',
    'audit_logs': 'strategist',
    'unlimited_tasks': 'operator',
    'priority_queue': 'operator',
  };
  return requirements[capability] || null;
}

/**
 * Check if a capability is locked for the current tier
 */
export function isCapabilityLocked(
  capability: string, 
  currentTier: PlanTier
): boolean {
  const required = getTierRequirement(capability);
  if (!required) return false;
  
  const tierOrder: PlanTier[] = ['scout', 'operator', 'commander', 'strategist'];
  return tierOrder.indexOf(currentTier) < tierOrder.indexOf(required);
}

/**
 * Get the unlock cost for a capability
 */
export function getUnlockCost(
  capability: string, 
  currentTier: PlanTier
): number {
  const required = getTierRequirement(capability);
  if (!required) return 0;
  
  return TIERS[required].QubitCost - TIERS[currentTier].QubitCost;
}

export default usePricingStore;
