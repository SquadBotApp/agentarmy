// ---------------------------------------------------------------------------
// Planet‑Scale Orchestration Layer
// ---------------------------------------------------------------------------
// Manages geographic regions, cross‑region mission routing, latency‑aware
// runner placement, and global load balancing for the AgentArmy platform.
// ---------------------------------------------------------------------------

export type RegionStatus = 'online' | 'degraded' | 'offline' | 'maintenance';

export interface Region {
  id: string;
  name: string;
  location: string;
  status: RegionStatus;
  runnerCount: number;
  activeMissions: number;
  avgLatencyMs: number;
  capacityPercent: number;  // 0‑100
  createdAt: string;
}

export interface CrossRegionRoute {
  id: string;
  sourceRegion: string;
  targetRegion: string;
  latencyMs: number;
  bandwidthMbps: number;
  status: 'active' | 'degraded' | 'down';
}

export interface GlobalLoadSnapshot {
  regions: Region[];
  routes: CrossRegionRoute[];
  totalMissions: number;
  totalRunners: number;
  avgGlobalLatency: number;
  hotspots: string[];         // region IDs with >80% capacity
  timestamp: string;
}

export interface PlacementDecision {
  missionId: string;
  chosenRegion: string;
  reason: string;
  latencyEstimateMs: number;
  capacityAfterPlacement: number;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export class PlanetScaleOrchestration {
  private regions: Map<string, Region> = new Map();
  private routes: CrossRegionRoute[] = [];
  private decisions: PlacementDecision[] = [];
  private listeners: Array<(d: PlacementDecision) => void> = [];

  // ---- Regions ----

  addRegion(region: Omit<Region, 'createdAt'>): Region {
    const full: Region = { ...region, createdAt: new Date().toISOString() };
    this.regions.set(full.id, full);
    return full;
  }

  removeRegion(regionId: string): boolean {
    return this.regions.delete(regionId);
  }

  updateRegionStatus(regionId: string, status: RegionStatus): void {
    const r = this.regions.get(regionId);
    if (r) r.status = status;
  }

  updateRegionLoad(regionId: string, activeMissions: number, runnerCount: number, capacityPercent: number): void {
    const r = this.regions.get(regionId);
    if (!r) return;
    r.activeMissions = activeMissions;
    r.runnerCount = runnerCount;
    r.capacityPercent = Math.min(100, Math.max(0, capacityPercent));
  }

  getRegion(id: string): Region | undefined {
    return this.regions.get(id);
  }

  getRegions(): Region[] {
    return Array.from(this.regions.values());
  }

  // ---- Routes ----

  addRoute(route: CrossRegionRoute): void {
    this.routes.push(route);
  }

  getRoutes(): CrossRegionRoute[] {
    return [...this.routes];
  }

  // ---- Placement ----

  /** Choose the best region for a mission given optional affinity and latency requirements. */
  placeMission(
    missionId: string,
    opts: { affinityRegion?: string; maxLatencyMs?: number; requireSafeRegion?: boolean } = {},
  ): PlacementDecision {
    const candidates = Array.from(this.regions.values()).filter(
      (r) => r.status === 'online' || r.status === 'degraded',
    );

    if (candidates.length === 0) {
      const decision: PlacementDecision = {
        missionId,
        chosenRegion: 'none',
        reason: 'No available regions',
        latencyEstimateMs: Infinity,
        capacityAfterPlacement: 100,
      };
      this.decisions.push(decision);
      return decision;
    }

    // Score each region: lighter capacity + lower latency = better
    const scored = candidates.map((r) => {
      let score = r.capacityPercent + r.avgLatencyMs * 0.5;
      if (opts.affinityRegion && r.id === opts.affinityRegion) score *= 0.5;
      if (opts.maxLatencyMs && r.avgLatencyMs > opts.maxLatencyMs) score += 10_000;
      if (r.status === 'degraded') score *= 1.5;
      return { region: r, score };
    });

    scored.sort((a, b) => a.score - b.score);
    const best = scored[0].region;

    const decision: PlacementDecision = {
      missionId,
      chosenRegion: best.id,
      reason: `Selected ${best.name} (capacity ${best.capacityPercent}%, latency ${best.avgLatencyMs}ms)`,
      latencyEstimateMs: best.avgLatencyMs,
      capacityAfterPlacement: Math.min(100, best.capacityPercent + 5),
    };

    // Apply placement
    best.activeMissions += 1;
    best.capacityPercent = Math.min(100, best.capacityPercent + 5);

    this.decisions.push(decision);
    for (const fn of this.listeners) fn(decision);
    return decision;
  }

  getDecisions(limit = 50): PlacementDecision[] {
    return this.decisions.slice(-limit);
  }

  // ---- Load Balancing ----

  /** Identify hotspot regions and suggest rebalancing. */
  identifyHotspots(threshold = 80): string[] {
    return Array.from(this.regions.values())
      .filter((r) => r.capacityPercent > threshold && r.status !== 'offline')
      .map((r) => r.id);
  }

  /** Get the current global load snapshot. */
  getGlobalSnapshot(): GlobalLoadSnapshot {
    const regions = this.getRegions();
    const totalLatency = regions.reduce((s, r) => s + r.avgLatencyMs, 0);

    return {
      regions,
      routes: [...this.routes],
      totalMissions: regions.reduce((s, r) => s + r.activeMissions, 0),
      totalRunners: regions.reduce((s, r) => s + r.runnerCount, 0),
      avgGlobalLatency: regions.length > 0 ? Math.round(totalLatency / regions.length) : 0,
      hotspots: this.identifyHotspots(),
      timestamp: new Date().toISOString(),
    };
  }

  // ---- Events ----

  on(listener: (d: PlacementDecision) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }
}

// ---------------------------------------------------------------------------
// Default regions
// ---------------------------------------------------------------------------

export function createDefaultRegions(): Region[] {
  const now = new Date().toISOString();
  return [
    { id: 'us-east', name: 'US East', location: 'Virginia', status: 'online', runnerCount: 12, activeMissions: 0, avgLatencyMs: 25, capacityPercent: 15, createdAt: now },
    { id: 'us-west', name: 'US West', location: 'Oregon', status: 'online', runnerCount: 8, activeMissions: 0, avgLatencyMs: 35, capacityPercent: 10, createdAt: now },
    { id: 'eu-west', name: 'EU West', location: 'Ireland', status: 'online', runnerCount: 10, activeMissions: 0, avgLatencyMs: 45, capacityPercent: 20, createdAt: now },
    { id: 'ap-south', name: 'Asia Pacific', location: 'Singapore', status: 'online', runnerCount: 6, activeMissions: 0, avgLatencyMs: 60, capacityPercent: 8, createdAt: now },
    { id: 'edge-local', name: 'Edge Local', location: 'On-Prem', status: 'online', runnerCount: 3, activeMissions: 0, avgLatencyMs: 5, capacityPercent: 5, createdAt: now },
  ];
}
