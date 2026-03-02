/**
 * Pulse Store - Zustand store for global resonance system
 * Manages pulse intensity and hue shifts for all modules
 * Works alongside unifiedAgentStore for visual effects
 */

import { create } from 'zustand';

interface PulseData {
  intensity: number;
  hueShift: number;
}

interface PulseState {
  pulse: Record<string, PulseData>;
  updatePulse: (key: string, data: Partial<PulseData>) => void;
  setGlobalIntensity: (intensity: number) => void;
  triggerPulse: (key: string, intensity?: number) => void;
  syncWithZPE: (zpeTotal: number) => void;
}

// Default pulse values for each module
const defaultPulse: Record<string, PulseData> = {
  global: { intensity: 0.65, hueShift: 0 },
  planner: { intensity: 0.75, hueShift: 210 },     // Blue
  executor: { intensity: 0.85, hueShift: 45 },     // Gold
  critic: { intensity: 0.55, hueShift: 0 },        // Red
  governor: { intensity: 0.60, hueShift: 120 },    // Green
  memory: { intensity: 0.45, hueShift: 280 },      // Purple
  learning: { intensity: 0.70, hueShift: 160 },    // Cyan
  tools: { intensity: 0.50, hueShift: 30 },        // Orange
  router: { intensity: 0.80, hueShift: 190 },      // Teal
  verifier: { intensity: 0.55, hueShift: 40 },     // Amber
  core: { intensity: 0.90, hueShift: 0 },          // White/neutral
  agents: { intensity: 0.65, hueShift: 150 },      // Mint
};

export const usePulseStore = create<PulseState>((set, get) => ({
  pulse: defaultPulse,

  updatePulse: (key, data) =>
    set((state) => ({
      pulse: {
        ...state.pulse,
        [key]: { 
          ...state.pulse[key], 
          ...data,
          intensity: Math.max(0.1, Math.min(1, data.intensity ?? state.pulse[key]?.intensity ?? 0.5)),
        },
      },
    })),

  setGlobalIntensity: (intensity) =>
    set((state) => {
      const clampedIntensity = Math.max(0.1, Math.min(1, intensity));
      const newPulse = { ...state.pulse };
      Object.keys(newPulse).forEach((key) => {
        // Scale each module's intensity relative to global
        const baseIntensity = defaultPulse[key]?.intensity ?? 0.5;
        newPulse[key] = {
          ...newPulse[key],
          intensity: Math.max(0.1, Math.min(1, baseIntensity * clampedIntensity * 1.2)),
        };
      });
      return { pulse: newPulse };
    }),

  // Trigger a temporary intensity spike for a module
  triggerPulse: (key, intensity = 1) => {
    const { pulse, updatePulse } = get();
    const originalIntensity = pulse[key]?.intensity ?? 0.5;
    
    // Spike to max
    updatePulse(key, { intensity });
    
    // Decay back to original over 500ms
    setTimeout(() => updatePulse(key, { intensity: originalIntensity * 1.1 }), 150);
    setTimeout(() => updatePulse(key, { intensity: originalIntensity }), 500);
  },

  // Sync pulse intensity with ZPE score from unified agent
  syncWithZPE: (zpeTotal) => {
    const intensity = Math.max(0.3, Math.min(1, zpeTotal * 1.2));
    set((state) => ({
      pulse: {
        ...state.pulse,
        global: { ...state.pulse.global, intensity },
        core: { ...state.pulse.core, intensity: Math.min(1, intensity * 1.1) },
      },
    }));
  },
}));

// Optional: Live demo pulsing effect (creates subtle breathing animation)
// Remove or adjust in production
let pulseInterval: ReturnType<typeof setInterval> | null = null;

export const startDemoPulse = () => {
  if (pulseInterval) return;
  pulseInterval = setInterval(() => {
    const { pulse } = usePulseStore.getState();
    const newPulse = { ...pulse };
    Object.keys(newPulse).forEach((key) => {
      // Subtle random fluctuation
      const delta = (Math.random() - 0.5) * 0.06;
      newPulse[key] = {
        ...newPulse[key],
        intensity: Math.max(0.2, Math.min(0.95, newPulse[key].intensity + delta)),
      };
    });
    usePulseStore.setState({ pulse: newPulse });
  }, 2000);
};

export const stopDemoPulse = () => {
  if (pulseInterval) {
    clearInterval(pulseInterval);
    pulseInterval = null;
  }
};

export default usePulseStore;
