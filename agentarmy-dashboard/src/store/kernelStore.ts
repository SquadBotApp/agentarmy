/**
 * Kernel Store — Zustand store for the AgentArmy OS unified kernel.
 *
 * Instantiates the TotalSystemUnification and exposes subsystem snapshots,
 * health status, and convenience actions to the React dashboard.
 *
 * Roadmap item 1e: real kernel subscription via `kernel.on(...)`.
 * Components consume this store exclusively — never import the kernel directly.
 */

import { create } from 'zustand';
import { TotalSystemUnification, UnifiedSystemSnapshot, SubsystemStatus } from '../core/totalSystemUnification';

// =============================================================================
// TYPES
// =============================================================================

export interface KernelState {
  /** Latest snapshot of all subsystems. */
  snapshot: UnifiedSystemSnapshot | null;

  /** Convenience: flat list of all subsystem statuses. */
  subsystems: SubsystemStatus[];

  /** Whether the kernel has been initialized. */
  initialized: boolean;

  /** Derived: true when every subsystem is healthy. */
  isHealthy: boolean;

  /** Milliseconds since kernel instantiation. */
  uptimeMs: number;

  /** Last error from any kernel operation. */
  lastError: string | null;

  // ---- Actions ----
  initialize: () => void;
  refreshSnapshot: () => void;
  getSubsystemStatus: (name: string) => SubsystemStatus | undefined;

  /** Run a single optimization tick on the orchestration kernel. */
  tick: () => void;

  /** Mint Qb into an entity's economy account. */
  mint: (entityId: string, amount: number, reason?: string) => void;

  /** Get the health score from the civilization intelligence layer. */
  getCivilizationHealth: () => number;

  /** Unsubscribe from kernel events (cleanup). */
  destroy: () => void;
}

// =============================================================================
// SINGLETON KERNEL — lives outside the Zustand state to prevent consumers
// from accessing/mutating it through get().kernel.
// =============================================================================

const kernel = new TotalSystemUnification();

// =============================================================================
// HELPERS
// =============================================================================

/** Derive convenience properties from a snapshot. */
function deriveFromSnapshot(snapshot: UnifiedSystemSnapshot) {
  return {
    snapshot,
    subsystems: snapshot.subsystems,
    isHealthy: snapshot.unhealthyCount === 0,
    uptimeMs: snapshot.uptimeMs,
    lastError: null,
  };
}

// =============================================================================
// STORE
// =============================================================================

export const useKernelStore = create<KernelState>((set, get) => {
  // Subscribe to kernel broadcasts — auto-update store when any subsystem
  // triggers broadcastStatus(). This is the "real subscription" (roadmap 1e).
  const unsubscribe = kernel.on((snapshot) => {
    set(deriveFromSnapshot(snapshot));
  });

  return {
    snapshot: null,
    subsystems: [],
    initialized: false,
    isHealthy: false,
    uptimeMs: 0,
    lastError: null,

    initialize: () => {
      try {
        const snapshot = kernel.getSnapshot();
        set({ ...deriveFromSnapshot(snapshot), initialized: true });
      } catch (err) {
        set({ lastError: String(err) });
      }
    },

    refreshSnapshot: () => {
      try {
        const snapshot = kernel.getSnapshot();
        set(deriveFromSnapshot(snapshot));
      } catch (err) {
        set({ lastError: String(err) });
      }
    },

    getSubsystemStatus: (name: string) => {
      const { subsystems } = get();
      return subsystems.find((s) => s.name === name);
    },

    tick: () => {
      if (!get().initialized) return; // guard: no-op before init
      try {
        kernel.kernel.tick();
        const snapshot = kernel.getSnapshot();
        set(deriveFromSnapshot(snapshot));
      } catch (err) {
        set({ lastError: String(err) });
      }
    },

    mint: (entityId: string, amount: number, reason?: string) => {
      if (!get().initialized) return; // guard: no-op before init
      try {
        kernel.economy.mint(entityId, amount, reason);
        // Refresh snapshot so the economy change is visible in the UI
        const snapshot = kernel.getSnapshot();
        set(deriveFromSnapshot(snapshot));
      } catch (err) {
        set({ lastError: String(err) });
      }
    },

    getCivilizationHealth: () => {
      // Derive from snapshot if available; fall back to live query
      const { snapshot } = get();
      if (snapshot) {
        const civStatus = snapshot.subsystems.find((s) => s.name === 'CivilizationIntelligence');
        const health = (civStatus?.summary as Record<string, unknown>)?.healthScore;
        if (typeof health === 'number') return health;
      }
      return kernel.civilization.computeHealth();
    },

    destroy: () => {
      unsubscribe();
    },
  };
});
