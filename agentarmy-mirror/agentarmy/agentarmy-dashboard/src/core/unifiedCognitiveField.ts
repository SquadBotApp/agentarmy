// ---------------------------------------------------------------------------
// Unified Cognitive Field Layer
// ---------------------------------------------------------------------------
// Provides a shared "cognitive field" that all agents perceive — a common
// representation of attention, intent, context, and salience. Agents read
// from and write to this field to coordinate without explicit messaging.
// ---------------------------------------------------------------------------

export type CognitiveChannel =
  | 'attention'
  | 'intent'
  | 'context'
  | 'salience'
  | 'emotion'
  | 'memory'
  | 'prediction';

export interface FieldEntry {
  id: string;
  channel: CognitiveChannel;
  sourceAgent: string;
  content: string;
  intensity: number;       // 0‑1
  decay: number;           // per‑tick decay (0‑1 where 1 = never decays)
  position: FieldPosition;
  timestamp: string;
}

export interface FieldPosition {
  layer: number;           // hierarchical depth
  sector: number;          // angular sector (0‑360)
  radius: number;          // distance from center (0‑1)
}

export interface FieldQuery {
  channel?: CognitiveChannel;
  minIntensity?: number;
  maxAge?: number;
  sourceAgent?: string;
  maxResults?: number;
}

export interface FieldSnapshot {
  totalEntries: number;
  byChannel: Record<CognitiveChannel, number>;
  avgIntensity: number;
  activeAgents: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// All channels
// ---------------------------------------------------------------------------

const ALL_CHANNELS: CognitiveChannel[] = [
  'attention', 'intent', 'context', 'salience', 'emotion', 'memory', 'prediction',
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class UnifiedCognitiveField {
  private entries: FieldEntry[] = [];
  private readonly maxEntries = 20_000;
  private listeners: Array<(entry: FieldEntry) => void> = [];

  // ---- Write ----

  /** Emit a signal into the cognitive field. */
  emit(
    channel: CognitiveChannel,
    sourceAgent: string,
    content: string,
    intensity = 0.5,
    decay = 0.95,
    position?: Partial<FieldPosition>,
  ): FieldEntry {
    const entry: FieldEntry = {
      id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channel,
      sourceAgent,
      content,
      intensity: Math.max(0, Math.min(1, intensity)),
      decay,
      position: {
        layer: position?.layer ?? 0,
        sector: position?.sector ?? Math.random() * 360,
        radius: position?.radius ?? Math.random(),
      },
      timestamp: new Date().toISOString(),
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    for (const fn of this.listeners) fn(entry);
    return entry;
  }

  // ---- Read ----

  /** Query the field for entries matching criteria. */
  perceive(query: FieldQuery = {}): FieldEntry[] {
    let results = [...this.entries];

    if (query.channel) {
      results = results.filter((e) => e.channel === query.channel);
    }
    if (query.minIntensity !== undefined) {
      results = results.filter((e) => e.intensity >= (query.minIntensity ?? 0));
    }
    if (query.sourceAgent) {
      results = results.filter((e) => e.sourceAgent === query.sourceAgent);
    }
    if (query.maxAge) {
      const cutoff = new Date(Date.now() - query.maxAge).toISOString();
      results = results.filter((e) => e.timestamp >= cutoff);
    }

    // Sort by intensity desc
    results.sort((a, b) => b.intensity - a.intensity);

    return results.slice(0, query.maxResults ?? 100);
  }

  /** Get the strongest signal in a channel. */
  focus(channel: CognitiveChannel): FieldEntry | null {
    const results = this.perceive({ channel, maxResults: 1 });
    return results.length > 0 ? results[0] : null;
  }

  // ---- Decay / Tick ----

  /** Apply decay to all entries; remove those below threshold. */
  tick(removalThreshold = 0.01): number {
    let removed = 0;
    const surviving: FieldEntry[] = [];

    for (const entry of this.entries) {
      entry.intensity *= entry.decay;
      if (entry.intensity >= removalThreshold) {
        surviving.push(entry);
      } else {
        removed += 1;
      }
    }

    this.entries = surviving;
    return removed;
  }

  // ---- Salience Map ----

  /** Return intensity sums per channel — a quick salience map. */
  salienceMap(): Record<CognitiveChannel, number> {
    const map = {} as Record<CognitiveChannel, number>;
    for (const ch of ALL_CHANNELS) map[ch] = 0;
    for (const e of this.entries) {
      map[e.channel] = (map[e.channel] ?? 0) + e.intensity;
    }
    return map;
  }

  // ---- Snapshot ----

  getSnapshot(): FieldSnapshot {
    const byChannel = {} as Record<CognitiveChannel, number>;
    for (const ch of ALL_CHANNELS) byChannel[ch] = 0;
    const agents = new Set<string>();
    let intensitySum = 0;

    for (const e of this.entries) {
      byChannel[e.channel] += 1;
      agents.add(e.sourceAgent);
      intensitySum += e.intensity;
    }

    return {
      totalEntries: this.entries.length,
      byChannel,
      avgIntensity: this.entries.length > 0 ? Number((intensitySum / this.entries.length).toFixed(4)) : 0,
      activeAgents: agents.size,
      timestamp: new Date().toISOString(),
    };
  }

  // ---- Events ----

  on(listener: (entry: FieldEntry) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  // ---- Utility ----

  clear(): void {
    this.entries = [];
  }

  getEntryCount(): number {
    return this.entries.length;
  }
}
