/**
 * Plan Store - Zustand store for ethical monetization
 * Transparent pricing tiers, add-ons, and usage tracking
 * No dark patterns - honest value-based progression
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Plan tier definitions
export type PlanTier = 'scout' | 'operator' | 'commander' | 'strategist';

export type AddOnId = 
  | 'tool_arsenal' 
  | 'parallelism_boost' 
  | 'memory_expansion' 
  | 'visual_intelligence';

export interface AddOn {
  id: AddOnId;
  name: string;
  description: string;
  price: number; // monthly
  icon: string;
  unlocksFeatures: string[];
}

export interface PlanLimits {
  tasksPerDay: number;
  concurrentAgents: number;
  toolsAvailable: string[];
  memoryRetentionDays: number;
  parallelism: boolean;
  teamSharing: boolean;
  customTools: boolean;
  governance: boolean;
}

export interface Usage {
  tasksToday: number;
  tasksThisMonth: number;
  toolsUsed: string[];
  peakConcurrency: number;
  totalOrchestrations: number;
  timeSavedMinutes: number;
}

export interface UpgradeSuggestion {
  type: 'tier' | 'addon';
  target: PlanTier | AddOnId;
  reason: string;
  benefit: string;
  discount?: number;
  priority: 'low' | 'medium' | 'high';
}

export interface PlanState {
  // Current plan state
  currentTier: PlanTier;
  activeAddOns: AddOnId[];
  usage: Usage;
  monthlySpend: number;
  
  // Upgrade suggestions (data-driven, not manipulative)
  suggestions: UpgradeSuggestion[];
  
  // Trial state
  activeTrial: { tier: PlanTier; expiresAt: number } | null;
  
  // Loyalty/milestone tracking
  milestones: {
    orchestrationsCompleted: number;
    consecutiveMonths: number;
    addOnsBought: number;
  };
  
  // Actions
  setTier: (tier: PlanTier) => void;
  addAddOn: (addOn: AddOnId) => void;
  removeAddOn: (addOn: AddOnId) => void;
  recordTaskUsage: () => void;
  recordOrchestration: (timeSavedMinutes: number) => void;
  startTrial: (tier: PlanTier, durationHours: number) => void;
  endTrial: () => void;
  refreshSuggestions: () => void;
  
  // Getters
  getEffectiveLimits: () => PlanLimits;
  getEffectiveTier: () => PlanTier;
  isFeatureAvailable: (feature: string) => boolean;
  getLockedFeatures: () => string[];
}

// Plan tier configurations
export const PLAN_TIERS: Record<PlanTier, { name: string; price: number; limits: PlanLimits }> = {
  scout: {
    name: 'Scout (Free)',
    price: 0,
    limits: {
      tasksPerDay: 10,
      concurrentAgents: 1,
      toolsAvailable: ['web_search', 'calculator', 'text_analyzer'],
      memoryRetentionDays: 7,
      parallelism: false,
      teamSharing: false,
      customTools: false,
      governance: false,
    },
  },
  operator: {
    name: 'Operator',
    price: 19,
    limits: {
      tasksPerDay: 100,
      concurrentAgents: 3,
      toolsAvailable: ['web_search', 'calculator', 'text_analyzer', 'code_runner', 'file_manager', 'api_caller'],
      memoryRetentionDays: 30,
      parallelism: false,
      teamSharing: false,
      customTools: false,
      governance: false,
    },
  },
  commander: {
    name: 'Commander',
    price: 49,
    limits: {
      tasksPerDay: 500,
      concurrentAgents: 8,
      toolsAvailable: ['web_search', 'calculator', 'text_analyzer', 'code_runner', 'file_manager', 'api_caller', 'research_agent', 'data_analyzer', 'image_processor'],
      memoryRetentionDays: 90,
      parallelism: true,
      teamSharing: true,
      customTools: false,
      governance: false,
    },
  },
  strategist: {
    name: 'Strategist',
    price: 149,
    limits: {
      tasksPerDay: -1, // unlimited
      concurrentAgents: 20,
      toolsAvailable: ['*'], // all tools
      memoryRetentionDays: 365,
      parallelism: true,
      teamSharing: true,
      customTools: true,
      governance: true,
    },
  },
};

// Add-on configurations
export const ADD_ONS: Record<AddOnId, AddOn> = {
  tool_arsenal: {
    id: 'tool_arsenal',
    name: 'Tool Arsenal Pack',
    description: 'Unlock 15+ premium tools including code generation, research APIs, and data connectors.',
    price: 9,
    icon: '🛠️',
    unlocksFeatures: ['premium_tools', 'api_connectors', 'code_generation'],
  },
  parallelism_boost: {
    id: 'parallelism_boost',
    name: 'Parallelism Boost',
    description: 'Double your concurrent agent limit. Run more tasks simultaneously.',
    price: 12,
    icon: '⚡',
    unlocksFeatures: ['double_concurrency', 'priority_queue'],
  },
  memory_expansion: {
    id: 'memory_expansion',
    name: 'Memory & History Expansion',
    description: '3× longer context retention and persistent cross-session memory.',
    price: 7,
    icon: '🧠',
    unlocksFeatures: ['extended_memory', 'cross_session_context', 'memory_search'],
  },
  visual_intelligence: {
    id: 'visual_intelligence',
    name: 'Visual Intelligence Pack',
    description: 'Advanced dashboards, workflow visualizations, and honeycomb analytics.',
    price: 8,
    icon: '📊',
    unlocksFeatures: ['advanced_visualizations', 'workflow_analytics', 'export_reports'],
  },
};

// Helper: calculate tier index for comparison
const tierIndex = (tier: PlanTier): number => {
  const order: PlanTier[] = ['scout', 'operator', 'commander', 'strategist'];
  return order.indexOf(tier);
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTier: 'scout',
      activeAddOns: [],
      usage: {
        tasksToday: 0,
        tasksThisMonth: 0,
        toolsUsed: [],
        peakConcurrency: 0,
        totalOrchestrations: 0,
        timeSavedMinutes: 0,
      },
      monthlySpend: 0,
      suggestions: [],
      activeTrial: null,
      milestones: {
        orchestrationsCompleted: 0,
        consecutiveMonths: 0,
        addOnsBought: 0,
      },

      // Actions
      setTier: (tier) => {
        const price = PLAN_TIERS[tier].price;
        set((state) => ({
          currentTier: tier,
          monthlySpend: price + state.activeAddOns.reduce((sum, id) => sum + ADD_ONS[id].price, 0),
        }));
        get().refreshSuggestions();
      },

      addAddOn: (addOn) => {
        set((state) => {
          if (state.activeAddOns.includes(addOn)) return state;
          const newAddOns = [...state.activeAddOns, addOn];
          return {
            activeAddOns: newAddOns,
            monthlySpend: PLAN_TIERS[state.currentTier].price + newAddOns.reduce((sum, id) => sum + ADD_ONS[id].price, 0),
            milestones: {
              ...state.milestones,
              addOnsBought: state.milestones.addOnsBought + 1,
            },
          };
        });
        get().refreshSuggestions();
      },

      removeAddOn: (addOn) => {
        set((state) => {
          const newAddOns = state.activeAddOns.filter((id) => id !== addOn);
          return {
            activeAddOns: newAddOns,
            monthlySpend: PLAN_TIERS[state.currentTier].price + newAddOns.reduce((sum, id) => sum + ADD_ONS[id].price, 0),
          };
        });
      },

      recordTaskUsage: () => {
        set((state) => ({
          usage: {
            ...state.usage,
            tasksToday: state.usage.tasksToday + 1,
            tasksThisMonth: state.usage.tasksThisMonth + 1,
          },
        }));
        get().refreshSuggestions();
      },

      recordOrchestration: (timeSavedMinutes) => {
        set((state) => ({
          usage: {
            ...state.usage,
            totalOrchestrations: state.usage.totalOrchestrations + 1,
            timeSavedMinutes: state.usage.timeSavedMinutes + timeSavedMinutes,
          },
          milestones: {
            ...state.milestones,
            orchestrationsCompleted: state.milestones.orchestrationsCompleted + 1,
          },
        }));
        get().refreshSuggestions();
      },

      startTrial: (tier, durationHours) => {
        set({
          activeTrial: {
            tier,
            expiresAt: Date.now() + durationHours * 60 * 60 * 1000,
          },
        });
      },

      endTrial: () => {
        set({ activeTrial: null });
      },

      refreshSuggestions: () => {
        const state = get();
        const suggestions: UpgradeSuggestion[] = [];
        const limits = state.getEffectiveLimits();

        // Check if hitting task limits
        if (limits.tasksPerDay > 0 && state.usage.tasksToday >= limits.tasksPerDay * 0.8) {
          const nextTier = tierIndex(state.currentTier) < 3 
            ? (['scout', 'operator', 'commander', 'strategist'] as PlanTier[])[tierIndex(state.currentTier) + 1]
            : null;
          if (nextTier) {
            suggestions.push({
              type: 'tier',
              target: nextTier,
              reason: `You've used ${state.usage.tasksToday}/${limits.tasksPerDay} tasks today`,
              benefit: `${PLAN_TIERS[nextTier].limits.tasksPerDay === -1 ? 'Unlimited' : PLAN_TIERS[nextTier].limits.tasksPerDay} daily tasks`,
              priority: state.usage.tasksToday >= limits.tasksPerDay ? 'high' : 'medium',
            });
          }
        }

        // Check concurrency usage
        if (state.usage.peakConcurrency >= limits.concurrentAgents * 0.7 && !state.activeAddOns.includes('parallelism_boost')) {
          suggestions.push({
            type: 'addon',
            target: 'parallelism_boost',
            reason: 'You frequently run multiple agents simultaneously',
            benefit: '2× concurrent agents, priority queue access',
            priority: 'medium',
          });
        }

        // Milestone-based suggestions (reward ladder)
        if (state.milestones.orchestrationsCompleted >= 100 && !state.activeAddOns.includes('memory_expansion')) {
          suggestions.push({
            type: 'addon',
            target: 'memory_expansion',
            reason: '🎉 100 orchestrations milestone reached!',
            benefit: '3× memory retention + 15% loyalty discount',
            discount: 15,
            priority: 'medium',
          });
        }

        // Bundle suggestion (own 2 add-ons → 3rd at discount)
        if (state.activeAddOns.length === 2) {
          const missingAddOns = (Object.keys(ADD_ONS) as AddOnId[]).filter(
            (id) => !state.activeAddOns.includes(id)
          );
          if (missingAddOns.length > 0) {
            suggestions.push({
              type: 'addon',
              target: missingAddOns[0],
              reason: 'You own 2 add-ons',
              benefit: '50% off your 3rd add-on',
              discount: 50,
              priority: 'low',
            });
          }
        }

        // Commander upgrade if using many tools
        if (state.currentTier === 'operator' && state.usage.toolsUsed.length >= 5) {
          suggestions.push({
            type: 'tier',
            target: 'commander',
            reason: 'You actively use 5+ tools',
            benefit: 'Multi-agent parallelism + research & data tools',
            priority: 'medium',
          });
        }

        set({ suggestions });
      },

      // Getters
      getEffectiveTier: () => {
        const state = get();
        if (state.activeTrial && state.activeTrial.expiresAt > Date.now()) {
          return state.activeTrial.tier;
        }
        return state.currentTier;
      },

      getEffectiveLimits: () => {
        const state = get();
        const effectiveTier = state.getEffectiveTier();
        const baseLimits = { ...PLAN_TIERS[effectiveTier].limits };

        // Apply add-on boosts
        if (state.activeAddOns.includes('parallelism_boost')) {
          baseLimits.concurrentAgents *= 2;
        }
        if (state.activeAddOns.includes('memory_expansion')) {
          baseLimits.memoryRetentionDays *= 3;
        }
        if (state.activeAddOns.includes('tool_arsenal')) {
          baseLimits.toolsAvailable = [
            ...baseLimits.toolsAvailable,
            'code_generator',
            'research_api',
            'data_connector',
            'pdf_parser',
            'email_composer',
          ];
        }

        return baseLimits;
      },

      isFeatureAvailable: (feature) => {
        const state = get();
        const limits = state.getEffectiveLimits();

        // Check add-on features
        for (const addOnId of state.activeAddOns) {
          if (ADD_ONS[addOnId].unlocksFeatures.includes(feature)) {
            return true;
          }
        }

        // Check tier features
        switch (feature) {
          case 'parallelism':
            return limits.parallelism;
          case 'team_sharing':
            return limits.teamSharing;
          case 'custom_tools':
            return limits.customTools;
          case 'governance':
            return limits.governance;
          default:
            return true;
        }
      },

      getLockedFeatures: () => {
        const state = get();
        const locked: string[] = [];
        const limits = state.getEffectiveLimits();

        if (!limits.parallelism) locked.push('Multi-Agent Parallelism');
        if (!limits.teamSharing) locked.push('Team Sharing');
        if (!limits.customTools) locked.push('Custom Tools');
        if (!limits.governance) locked.push('Governance Controls');

        // Check add-on features not owned
        const allAddOnFeatures = Object.values(ADD_ONS).flatMap((a) => a.unlocksFeatures);
        const ownedFeatures = state.activeAddOns.flatMap((id) => ADD_ONS[id].unlocksFeatures);
        const lockedAddOnFeatures = allAddOnFeatures.filter((f) => !ownedFeatures.includes(f));

        return [...locked, ...lockedAddOnFeatures];
      },
    }),
    {
      name: 'agentarmy-plan',
      partialize: (state) => ({
        currentTier: state.currentTier,
        activeAddOns: state.activeAddOns,
        usage: state.usage,
        milestones: state.milestones,
        monthlySpend: state.monthlySpend,
      }),
    }
  )
);

export default usePlanStore;
