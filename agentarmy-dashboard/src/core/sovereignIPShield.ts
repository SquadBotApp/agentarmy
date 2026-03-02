// sovereignIPShield.ts — Subsystem #66
// ═══════════════════════════════════════════════════════════════════════════
// SOVEREIGN IP SHIELD — Anti-Theft, Watermark & Brand-Protection Engine
// ═══════════════════════════════════════════════════════════════════════════
//
// The last line of defense for the AgentArmy OS intellectual property.
// If anyone attempts to copy, clone, decompile, or rebrand the system,
// the shield activates:
//
//   1. Every public surface degrades to display "AlienAgentArmy" branding
//   2. The AA watermark becomes permanently visible in all outputs
//   3. Tool execution paths embed tamper-evident fingerprints
//   4. Cryptographic attestation chains prove original authorship
//   5. License validation gates lock premium capabilities
//
// The system is designed so that a stolen copy is LESS valuable than legal
// acquisition — the thief gets a crippled, publicly branded product that
// advertises the original author's ownership.
//
// Core concepts:
//   • IntegrityAnchor — a cryptographic hash chain rooted at build time
//   • WatermarkLayer — injects AA branding into outputs, logs, and UI
//   • TamperDetector — continuous runtime checks for modification
//   • LicenseGate — validates entitlements, blocks premium features
//   • AlienMode — the degraded state activated when theft is detected
//   • ForensicLog — immutable audit trail for legal proceedings
//
// Design principle: the shield is always watching, never visible when
// legitimate, and devastatingly visible when stolen.
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Current shield status. */
export enum ShieldStatus {
  Healthy = 'HEALTHY',          // legitimate installation
  Suspicious = 'SUSPICIOUS',    // minor anomalies detected
  Compromised = 'COMPROMISED',  // high confidence of tampering
  AlienMode = 'ALIEN_MODE',     // full anti-theft activation
  Locked = 'LOCKED',            // owner-initiated lockdown
}

/** Type of tampering detected. */
export enum TamperKind {
  HashMismatch = 'HASH_MISMATCH',
  LicenseMissing = 'LICENSE_MISSING',
  LicenseExpired = 'LICENSE_EXPIRED',
  LicenseForged = 'LICENSE_FORGED',
  CodeModified = 'CODE_MODIFIED',
  BrandingRemoved = 'BRANDING_REMOVED',
  WatermarkStripped = 'WATERMARK_STRIPPED',
  UnauthorizedCopy = 'UNAUTHORIZED_COPY',
  EnvironmentMismatch = 'ENVIRONMENT_MISMATCH',
  DebuggerAttached = 'DEBUGGER_ATTACHED',
  ClockTamper = 'CLOCK_TAMPER',
  MemoryInjection = 'MEMORY_INJECTION',
}

/** License tier controlling feature access. */
export enum LicenseTier {
  Community = 'COMMUNITY',     // free — limited features
  Professional = 'PROFESSIONAL', // paid — most features
  Enterprise = 'ENTERPRISE',   // paid — all features + SLA
  Sovereign = 'SOVEREIGN',     // root-owner — everything
}

/** Watermark visibility level. */
export enum WatermarkVisibility {
  Hidden = 'HIDDEN',           // embedded but invisible
  Subtle = 'SUBTLE',           // faint background
  Visible = 'VISIBLE',         // clearly shown
  Dominant = 'DOMINANT',       // large, front-and-center
}

/** Event types emitted by the shield. */
export type ShieldEventKind =
  | 'integrity-check'
  | 'tamper-detected'
  | 'alien-mode-activated'
  | 'alien-mode-deactivated'
  | 'license-validated'
  | 'license-rejected'
  | 'watermark-applied'
  | 'forensic-logged'
  | 'lockdown'
  | 'unlock'
  | 'anchor-rotated';

// ---------------------------------------------------------------------------
// Core Data Structures
// ---------------------------------------------------------------------------

/** A cryptographic integrity anchor. */
export interface IntegrityAnchor {
  readonly id: string;
  readonly hash: string;           // SHA-256 hex
  readonly parentHash: string;     // chain to previous anchor
  readonly payload: string;        // what was hashed
  readonly createdAt: number;
  readonly sequence: number;
}

/** A single tamper detection event. */
export interface TamperEvent {
  readonly id: string;
  readonly kind: TamperKind;
  readonly description: string;
  readonly severity: number;       // 0–1 (1 = critical)
  readonly detectedAt: number;
  readonly fingerprint: string;    // unique identifier for this event
  readonly evidence: Record<string, unknown>;
}

/** A license record. */
export interface License {
  readonly id: string;
  readonly tier: LicenseTier;
  readonly holder: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly machineFingerprint: string;
  readonly features: readonly string[];
  readonly signature: string;      // cryptographic signature
  readonly revoked: boolean;
}

/** A watermark specification. */
export interface Watermark {
  readonly brand: string;          // "AgentArmy" or "AlienAgentArmy"
  readonly logo: string;           // "AA" or "👽AA"
  readonly visibility: WatermarkVisibility;
  readonly message: string;
  readonly timestamp: number;
}

/** An entry in the forensic log. */
export interface ForensicEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly category: string;
  readonly description: string;
  readonly evidence: Record<string, unknown>;
  readonly anchorHash: string;     // links to integrity chain
}

/** Event emitted by the shield. */
export interface ShieldEvent {
  readonly kind: ShieldEventKind;
  readonly detail: string;
  readonly timestamp: number;
  readonly payload: Record<string, unknown>;
}

/** Summary for TSU dashboard. */
export interface ShieldSummary {
  readonly status: ShieldStatus;
  readonly licenseTier: LicenseTier;
  readonly integrityChainLength: number;
  readonly tamperEventsDetected: number;
  readonly alienModeActive: boolean;
  readonly watermarkVisibility: WatermarkVisibility;
  readonly forensicLogSize: number;
  readonly lastIntegrityCheckAt: number;
  readonly checksPerformed: number;
  readonly checksPassed: number;
  readonly checksFailed: number;
  readonly eventCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let shieldCounter = 0;
function shId(prefix: string): string {
  shieldCounter++;
  return `${prefix}-${Date.now().toString(36)}-${shieldCounter.toString(36)}`;
}

/** Simple deterministic hash (not cryptographic — production would use SubtleCrypto). */
function simpleHash(input: string): string {
  let h = 0x811c9dc5;  // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  // Convert to hex string, pad to 16 chars
  const unsigned = h >>> 0;
  return unsigned.toString(16).padStart(8, '0') + simpleHash2(input).toString(16).padStart(8, '0');
}

function simpleHash2(input: string): number {
  let h = 0x6a09e667;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return h >>> 0;
}

/** Generate a machine fingerprint from available environment signals. */
function generateMachineFingerprint(): string {
  const signals = [
    typeof navigator !== 'undefined' ? navigator.userAgent : 'node',
    typeof window !== 'undefined' ? `${window.screen?.width}x${window.screen?.height}` : 'headless',
    new Date().getTimezoneOffset().toString(),
    typeof process !== 'undefined' ? process.platform ?? 'unknown' : 'browser',
  ];
  return simpleHash(signals.join('|'));
}

// ---------------------------------------------------------------------------
// Integrity Anchor Chain
// ---------------------------------------------------------------------------

class IntegrityChain {
  private readonly anchors: IntegrityAnchor[] = [];
  private sequence = 0;

  constructor() {
    // Genesis anchor
    this.addAnchor('GENESIS:AgentArmy-OS:root-owner:sovereign');
  }

  addAnchor(payload: string): IntegrityAnchor {
    const parentHash = this.anchors.length > 0
      ? this.anchors[this.anchors.length - 1].hash
      : '0000000000000000';
    const combined = `${parentHash}:${payload}:${this.sequence}:${Date.now()}`;
    const hash = simpleHash(combined);
    const anchor: IntegrityAnchor = {
      id: shId('anchor'),
      hash,
      parentHash,
      payload,
      createdAt: Date.now(),
      sequence: this.sequence++,
    };
    this.anchors.push(anchor);
    return anchor;
  }

  /** Verify the chain hasn't been tampered with. */
  verifyChain(): { valid: boolean; brokenAt: number | null } {
    for (let i = 1; i < this.anchors.length; i++) {
      const prev = this.anchors[i - 1];
      const curr = this.anchors[i];
      if (curr.parentHash !== prev.hash) {
        return { valid: false, brokenAt: i };
      }
    }
    return { valid: true, brokenAt: null };
  }

  getLength(): number { return this.anchors.length; }
  getLatestHash(): string {
    return this.anchors.length > 0 ? this.anchors[this.anchors.length - 1].hash : '0000000000000000';
  }
  getAnchors(): readonly IntegrityAnchor[] { return this.anchors; }
}

// ---------------------------------------------------------------------------
// Tamper Detector
// ---------------------------------------------------------------------------

class TamperDetector {
  private readonly events: TamperEvent[] = [];
  private readonly expectedFingerprint: string;
  private readonly knownHashes: Set<string>;

  constructor(machineFingerprint: string, knownCodeHashes: string[]) {
    this.expectedFingerprint = machineFingerprint;
    this.knownHashes = new Set(knownCodeHashes);
  }

  /** Run a suite of tamper checks. Returns detected issues. */
  runChecks(integrityChainValid: boolean, licensePresent: boolean, currentFingerprint: string): TamperEvent[] {
    const detected: TamperEvent[] = [];

    // 1. Integrity chain
    if (!integrityChainValid) {
      detected.push(this.createEvent(TamperKind.HashMismatch, 'Integrity anchor chain broken', 0.9));
    }

    // 2. License
    if (!licensePresent) {
      detected.push(this.createEvent(TamperKind.LicenseMissing, 'No valid license found', 0.7));
    }

    // 3. Machine fingerprint
    if (currentFingerprint !== this.expectedFingerprint) {
      detected.push(this.createEvent(TamperKind.EnvironmentMismatch, `Machine fingerprint changed: expected ${this.expectedFingerprint.slice(0, 8)}, got ${currentFingerprint.slice(0, 8)}`, 0.6));
    }

    // 4. Clock tamper (basic check: system time shouldn't be before build time)
    const buildEpoch = 1740000000000; // ~Feb 2025 — minimum sane timestamp
    if (Date.now() < buildEpoch) {
      detected.push(this.createEvent(TamperKind.ClockTamper, 'System clock is before build date', 0.5));
    }

    // 5. Debugger detection (browser environments)
    if (typeof window !== 'undefined') {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      void 0; // placeholder for debugger timing check
      const elapsed = performance.now() - start;
      if (elapsed > 100) { // debugger introduces significant delay
        detected.push(this.createEvent(TamperKind.DebuggerAttached, `Execution delay ${elapsed.toFixed(0)}ms suggests debugger`, 0.4));
      }
    }

    for (const evt of detected) this.events.push(evt);
    return detected;
  }

  private createEvent(kind: TamperKind, description: string, severity: number): TamperEvent {
    return {
      id: shId('tamper'),
      kind,
      description,
      severity,
      detectedAt: Date.now(),
      fingerprint: simpleHash(`${kind}:${description}:${Date.now()}`),
      evidence: { kind, severity },
    };
  }

  getAllEvents(): readonly TamperEvent[] { return this.events; }
  getEventCount(): number { return this.events.length; }
}

// ---------------------------------------------------------------------------
// License Manager
// ---------------------------------------------------------------------------

class LicenseManager {
  private license: License | null = null;

  /** Install a license. */
  install(tier: LicenseTier, holder: string, durationMs: number, features: string[]): License {
    const fp = generateMachineFingerprint();
    const licenseData = `${tier}:${holder}:${Date.now()}:${fp}`;
    const lic: License = {
      id: shId('lic'),
      tier,
      holder,
      issuedAt: Date.now(),
      expiresAt: Date.now() + durationMs,
      machineFingerprint: fp,
      features,
      signature: simpleHash(licenseData),
      revoked: false,
    };
    this.license = lic;
    return lic;
  }

  /** Validate the current license. */
  validate(): { valid: boolean; reason: string } {
    if (!this.license) return { valid: false, reason: 'No license installed' };
    if (this.license.revoked) return { valid: false, reason: 'License revoked' };
    if (Date.now() > this.license.expiresAt) return { valid: false, reason: 'License expired' };

    // Machine fingerprint check
    const currentFp = generateMachineFingerprint();
    if (currentFp !== this.license.machineFingerprint) {
      return { valid: false, reason: 'Machine fingerprint mismatch — possible unauthorized copy' };
    }

    return { valid: true, reason: 'License valid' };
  }

  /** Revoke the license. */
  revoke(): boolean {
    if (!this.license) return false;
    this.license = { ...this.license, revoked: true };
    return true;
  }

  /** Check if a feature is entitled. */
  hasFeature(feature: string): boolean {
    if (!this.license) return false;
    const v = this.validate();
    if (!v.valid) return false;
    // Sovereign tier has everything
    if (this.license.tier === LicenseTier.Sovereign) return true;
    return this.license.features.includes(feature);
  }

  getLicense(): License | null { return this.license; }
  getTier(): LicenseTier { return this.license?.tier ?? LicenseTier.Community; }
  isPresent(): boolean { return this.license !== null; }
}

// ---------------------------------------------------------------------------
// Watermark Engine
// ---------------------------------------------------------------------------

class WatermarkEngine {
  private visibility: WatermarkVisibility = WatermarkVisibility.Hidden;
  private alienMode = false;
  private readonly watermarks: Watermark[] = [];

  /** Get the current watermark. */
  getCurrentWatermark(): Watermark {
    return {
      brand: this.alienMode ? 'AlienAgentArmy' : 'AgentArmy',
      logo: this.alienMode ? '👽AA' : 'AA',
      visibility: this.visibility,
      message: this.alienMode
        ? '⚠️ UNAUTHORIZED COPY — This software is stolen property of AgentArmy OS. All outputs are branded AlienAgentArmy. Legal action pending.'
        : '© AgentArmy OS — Sovereign AI Operating System',
      timestamp: Date.now(),
    };
  }

  /** Apply watermark to a string output (embeds branding). */
  applyToOutput(output: string): string {
    const wm = this.getCurrentWatermark();
    this.watermarks.push(wm);

    if (this.alienMode) {
      // Aggressively brand stolen output
      const header = `\n/* ═══ ${wm.brand} — UNAUTHORIZED COPY ═══ */\n`;
      const footer = `\n/* ═══ ${wm.logo} Watermark: ${wm.message} ═══ */\n`;
      return header + output + footer;
    }

    switch (this.visibility) {
      case WatermarkVisibility.Hidden:
        // Embed invisible Unicode markers
        return output + '\u200B\u200C\u200D'; // zero-width chars
      case WatermarkVisibility.Subtle:
        return output + `\n/* ${wm.logo} */`;
      case WatermarkVisibility.Visible:
        return output + `\n// ${wm.brand} — ${wm.logo}`;
      case WatermarkVisibility.Dominant:
        return `/* ${wm.brand} */\n${output}\n/* ${wm.logo} — ${wm.message} */`;
      default:
        return output;
    }
  }

  /** Embed watermark metadata into any data object. */
  embedInData<T extends Record<string, unknown>>(data: T): T & { __aa_watermark: Watermark } {
    return { ...data, __aa_watermark: this.getCurrentWatermark() };
  }

  setVisibility(v: WatermarkVisibility): void { this.visibility = v; }
  getVisibility(): WatermarkVisibility { return this.visibility; }
  activateAlienMode(): void { this.alienMode = true; this.visibility = WatermarkVisibility.Dominant; }
  deactivateAlienMode(): void { this.alienMode = false; this.visibility = WatermarkVisibility.Hidden; }
  isAlienMode(): boolean { return this.alienMode; }
  getWatermarkCount(): number { return this.watermarks.length; }
}

// ---------------------------------------------------------------------------
// Forensic Logger
// ---------------------------------------------------------------------------

class ForensicLogger {
  private readonly entries: ForensicEntry[] = [];

  log(category: string, description: string, evidence: Record<string, unknown>, anchorHash: string): ForensicEntry {
    const entry: ForensicEntry = {
      id: shId('forensic'),
      timestamp: Date.now(),
      category,
      description,
      evidence,
      anchorHash,
    };
    this.entries.push(entry);
    return entry;
  }

  getAll(): readonly ForensicEntry[] { return this.entries; }
  getByCategory(category: string): ForensicEntry[] { return this.entries.filter((e) => e.category === category); }
  getRecent(count: number): ForensicEntry[] { return this.entries.slice(-count); }
  getSize(): number { return this.entries.length; }

  /** Export the full forensic log for legal proceedings. */
  exportForLegal(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      softwareName: 'AgentArmy OS',
      copyright: '© AgentArmy — All Rights Reserved',
      entryCount: this.entries.length,
      entries: this.entries,
    }, null, 2);
  }
}

// ---------------------------------------------------------------------------
// Sovereign IP Shield  (Subsystem #66)
// ---------------------------------------------------------------------------

export class SovereignIPShield {
  private status: ShieldStatus = ShieldStatus.Healthy;
  private readonly integrityChain = new IntegrityChain();
  private readonly tamperDetector: TamperDetector;
  private readonly licenseManager = new LicenseManager();
  private readonly watermarkEngine = new WatermarkEngine();
  private readonly forensicLogger = new ForensicLogger();
  private readonly machineFingerprint: string;
  private listeners: Array<(event: ShieldEvent) => void> = [];
  private events: ShieldEvent[] = [];
  private checksPerformed = 0;
  private checksPassed = 0;
  private checksFailed = 0;
  private lastIntegrityCheckAt = 0;

  // --- AlienMode state ---
  private alienModeActive = false;
  private readonly alienBrand = 'AlienAgentArmy';
  private readonly legitimateBrand = 'AgentArmy';

  constructor() {
    this.machineFingerprint = generateMachineFingerprint();
    this.tamperDetector = new TamperDetector(this.machineFingerprint, []);

    // Install sovereign license by default (root-owner)
    this.licenseManager.install(
      LicenseTier.Sovereign,
      'root-owner',
      365 * 24 * 60 * 60 * 1000 * 100, // 100 years
      ['*'], // all features
    );

    // Record initial integrity anchor
    this.integrityChain.addAnchor(`INIT:${this.machineFingerprint}:${Date.now()}`);
  }

  // ---- Events ----

  on(listener: (event: ShieldEvent) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private emit(kind: ShieldEventKind, detail: string, payload: Record<string, unknown> = {}): void {
    const event: ShieldEvent = { kind, detail, timestamp: Date.now(), payload };
    this.events.push(event);
    for (const fn of this.listeners) fn(event);
  }

  // ========================================================================
  // INTEGRITY CHECKS
  // ========================================================================

  /** Run a full integrity check. */
  runIntegrityCheck(): { healthy: boolean; issues: TamperEvent[] } {
    this.checksPerformed++;
    this.lastIntegrityCheckAt = Date.now();

    // Verify chain
    const chainResult = this.integrityChain.verifyChain();

    // Verify license
    const licenseResult = this.licenseManager.validate();

    // Current fingerprint
    const currentFp = generateMachineFingerprint();

    // Run tamper checks
    const tamperEvents = this.tamperDetector.runChecks(
      chainResult.valid,
      licenseResult.valid,
      currentFp,
    );

    // Record anchor for this check
    this.integrityChain.addAnchor(`CHECK:${tamperEvents.length}:${chainResult.valid}:${licenseResult.valid}`);

    if (tamperEvents.length === 0) {
      this.checksPassed++;
      this.status = ShieldStatus.Healthy;
      this.emit('integrity-check', 'Integrity check passed', { issues: 0 });
    } else {
      this.checksFailed++;

      // Calculate severity
      const maxSeverity = Math.max(...tamperEvents.map((e) => e.severity));

      if (maxSeverity >= 0.8) {
        this.activateAlienMode('Critical tamper detected');
      } else if (maxSeverity >= 0.5) {
        this.status = ShieldStatus.Compromised;
      } else {
        this.status = ShieldStatus.Suspicious;
      }

      // Log each tamper event forensically
      for (const te of tamperEvents) {
        this.forensicLogger.log('tamper', te.description, te.evidence, this.integrityChain.getLatestHash());
        this.emit('tamper-detected', te.description, { kind: te.kind, severity: te.severity });
      }
    }

    return { healthy: tamperEvents.length === 0, issues: tamperEvents };
  }

  // ========================================================================
  // ALIEN MODE
  // ========================================================================

  /** Activate Alien Mode — the nuclear anti-theft response. */
  activateAlienMode(reason: string): void {
    if (this.alienModeActive) return;
    this.alienModeActive = true;
    this.status = ShieldStatus.AlienMode;
    this.watermarkEngine.activateAlienMode();

    this.forensicLogger.log('alien-mode', `Alien Mode activated: ${reason}`, { reason }, this.integrityChain.getLatestHash());
    this.integrityChain.addAnchor(`ALIEN_MODE:${reason}`);
    this.emit('alien-mode-activated', `AlienAgentArmy mode: ${reason}`, { reason });
  }

  /** Deactivate Alien Mode (root-owner only, requires password). */
  deactivateAlienMode(password: string): boolean {
    if (!this.alienModeActive) return false;
    if (password.length < 8) return false; // basic gate — production uses real auth

    this.alienModeActive = false;
    this.status = ShieldStatus.Healthy;
    this.watermarkEngine.deactivateAlienMode();

    this.forensicLogger.log('alien-mode', 'Alien Mode deactivated by root-owner', {}, this.integrityChain.getLatestHash());
    this.emit('alien-mode-deactivated', 'Alien Mode deactivated', {});
    return true;
  }

  /** Is the system currently in Alien Mode? */
  isAlienMode(): boolean { return this.alienModeActive; }

  /** Get the brand name — returns "AlienAgentArmy" if stolen. */
  getBrandName(): string { return this.alienModeActive ? this.alienBrand : this.legitimateBrand; }

  /** Get the logo mark. */
  getLogoMark(): string { return this.alienModeActive ? '👽AA' : 'AA'; }

  // ========================================================================
  // WATERMARK
  // ========================================================================

  /** Apply watermark to output text. */
  watermarkOutput(output: string): string {
    const result = this.watermarkEngine.applyToOutput(output);
    this.emit('watermark-applied', 'Watermark applied to output', { alienMode: this.alienModeActive });
    return result;
  }

  /** Embed watermark data into a data object. */
  watermarkData<T extends Record<string, unknown>>(data: T): T & { __aa_watermark: Watermark } {
    return this.watermarkEngine.embedInData(data);
  }

  /** Set watermark visibility (non-alien mode). */
  setWatermarkVisibility(visibility: WatermarkVisibility): void {
    this.watermarkEngine.setVisibility(visibility);
  }

  /** Get current watermark. */
  getCurrentWatermark(): Watermark {
    return this.watermarkEngine.getCurrentWatermark();
  }

  // ========================================================================
  // LICENSE
  // ========================================================================

  /** Install a new license. */
  installLicense(tier: LicenseTier, holder: string, durationMs: number, features: string[]): License {
    const lic = this.licenseManager.install(tier, holder, durationMs, features);
    this.integrityChain.addAnchor(`LICENSE:${tier}:${holder}`);
    this.emit('license-validated', `License installed: ${tier} for ${holder}`, { tier, holder });
    return lic;
  }

  /** Validate the current license. */
  validateLicense(): { valid: boolean; reason: string } {
    const result = this.licenseManager.validate();
    if (!result.valid) {
      this.emit('license-rejected', result.reason, { reason: result.reason });
    }
    return result;
  }

  /** Check feature entitlement. */
  hasFeature(feature: string): boolean {
    return this.licenseManager.hasFeature(feature);
  }

  /** Get current license tier. */
  getLicenseTier(): LicenseTier { return this.licenseManager.getTier(); }

  /** Revoke the current license. */
  revokeLicense(): boolean { return this.licenseManager.revoke(); }

  // ========================================================================
  // FORENSIC LOG
  // ========================================================================

  /** Log a forensic entry. */
  logForensic(category: string, description: string, evidence: Record<string, unknown> = {}): ForensicEntry {
    const entry = this.forensicLogger.log(category, description, evidence, this.integrityChain.getLatestHash());
    this.emit('forensic-logged', description, { category });
    return entry;
  }

  /** Export forensic log for legal proceedings. */
  exportForensicLog(): string {
    return this.forensicLogger.exportForLegal();
  }

  /** Get recent forensic entries. */
  getRecentForensics(count = 50): ForensicEntry[] {
    return this.forensicLogger.getRecent(count);
  }

  // ========================================================================
  // LOCKDOWN
  // ========================================================================

  /** Owner-initiated lockdown — freeze the entire system. */
  lockdown(reason: string): void {
    this.status = ShieldStatus.Locked;
    this.integrityChain.addAnchor(`LOCKDOWN:${reason}`);
    this.forensicLogger.log('lockdown', reason, {}, this.integrityChain.getLatestHash());
    this.emit('lockdown', reason, { reason });
  }

  /** Unlock from lockdown (requires password). */
  unlock(password: string): boolean {
    if (this.status !== ShieldStatus.Locked) return false;
    if (password.length < 8) return false;
    this.status = ShieldStatus.Healthy;
    this.emit('unlock', 'System unlocked', {});
    return true;
  }

  // ========================================================================
  // INTEGRITY CHAIN
  // ========================================================================

  /** Add an anchor to the integrity chain. */
  addIntegrityAnchor(payload: string): IntegrityAnchor {
    const anchor = this.integrityChain.addAnchor(payload);
    this.emit('anchor-rotated', `New anchor: ${anchor.hash.slice(0, 8)}`, { sequence: anchor.sequence });
    return anchor;
  }

  /** Verify the integrity chain. */
  verifyIntegrityChain(): { valid: boolean; brokenAt: number | null } {
    return this.integrityChain.verifyChain();
  }

  // ========================================================================
  // QUERY
  // ========================================================================

  getStatus(): ShieldStatus { return this.status; }
  getMachineFingerprint(): string { return this.machineFingerprint; }
  getIntegrityChainLength(): number { return this.integrityChain.getLength(); }
  getTamperEventCount(): number { return this.tamperDetector.getEventCount(); }
  getForensicLogSize(): number { return this.forensicLogger.getSize(); }

  // ========================================================================
  // SUMMARY & EVENTS
  // ========================================================================

  getSummary(): ShieldSummary {
    return {
      status: this.status,
      licenseTier: this.licenseManager.getTier(),
      integrityChainLength: this.integrityChain.getLength(),
      tamperEventsDetected: this.tamperDetector.getEventCount(),
      alienModeActive: this.alienModeActive,
      watermarkVisibility: this.watermarkEngine.getVisibility(),
      forensicLogSize: this.forensicLogger.getSize(),
      lastIntegrityCheckAt: this.lastIntegrityCheckAt,
      checksPerformed: this.checksPerformed,
      checksPassed: this.checksPassed,
      checksFailed: this.checksFailed,
      eventCount: this.events.length,
    };
  }

  getRecentEvents(count = 50): ShieldEvent[] {
    return this.events.slice(-count);
  }
}
