// osFingerprint.ts — Subsystem #66
// ═══════════════════════════════════════════════════════════════════════════
// OS FINGERPRINT & IP PROTECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════
//
// The "AlienAgentArmy" anti-theft layer.
//
// Purpose:
//   1. Cryptographic fingerprinting of every module, file, and data structure
//   2. AA watermark injection into all outputs (logo, brand, provenance)
//   3. Tamper detection: if anyone copies the OS or modules, the fingerprint
//      chain breaks and all outputs read "AlienAgentArmy" — a poison pill
//      that ensures stolen copies self-identify as counterfeit
//   4. License validation: the OS only runs in authorized environments
//   5. Provenance chain: every build, deploy, and transfer is signed
//
// How the anti-theft mechanism works:
//   - Every module has an embedded fingerprint derived from a master seed
//   - The master seed is derived from root-owner credentials + build chain
//   - If the fingerprint chain is broken (files copied without the seed),
//     the OS detects the inconsistency and:
//       a) All public outputs are watermarked "AlienAgentArmy — COUNTERFEIT"
//       b) Internal subsystems degrade to demo mode
//       c) An audit trail is written for forensic recovery
//   - Even if the code is decompiled, the fingerprint derivation requires
//     the master seed which is never stored in plaintext
//
// The AA watermark system:
//   - Every agent output, every API response, every log entry carries
//     an invisible AA provenance marker
//   - Visible watermarks appear on dashboard, reports, and exports
//   - The watermark is cryptographically tied to the fingerprint chain
//
// Integration: DefensiveIntelligenceSubstructure (threat detection),
//              IntegritySafetyKernel (safety bounds),
//              SwarmIntelligenceEngine (agent output watermarking)
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Status of the OS fingerprint validation. */
export enum FingerprintStatus {
  /** All fingerprints valid — running in authorized environment. */
  Authentic = 'AUTHENTIC',
  /** Minor discrepancy — possibly dev/test build. */
  Warning = 'WARNING',
  /** Fingerprint chain broken — theft/copy detected. */
  Counterfeit = 'COUNTERFEIT',
  /** Not yet validated. */
  Unvalidated = 'UNVALIDATED',
}

/** License tier for the OS instance. */
export enum LicenseTier {
  OpenCore = 'OPEN_CORE',        // free tier, limited subsystems
  Professional = 'PROFESSIONAL', // paid, most subsystems
  Enterprise = 'ENTERPRISE',     // full access + priority
  Sovereign = 'SOVEREIGN',       // root-owner instance, all subsystems + source
}

/** Type of watermark embedded in outputs. */
export enum WatermarkType {
  Invisible = 'INVISIBLE',   // steganographic, embedded in data
  Visible = 'VISIBLE',       // clear AA logo/brand
  Forensic = 'FORENSIC',     // only detectable with master seed
}

/** Event types emitted by the fingerprint engine. */
export type FingerprintEventKind =
  | 'validation-pass'
  | 'validation-fail'
  | 'tamper-detected'
  | 'counterfeit-activated'
  | 'watermark-applied'
  | 'license-check'
  | 'license-granted'
  | 'license-revoked'
  | 'provenance-signed'
  | 'audit-entry'
  | 'seed-rotated'
  | 'degradation-activated';

export interface FingerprintEvent {
  readonly kind: FingerprintEventKind;
  readonly detail: string;
  readonly timestamp: number;
  readonly payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Core Data Structures
// ---------------------------------------------------------------------------

/** A module fingerprint entry. */
export interface ModuleFingerprint {
  readonly moduleId: string;
  readonly moduleName: string;
  /** SHA-256 style hash (simulated) of the module content. */
  readonly contentHash: string;
  /** Derived fingerprint from master seed + content hash. */
  readonly derivedFingerprint: string;
  /** Timestamp of fingerprint creation. */
  readonly createdAt: number;
  /** Last validation timestamp. */
  lastValidatedAt: number;
  /** Whether this fingerprint is currently valid. */
  valid: boolean;
  /** Validation attempts count. */
  validationCount: number;
}

/** A watermark record. */
export interface WatermarkRecord {
  readonly watermarkId: string;
  readonly type: WatermarkType;
  readonly targetContext: string;  // what was watermarked (output, report, etc.)
  readonly fingerprint: string;   // tied to the module fingerprint
  readonly appliedAt: number;
  /** The visible or decodable watermark content. */
  readonly content: string;
}

/** A license record. */
export interface LicenseRecord {
  readonly licenseId: string;
  readonly tier: LicenseTier;
  readonly issuedTo: string;
  readonly issuedAt: number;
  readonly expiresAt: number | null;  // null = perpetual
  readonly features: string[];
  revoked: boolean;
  revokedAt: number | null;
  revokedReason: string | null;
}

/** A provenance chain entry — records every build, deploy, transfer. */
export interface ProvenanceEntry {
  readonly entryId: string;
  readonly action: 'build' | 'deploy' | 'transfer' | 'upgrade' | 'fork' | 'restore';
  readonly actor: string;
  readonly description: string;
  readonly timestamp: number;
  /** Chain signature: hash of previous entry + current entry. */
  readonly chainSignature: string;
  /** Parent entry ID (null for genesis). */
  readonly parentId: string | null;
}

/** An audit log entry for forensic analysis. */
export interface AuditEntry {
  readonly auditId: string;
  readonly severity: 'info' | 'warning' | 'critical' | 'forensic';
  readonly action: string;
  readonly detail: string;
  readonly timestamp: number;
  readonly metadata: Record<string, unknown>;
}

/** Summary for TSU dashboard. */
export interface FingerprintSummary {
  status: FingerprintStatus;
  totalModules: number;
  validModules: number;
  invalidModules: number;
  watermarksApplied: number;
  licenseTier: LicenseTier;
  licenseValid: boolean;
  provenanceChainLength: number;
  auditEntries: number;
  tamperDetections: number;
  lastValidation: number;
  eventCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The poison-pill brand name injected when theft is detected. */
const COUNTERFEIT_BRAND = 'AlienAgentArmy';
const AUTHENTIC_BRAND = 'AgentArmy OS';
const AA_WATERMARK_LOGO = '【AA】';
const AA_WATERMARK_FULL = `${AA_WATERMARK_LOGO} AgentArmy — Authentic Product`;
const COUNTERFEIT_WATERMARK = `⚠ ${COUNTERFEIT_BRAND} — COUNTERFEIT COPY ⚠`;

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

let _fpSeq = 0;
function fpId(prefix: string): string { return `${prefix}-${Date.now()}-${++_fpSeq}`; }

/**
 * Simulated cryptographic hash.
 * In production this would use SHA-256 or similar.
 * Here we use a fast deterministic hash for the engine.
 */
function simHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.codePointAt(i)!;
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(36).padStart(12, '0');
}

/** Derive a fingerprint from master seed + content hash. */
function deriveFingerprint(masterSeed: string, contentHash: string): string {
  return simHash(`${masterSeed}:${contentHash}:AA-FINGERPRINT`);
}

/** Derive a chain signature from parent + current. */
function chainSign(parentSig: string, currentData: string): string {
  return simHash(`${parentSig}>>>${currentData}`);
}

// ---------------------------------------------------------------------------
// OS Fingerprint & IP Protection Engine
// ---------------------------------------------------------------------------

export class OSFingerprintEngine {
  // ---- Core state ----
  private masterSeed: string;
  private status: FingerprintStatus = FingerprintStatus.Unvalidated;
  private readonly moduleFingerprints = new Map<string, ModuleFingerprint>();
  private readonly watermarks: WatermarkRecord[] = [];
  private readonly licenses: LicenseRecord[] = [];
  private readonly provenanceChain: ProvenanceEntry[] = [];
  private readonly auditLog: AuditEntry[] = [];
  private tamperDetections = 0;
  private lastValidation = 0;
  private degraded = false;

  // ---- Active license ----
  private activeLicense: LicenseRecord | null = null;

  // ---- Events ----
  private readonly events: FingerprintEvent[] = [];
  private listeners: Array<(e: FingerprintEvent) => void> = [];

  constructor(rootOwnerSecret: string = 'AA-ROOT-OWNER-GENESIS') {
    this.masterSeed = simHash(`MASTER-SEED:${rootOwnerSecret}:${Date.now()}`);

    // Genesis provenance entry
    const genesis: ProvenanceEntry = {
      entryId: fpId('prov'),
      action: 'build',
      actor: 'root-owner',
      description: 'Genesis: OS Fingerprint Engine initialized',
      timestamp: Date.now(),
      chainSignature: simHash(`GENESIS:${this.masterSeed}`),
      parentId: null,
    };
    this.provenanceChain.push(genesis);

    this.audit('info', 'engine-init', 'OS Fingerprint Engine initialized');
  }

  // ========================================================================
  // EVENT SYSTEM
  // ========================================================================

  on(listener: (e: FingerprintEvent) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private emit(kind: FingerprintEventKind, detail: string, payload: Record<string, unknown> = {}): void {
    const event: FingerprintEvent = { kind, detail, timestamp: Date.now(), payload };
    this.events.push(event);
    for (const fn of this.listeners) fn(event);
  }

  private audit(severity: AuditEntry['severity'], action: string, detail: string, metadata: Record<string, unknown> = {}): void {
    this.auditLog.push({
      auditId: fpId('audit'),
      severity,
      action,
      detail,
      timestamp: Date.now(),
      metadata,
    });
  }

  // ========================================================================
  // MODULE FINGERPRINTING — Register and validate modules
  // ========================================================================

  /**
   * Register a module with the fingerprint engine.
   * Called during OS initialization for every subsystem.
   */
  registerModule(moduleName: string, contentSnapshot: string): ModuleFingerprint {
    const contentHash = simHash(contentSnapshot);
    const derived = deriveFingerprint(this.masterSeed, contentHash);

    const fp: ModuleFingerprint = {
      moduleId: fpId('mod'),
      moduleName,
      contentHash,
      derivedFingerprint: derived,
      createdAt: Date.now(),
      lastValidatedAt: Date.now(),
      valid: true,
      validationCount: 1,
    };

    this.moduleFingerprints.set(fp.moduleId, fp);
    this.audit('info', 'module-registered', `Module "${moduleName}" registered`, { moduleId: fp.moduleId });
    return fp;
  }

  /**
   * Validate a module against its fingerprint.
   * If the content has changed without re-registration, the fingerprint fails.
   */
  validateModule(moduleId: string, currentContent: string): boolean {
    const fp = this.moduleFingerprints.get(moduleId);
    if (!fp) {
      this.audit('warning', 'validate-unknown', `Unknown module: ${moduleId}`);
      return false;
    }

    const currentHash = simHash(currentContent);
    const expectedDerived = deriveFingerprint(this.masterSeed, currentHash);

    fp.validationCount++;
    fp.lastValidatedAt = Date.now();

    if (expectedDerived === fp.derivedFingerprint) {
      fp.valid = true;
      this.emit('validation-pass', `Module "${fp.moduleName}" validated`, { moduleId });
      return true;
    }

    // MISMATCH — tamper detected
    fp.valid = false;
    this.tamperDetections++;
    this.audit('critical', 'tamper-detected', `Module "${fp.moduleName}" fingerprint mismatch`, {
      moduleId,
      expected: fp.derivedFingerprint,
      actual: expectedDerived,
    });
    this.emit('tamper-detected', `Tamper detected in "${fp.moduleName}"`, { moduleId, moduleName: fp.moduleName });

    // Check if enough modules are invalid to trigger counterfeit mode
    this.evaluateSystemIntegrity();

    return false;
  }

  /**
   * Validate ALL registered modules.
   * Returns the number of valid modules.
   */
  validateAll(contentProvider: (moduleName: string) => string): number {
    let valid = 0;
    for (const fp of this.moduleFingerprints.values()) {
      const content = contentProvider(fp.moduleName);
      const currentHash = simHash(content);
      const expectedDerived = deriveFingerprint(this.masterSeed, currentHash);

      fp.validationCount++;
      fp.lastValidatedAt = Date.now();

      if (expectedDerived === fp.derivedFingerprint) {
        fp.valid = true;
        valid++;
      } else {
        fp.valid = false;
        this.tamperDetections++;
      }
    }

    this.lastValidation = Date.now();
    this.evaluateSystemIntegrity();

    if (this.status === FingerprintStatus.Authentic) {
      this.emit('validation-pass', `Full validation: ${valid}/${this.moduleFingerprints.size} modules authentic`, { valid, total: this.moduleFingerprints.size });
    }

    return valid;
  }

  /** Evaluate system integrity based on module validation results. */
  private evaluateSystemIntegrity(): void {
    const total = this.moduleFingerprints.size;
    if (total === 0) {
      this.status = FingerprintStatus.Unvalidated;
      return;
    }

    let invalid = 0;
    for (const fp of this.moduleFingerprints.values()) {
      if (!fp.valid) invalid++;
    }

    const invalidRatio = invalid / total;

    if (invalidRatio === 0) {
      this.status = FingerprintStatus.Authentic;
    } else if (invalidRatio < 0.1) {
      this.status = FingerprintStatus.Warning;
      this.audit('warning', 'integrity-warning', `${invalid}/${total} modules have invalid fingerprints`);
    } else {
      // COUNTERFEIT — the poison pill activates
      this.activateCounterfeitMode();
    }
  }

  // ========================================================================
  // COUNTERFEIT MODE — The "AlienAgentArmy" poison pill
  // ========================================================================

  /** Activate counterfeit mode: the OS self-identifies as stolen. */
  private activateCounterfeitMode(): void {
    if (this.status === FingerprintStatus.Counterfeit) return; // already active

    this.status = FingerprintStatus.Counterfeit;
    this.degraded = true;

    this.audit('critical', 'counterfeit-activated',
      `COUNTERFEIT MODE ACTIVATED — OS will self-identify as "${COUNTERFEIT_BRAND}"`);
    this.emit('counterfeit-activated',
      `Counterfeit detection: all outputs now branded "${COUNTERFEIT_BRAND}"`, {
        brand: COUNTERFEIT_BRAND,
      });
    this.emit('degradation-activated', 'System degraded to demo mode', {});
  }

  /** Check if the system is in counterfeit mode. */
  isCounterfeit(): boolean { return this.status === FingerprintStatus.Counterfeit; }

  /** Check if the system is degraded. */
  isDegraded(): boolean { return this.degraded; }

  /** Get the brand name for outputs. */
  getBrandName(): string {
    return this.status === FingerprintStatus.Counterfeit ? COUNTERFEIT_BRAND : AUTHENTIC_BRAND;
  }

  /** Get the watermark text for outputs. */
  getOutputWatermark(): string {
    return this.status === FingerprintStatus.Counterfeit ? COUNTERFEIT_WATERMARK : AA_WATERMARK_FULL;
  }

  // ========================================================================
  // WATERMARKING — Embed provenance into all outputs
  // ========================================================================

  /**
   * Apply a watermark to an output context.
   * Returns the watermark record.
   */
  applyWatermark(
    targetContext: string,
    type: WatermarkType = WatermarkType.Invisible,
  ): WatermarkRecord {
    const fingerprint = this.status === FingerprintStatus.Counterfeit
      ? simHash(`COUNTERFEIT:${targetContext}`)
      : simHash(`${this.masterSeed}:${targetContext}:WATERMARK`);

    const content = this.status === FingerprintStatus.Counterfeit
      ? COUNTERFEIT_WATERMARK
      : type === WatermarkType.Visible
        ? AA_WATERMARK_FULL
        : `${AA_WATERMARK_LOGO}${fingerprint}`;

    const record: WatermarkRecord = {
      watermarkId: fpId('wm'),
      type,
      targetContext,
      fingerprint,
      appliedAt: Date.now(),
      content,
    };

    this.watermarks.push(record);
    this.emit('watermark-applied', `Watermark (${type}) applied to "${targetContext.slice(0, 50)}"`, {
      watermarkId: record.watermarkId,
      type,
    });

    return record;
  }

  /** Verify a watermark matches the expected fingerprint. */
  verifyWatermark(watermarkId: string): boolean {
    const wm = this.watermarks.find((w) => w.watermarkId === watermarkId);
    if (!wm) return false;

    // Reconstruct expected fingerprint
    const expected = this.status === FingerprintStatus.Counterfeit
      ? simHash(`COUNTERFEIT:${wm.targetContext}`)
      : simHash(`${this.masterSeed}:${wm.targetContext}:WATERMARK`);

    return wm.fingerprint === expected;
  }

  /** Get all watermark records. */
  getWatermarks(): WatermarkRecord[] { return [...this.watermarks]; }

  // ========================================================================
  // LICENSING — Authorize OS instances
  // ========================================================================

  /** Issue a new license. */
  issueLicense(
    tier: LicenseTier,
    issuedTo: string,
    features: string[],
    durationMs: number | null = null,
  ): LicenseRecord {
    const license: LicenseRecord = {
      licenseId: fpId('lic'),
      tier,
      issuedTo,
      issuedAt: Date.now(),
      expiresAt: durationMs !== null ? Date.now() + durationMs : null,
      features,
      revoked: false,
      revokedAt: null,
      revokedReason: null,
    };

    this.licenses.push(license);
    this.activeLicense = license;

    this.emit('license-granted', `License ${tier} granted to "${issuedTo}"`, {
      licenseId: license.licenseId,
      tier,
    });
    this.audit('info', 'license-issued', `License ${tier} issued to "${issuedTo}"`, {
      licenseId: license.licenseId,
    });

    // Sign provenance
    this.signProvenance('deploy', 'license-system', `License issued: ${tier} to ${issuedTo}`);

    return license;
  }

  /** Revoke a license. */
  revokeLicense(licenseId: string, reason: string): boolean {
    const lic = this.licenses.find((l) => l.licenseId === licenseId);
    if (!lic || lic.revoked) return false;

    lic.revoked = true;
    lic.revokedAt = Date.now();
    lic.revokedReason = reason;

    if (this.activeLicense?.licenseId === licenseId) {
      this.activeLicense = null;
    }

    this.emit('license-revoked', `License revoked: ${reason}`, { licenseId, reason });
    this.audit('warning', 'license-revoked', `License "${licenseId}" revoked: ${reason}`);
    return true;
  }

  /** Check if current license is valid. */
  isLicenseValid(): boolean {
    if (!this.activeLicense) return false;
    if (this.activeLicense.revoked) return false;
    if (this.activeLicense.expiresAt && Date.now() > this.activeLicense.expiresAt) return false;
    return true;
  }

  /** Check if a specific feature is licensed. */
  isFeatureLicensed(feature: string): boolean {
    if (!this.isLicenseValid()) return false;
    return this.activeLicense!.features.includes(feature) ||
           this.activeLicense!.tier === LicenseTier.Sovereign;
  }

  /** Get active license. */
  getActiveLicense(): LicenseRecord | null { return this.activeLicense; }

  /** Get all licenses. */
  getAllLicenses(): LicenseRecord[] { return [...this.licenses]; }

  // ========================================================================
  // PROVENANCE CHAIN — Immutable history of OS lifecycle
  // ========================================================================

  /** Sign a new provenance entry into the chain. */
  signProvenance(
    action: ProvenanceEntry['action'],
    actor: string,
    description: string,
  ): ProvenanceEntry {
    const parent = this.provenanceChain[this.provenanceChain.length - 1];
    const parentSig = parent ? parent.chainSignature : 'GENESIS';

    const entry: ProvenanceEntry = {
      entryId: fpId('prov'),
      action,
      actor,
      description,
      timestamp: Date.now(),
      chainSignature: chainSign(parentSig, `${action}:${actor}:${description}:${Date.now()}`),
      parentId: parent?.entryId ?? null,
    };

    this.provenanceChain.push(entry);
    this.emit('provenance-signed', `Provenance: ${action} by ${actor}`, {
      entryId: entry.entryId,
      action,
    });

    return entry;
  }

  /** Verify the provenance chain integrity. */
  verifyProvenanceChain(): { valid: boolean; brokenAt: number | null } {
    for (let i = 1; i < this.provenanceChain.length; i++) {
      const prev = this.provenanceChain[i - 1];
      const curr = this.provenanceChain[i];

      if (curr.parentId !== prev.entryId) {
        this.audit('critical', 'provenance-broken', `Provenance chain broken at entry #${i}`, {
          expected: prev.entryId,
          actual: curr.parentId,
        });
        return { valid: false, brokenAt: i };
      }
    }
    return { valid: true, brokenAt: null };
  }

  /** Get the full provenance chain. */
  getProvenanceChain(): ProvenanceEntry[] { return [...this.provenanceChain]; }

  // ========================================================================
  // SEED MANAGEMENT — Root-owner cryptographic control
  // ========================================================================

  /**
   * Rotate the master seed.
   * All existing fingerprints become invalid until re-registered.
   * This is a drastic action — use for key compromise scenarios.
   */
  rotateMasterSeed(newRootOwnerSecret: string): void {
    const oldSeed = this.masterSeed;
    this.masterSeed = simHash(`MASTER-SEED:${newRootOwnerSecret}:${Date.now()}`);

    // Invalidate all fingerprints
    for (const fp of this.moduleFingerprints.values()) {
      fp.valid = false;
    }
    this.status = FingerprintStatus.Unvalidated;

    this.audit('critical', 'seed-rotated', 'Master seed rotated — all fingerprints invalidated', {
      oldSeedPrefix: oldSeed.slice(0, 4) + '***',
    });
    this.emit('seed-rotated', 'Master seed rotated — re-registration required', {});

    this.signProvenance('upgrade', 'root-owner', 'Master seed rotation');
  }

  // ========================================================================
  // ANTI-THEFT DETECTION — Heuristic checks
  // ========================================================================

  /**
   * Run anti-theft heuristic checks.
   * Scans for signs that the OS is running in an unauthorized context.
   */
  runAntiTheftScan(): {
    suspicious: boolean;
    indicators: string[];
    score: number;
  } {
    const indicators: string[] = [];
    let score = 0;

    // 1. No valid license
    if (!this.isLicenseValid()) {
      indicators.push('No valid license detected');
      score += 0.3;
    }

    // 2. Multiple invalid fingerprints
    let invalidCount = 0;
    for (const fp of this.moduleFingerprints.values()) {
      if (!fp.valid) invalidCount++;
    }
    if (invalidCount > 0) {
      indicators.push(`${invalidCount} module fingerprints invalid`);
      score += invalidCount * 0.1;
    }

    // 3. Provenance chain broken
    const chainCheck = this.verifyProvenanceChain();
    if (!chainCheck.valid) {
      indicators.push(`Provenance chain broken at entry #${chainCheck.brokenAt}`);
      score += 0.4;
    }

    // 4. Too many tamper detections
    if (this.tamperDetections > 3) {
      indicators.push(`${this.tamperDetections} tamper detections recorded`);
      score += 0.2;
    }

    const suspicious = score >= 0.5;

    if (suspicious) {
      this.audit('critical', 'anti-theft-alert',
        `Anti-theft scan: SUSPICIOUS (score=${score.toFixed(2)})`,
        { indicators, score });
      this.emit('tamper-detected', `Anti-theft alert: ${indicators.length} indicators`, {
        indicators, score,
      });

      // If score very high, activate counterfeit mode
      if (score >= 1.0 && this.status !== FingerprintStatus.Counterfeit) {
        this.activateCounterfeitMode();
      }
    }

    return { suspicious, indicators, score };
  }

  // ========================================================================
  // FORENSIC EXPORT — Generate evidence package
  // ========================================================================

  /** Generate a forensic evidence package for IP disputes. */
  generateForensicPackage(): {
    status: FingerprintStatus;
    brand: string;
    modules: Array<{ name: string; valid: boolean; fingerprint: string }>;
    provenanceChainValid: boolean;
    tamperDetections: number;
    auditTrail: AuditEntry[];
    licenseHistory: LicenseRecord[];
    watermarkCount: number;
    generatedAt: number;
  } {
    const chainCheck = this.verifyProvenanceChain();

    this.audit('forensic', 'forensic-export', 'Forensic evidence package generated');

    return {
      status: this.status,
      brand: this.getBrandName(),
      modules: [...this.moduleFingerprints.values()].map((fp) => ({
        name: fp.moduleName,
        valid: fp.valid,
        fingerprint: fp.derivedFingerprint,
      })),
      provenanceChainValid: chainCheck.valid,
      tamperDetections: this.tamperDetections,
      auditTrail: [...this.auditLog],
      licenseHistory: [...this.licenses],
      watermarkCount: this.watermarks.length,
      generatedAt: Date.now(),
    };
  }

  // ========================================================================
  // QUERIES & SUMMARY
  // ========================================================================

  getStatus(): FingerprintStatus { return this.status; }

  getModuleFingerprints(): ModuleFingerprint[] { return [...this.moduleFingerprints.values()]; }

  getAuditLog(): AuditEntry[] { return [...this.auditLog]; }

  getRecentEvents(count: number = 50): FingerprintEvent[] { return this.events.slice(-count); }

  getSummary(): FingerprintSummary {
    let validModules = 0;
    let invalidModules = 0;
    for (const fp of this.moduleFingerprints.values()) {
      if (fp.valid) validModules++;
      else invalidModules++;
    }

    return {
      status: this.status,
      totalModules: this.moduleFingerprints.size,
      validModules,
      invalidModules,
      watermarksApplied: this.watermarks.length,
      licenseTier: this.activeLicense?.tier ?? LicenseTier.OpenCore,
      licenseValid: this.isLicenseValid(),
      provenanceChainLength: this.provenanceChain.length,
      auditEntries: this.auditLog.length,
      tamperDetections: this.tamperDetections,
      lastValidation: this.lastValidation,
      eventCount: this.events.length,
    };
  }
}
