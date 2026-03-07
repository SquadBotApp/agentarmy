// ---------------------------------------------------------------------------
// Civilization‑Scale Intelligence Layer
// ---------------------------------------------------------------------------
// Aggregates intelligence from all subsystems to form a holistic
// "civilizational awareness" — tracking macro trends, global health,
// emergent phenomena, and long‑range strategic forecasts.
// ---------------------------------------------------------------------------

export type IntelligenceDomain =
  | 'performance'
  | 'safety'
  | 'economy'
  | 'governance'
  | 'reputation'
  | 'infrastructure'
  | 'knowledge';

export interface CivilizationSignal {
  id: string;
  domain: IntelligenceDomain;
  title: string;
  description: string;
  severity: 'info' | 'advisory' | 'warning' | 'critical';
  value: number;
  trend: 'improving' | 'stable' | 'degrading';
  timestamp: string;
}

export interface StrategicForecast {
  id: string;
  horizon: string;           // e.g. "1h", "24h", "7d"
  domain: IntelligenceDomain;
  prediction: string;
  confidence: number;         // 0‑1
  basis: string;
  createdAt: string;
}

export interface EmergentPhenomenon {
  id: string;
  name: string;
  description: string;
  domains: IntelligenceDomain[];
  signalIds: string[];
  detectedAt: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CivilizationSnapshot {
  totalSignals: number;
  byDomain: Record<IntelligenceDomain, number>;
  criticalSignals: number;
  forecasts: number;
  phenomena: number;
  overallHealth: number;      // 0‑100
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Intelligence Engine
// ---------------------------------------------------------------------------

const ALL_DOMAINS: IntelligenceDomain[] = [
  'performance', 'safety', 'economy', 'governance', 'reputation', 'infrastructure', 'knowledge',
];

export class CivilizationIntelligence {
  private signals: CivilizationSignal[] = [];
  private forecasts: StrategicForecast[] = [];
  private phenomena: EmergentPhenomenon[] = [];
  private listeners: Array<(s: CivilizationSignal) => void> = [];

  // ---- Signals ----

  reportSignal(signal: Omit<CivilizationSignal, 'id' | 'timestamp'>): CivilizationSignal {
    const full: CivilizationSignal = {
      ...signal,
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.signals.push(full);
    if (this.signals.length > 50_000) this.signals = this.signals.slice(-50_000);
    for (const fn of this.listeners) fn(full);
    return full;
  }

  getSignals(domain?: IntelligenceDomain, limit = 100): CivilizationSignal[] {
    const filtered = domain ? this.signals.filter((s) => s.domain === domain) : this.signals;
    return filtered.slice(-limit);
  }

  getCriticalSignals(): CivilizationSignal[] {
    return this.signals.filter((s) => s.severity === 'critical');
  }

  // ---- Forecasts ----

  addForecast(forecast: Omit<StrategicForecast, 'id' | 'createdAt'>): StrategicForecast {
    const full: StrategicForecast = {
      ...forecast,
      id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.forecasts.push(full);
    return full;
  }

  getForecasts(domain?: IntelligenceDomain): StrategicForecast[] {
    return domain ? this.forecasts.filter((f) => f.domain === domain) : [...this.forecasts];
  }

  // ---- Emergent Phenomena ----

  /** Detect emergent patterns by correlating recent signals across domains. */
  detectPhenomena(): EmergentPhenomenon[] {
    const recent = this.signals.slice(-500);
    const domainCounts = new Map<IntelligenceDomain, CivilizationSignal[]>();
    for (const s of recent) {
      const list = domainCounts.get(s.domain) ?? [];
      list.push(s);
      domainCounts.set(s.domain, list);
    }

    const newPhenomena: EmergentPhenomenon[] = [];

    // Look for cross-domain correlation: multiple warning/critical signals
    const warningDomains: IntelligenceDomain[] = [];
    for (const [domain, sigs] of Array.from(domainCounts)) {
      const serious = sigs.filter((s) => s.severity === 'warning' || s.severity === 'critical');
      if (serious.length >= 3) warningDomains.push(domain);
    }

    if (warningDomains.length >= 2) {
      const phenomenon: EmergentPhenomenon = {
        id: `pheno-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: `Cross-domain stress event`,
        description: `Elevated severity signals detected in ${warningDomains.join(', ')} domains`,
        domains: warningDomains,
        signalIds: recent.filter((s) => warningDomains.includes(s.domain)).map((s) => s.id),
        detectedAt: new Date().toISOString(),
        severity: warningDomains.length >= 4 ? 'high' : 'medium',
      };
      this.phenomena.push(phenomenon);
      newPhenomena.push(phenomenon);
    }

    return newPhenomena;
  }

  getPhenomena(): EmergentPhenomenon[] {
    return [...this.phenomena];
  }

  // ---- Overall Health ----

  /** Compute an overall civilization health score (0‑100). */
  computeHealth(): number {
    if (this.signals.length === 0) return 100;
    const recent = this.signals.slice(-200);
    let score = 100;
    for (const s of recent) {
      if (s.severity === 'critical') score -= 2;
      else if (s.severity === 'warning') score -= 0.5;
      if (s.trend === 'degrading') score -= 0.3;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ---- Snapshot ----

  getSnapshot(): CivilizationSnapshot {
    const byDomain = {} as Record<IntelligenceDomain, number>;
    for (const d of ALL_DOMAINS) byDomain[d] = 0;
    for (const s of this.signals) byDomain[s.domain] = (byDomain[s.domain] ?? 0) + 1;

    return {
      totalSignals: this.signals.length,
      byDomain,
      criticalSignals: this.getCriticalSignals().length,
      forecasts: this.forecasts.length,
      phenomena: this.phenomena.length,
      overallHealth: this.computeHealth(),
      timestamp: new Date().toISOString(),
    };
  }

  // ---- Events ----

  on(listener: (s: CivilizationSignal) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }
}
