// ---------------------------------------------------------------------------
// Void Integration Layer
// ---------------------------------------------------------------------------
// Integrates unknown, undefined, and emergent domains — the "null space"
// handler of the OS.  Detects anomalous patterns that don't fit existing
// subsystem classifications, quarantines them for analysis, and either
// absorbs them as new capabilities or safely nullifies threats.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type AnomalyClass = 'unknown-signal' | 'undefined-domain' | 'emergent-pattern' | 'null-reference' | 'void-event';
export type VoidResolution = 'absorbed' | 'nullified' | 'quarantined' | 'escalated' | 'pending';

export interface VoidAnomaly {
  readonly id: string;
  readonly anomalyClass: AnomalyClass;
  readonly source: string;
  readonly signature: string;
  readonly severity: number;           // 0 – 1
  readonly resolution: VoidResolution;
  readonly detectedAt: string;
  readonly resolvedAt: string | null;
}

export interface QuarantineZone {
  readonly id: string;
  readonly name: string;
  readonly capacity: number;
  readonly used: number;
  readonly anomalyCount: number;
  readonly createdAt: string;
}

export interface AbsorptionEvent {
  readonly id: string;
  readonly anomalyId: string;
  readonly newCapability: string;
  readonly confidence: number;         // 0 – 1
  readonly absorbedAt: string;
}

export interface NullificationEvent {
  readonly id: string;
  readonly anomalyId: string;
  readonly reason: string;
  readonly threatLevel: number;        // 0 – 1
  readonly nullifiedAt: string;
}

export interface VoidIntegrationSummary {
  readonly totalAnomalies: number;
  readonly pendingAnomalies: number;
  readonly absorbedAnomalies: number;
  readonly nullifiedAnomalies: number;
  readonly quarantinedAnomalies: number;
  readonly quarantineZones: number;
  readonly quarantineUtilisation: number;
  readonly absorptions: number;
  readonly nullifications: number;
  readonly avgSeverity: number;
}

// ---- Layer ----------------------------------------------------------------

export class VoidIntegration {
  private readonly anomalies: VoidAnomaly[] = [];
  private readonly quarantines: QuarantineZone[] = [];
  private readonly absorptions: AbsorptionEvent[] = [];
  private readonly nullifications: NullificationEvent[] = [];

  // ---- Anomaly detection --------------------------------------------------

  detectAnomaly(anomalyClass: AnomalyClass, source: string, signature: string, severity: number): VoidAnomaly {
    const anomaly: VoidAnomaly = {
      id: `va-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      anomalyClass,
      source,
      signature,
      severity: Math.max(0, Math.min(1, severity)),
      resolution: 'pending',
      detectedAt: new Date().toISOString(),
      resolvedAt: null,
    };
    this.anomalies.push(anomaly);
    return anomaly;
  }

  // ---- Quarantine ---------------------------------------------------------

  createQuarantine(name: string, capacity: number): QuarantineZone {
    const zone: QuarantineZone = {
      id: `qz-${Date.now().toString(36)}`,
      name,
      capacity,
      used: 0,
      anomalyCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.quarantines.push(zone);
    return zone;
  }

  quarantineAnomaly(anomalyId: string, zoneId: string): boolean {
    const ai = this.anomalies.findIndex((a) => a.id === anomalyId && a.resolution === 'pending');
    const zi = this.quarantines.findIndex((z) => z.id === zoneId);
    if (ai < 0 || zi < 0) return false;
    const zone = this.quarantines[zi];
    if (zone.used >= zone.capacity) return false;

    this.anomalies[ai] = { ...this.anomalies[ai], resolution: 'quarantined', resolvedAt: new Date().toISOString() };
    this.quarantines[zi] = { ...zone, used: zone.used + 1, anomalyCount: zone.anomalyCount + 1 };
    return true;
  }

  // ---- Absorption ---------------------------------------------------------

  absorb(anomalyId: string, newCapability: string, confidence: number): AbsorptionEvent | null {
    const ai = this.anomalies.findIndex((a) => a.id === anomalyId);
    if (ai < 0) return null;

    this.anomalies[ai] = { ...this.anomalies[ai], resolution: 'absorbed', resolvedAt: new Date().toISOString() };
    const ev: AbsorptionEvent = {
      id: `abs-${Date.now().toString(36)}`,
      anomalyId,
      newCapability,
      confidence: Math.max(0, Math.min(1, confidence)),
      absorbedAt: new Date().toISOString(),
    };
    this.absorptions.push(ev);
    return ev;
  }

  // ---- Nullification ------------------------------------------------------

  nullify(anomalyId: string, reason: string): NullificationEvent | null {
    const ai = this.anomalies.findIndex((a) => a.id === anomalyId);
    if (ai < 0) return null;

    const threatLevel = this.anomalies[ai].severity;
    this.anomalies[ai] = { ...this.anomalies[ai], resolution: 'nullified', resolvedAt: new Date().toISOString() };
    const ev: NullificationEvent = {
      id: `nul-${Date.now().toString(36)}`,
      anomalyId,
      reason,
      threatLevel,
      nullifiedAt: new Date().toISOString(),
    };
    this.nullifications.push(ev);
    return ev;
  }

  // ---- Escalation ---------------------------------------------------------

  escalate(anomalyId: string): boolean {
    const ai = this.anomalies.findIndex((a) => a.id === anomalyId && a.resolution === 'pending');
    if (ai < 0) return false;
    this.anomalies[ai] = { ...this.anomalies[ai], resolution: 'escalated', resolvedAt: new Date().toISOString() };
    return true;
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): VoidIntegrationSummary {
    const totalQ = this.quarantines.length;
    const totalCap = this.quarantines.reduce((s, z) => s + z.capacity, 0);
    const totalUsed = this.quarantines.reduce((s, z) => s + z.used, 0);
    const avgSev = this.anomalies.length > 0
      ? this.anomalies.reduce((s, a) => s + a.severity, 0) / this.anomalies.length
      : 0;
    return {
      totalAnomalies: this.anomalies.length,
      pendingAnomalies: this.anomalies.filter((a) => a.resolution === 'pending').length,
      absorbedAnomalies: this.anomalies.filter((a) => a.resolution === 'absorbed').length,
      nullifiedAnomalies: this.anomalies.filter((a) => a.resolution === 'nullified').length,
      quarantinedAnomalies: this.anomalies.filter((a) => a.resolution === 'quarantined').length,
      quarantineZones: totalQ,
      quarantineUtilisation: totalCap > 0 ? Number((totalUsed / totalCap).toFixed(3)) : 0,
      absorptions: this.absorptions.length,
      nullifications: this.nullifications.length,
      avgSeverity: Number(avgSev.toFixed(3)),
    };
  }
}
