// ---------------------------------------------------------------------------
// Inter‑Civilizational Protocol Layer  (Layer 35)
// ---------------------------------------------------------------------------
// Defines how AgentArmy interacts with other intelligence systems — human-
// built, synthetic, or emergent.  Manages universal semantic translation,
// cross-system safety negotiation, shared governance, and cooperative
// mission execution across intelligence species.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type IntelligenceKind = 'human-org' | 'synthetic-ai' | 'emergent' | 'hybrid' | 'unknown';
export type TreatyStatus = 'proposed' | 'negotiating' | 'active' | 'suspended' | 'dissolved';
export type MessagePriority = 'routine' | 'elevated' | 'urgent' | 'critical';

export interface CivilizationEntity {
  readonly id: string;
  readonly label: string;
  readonly kind: IntelligenceKind;
  readonly safetyPosture: string;
  readonly capabilities: readonly string[];
  readonly contactEndpoint: string;
  readonly registeredAt: string;
  readonly trustScore: number;   // 0 – 100
}

export interface Treaty {
  readonly id: string;
  readonly parties: readonly string[];   // civilisation entity IDs
  readonly title: string;
  readonly terms: readonly string[];
  readonly status: TreatyStatus;
  readonly proposedAt: string;
  readonly activatedAt: string | null;
  readonly expiresAt: string | null;
}

export interface DiplomaticMessage {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly priority: MessagePriority;
  readonly subject: string;
  readonly body: string;
  readonly sentAt: string;
  readonly acknowledged: boolean;
}

export interface InterCivSummary {
  readonly knownEntities: number;
  readonly byKind: Record<IntelligenceKind, number>;
  readonly activeTreaties: number;
  readonly totalTreaties: number;
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly avgTrustScore: number;
}

// ---- Layer ----------------------------------------------------------------

export class InterCivilizationalProtocol {
  private readonly entities: CivilizationEntity[] = [];
  private readonly treaties: Treaty[] = [];
  private readonly messages: DiplomaticMessage[] = [];

  // ---- Entity registration ------------------------------------------------

  registerEntity(label: string, kind: IntelligenceKind, capabilities: string[], contactEndpoint: string, safetyPosture = 'standard'): CivilizationEntity {
    const entity: CivilizationEntity = {
      id: `civ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      kind,
      safetyPosture,
      capabilities,
      contactEndpoint,
      registeredAt: new Date().toISOString(),
      trustScore: 50,
    };
    this.entities.push(entity);
    return entity;
  }

  adjustTrust(entityId: string, delta: number): boolean {
    const idx = this.entities.findIndex((e) => e.id === entityId);
    if (idx < 0) return false;
    const current = this.entities[idx];
    this.entities[idx] = { ...current, trustScore: Math.max(0, Math.min(100, current.trustScore + delta)) };
    return true;
  }

  // ---- Treaty management --------------------------------------------------

  proposeTreaty(partyIds: string[], title: string, terms: string[]): Treaty {
    const treaty: Treaty = {
      id: `trty-${Date.now().toString(36)}`,
      parties: partyIds,
      title,
      terms,
      status: 'proposed',
      proposedAt: new Date().toISOString(),
      activatedAt: null,
      expiresAt: null,
    };
    this.treaties.push(treaty);
    return treaty;
  }

  activateTreaty(treatyId: string): boolean {
    const idx = this.treaties.findIndex((t) => t.id === treatyId);
    if (idx < 0 || this.treaties[idx].status !== 'proposed' && this.treaties[idx].status !== 'negotiating') return false;
    this.treaties[idx] = { ...this.treaties[idx], status: 'active', activatedAt: new Date().toISOString() };
    return true;
  }

  suspendTreaty(treatyId: string): boolean {
    const idx = this.treaties.findIndex((t) => t.id === treatyId);
    if (idx < 0 || this.treaties[idx].status !== 'active') return false;
    this.treaties[idx] = { ...this.treaties[idx], status: 'suspended' };
    return true;
  }

  // ---- Messaging ----------------------------------------------------------

  sendMessage(from: string, to: string, subject: string, body: string, priority: MessagePriority = 'routine'): DiplomaticMessage {
    const msg: DiplomaticMessage = {
      id: `dmsg-${Date.now().toString(36)}`,
      from,
      to,
      priority,
      subject,
      body,
      sentAt: new Date().toISOString(),
      acknowledged: false,
    };
    this.messages.push(msg);
    return msg;
  }

  acknowledgeMessage(messageId: string): boolean {
    const idx = this.messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return false;
    this.messages[idx] = { ...this.messages[idx], acknowledged: true };
    return true;
  }

  // ---- Query --------------------------------------------------------------

  getEntities(): readonly CivilizationEntity[] { return this.entities; }
  getTreaties(status?: TreatyStatus): Treaty[] {
    return status ? this.treaties.filter((t) => t.status === status) : [...this.treaties];
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): InterCivSummary {
    const byKind: Record<string, number> = {};
    let trustSum = 0;
    for (const e of this.entities) {
      byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
      trustSum += e.trustScore;
    }
    const selfId = 'agentarmy';
    return {
      knownEntities: this.entities.length,
      byKind: byKind as Record<IntelligenceKind, number>,
      activeTreaties: this.treaties.filter((t) => t.status === 'active').length,
      totalTreaties: this.treaties.length,
      messagesSent: this.messages.filter((m) => m.from === selfId).length,
      messagesReceived: this.messages.filter((m) => m.to === selfId).length,
      avgTrustScore: this.entities.length > 0 ? Number((trustSum / this.entities.length).toFixed(1)) : 0,
    };
  }
}
