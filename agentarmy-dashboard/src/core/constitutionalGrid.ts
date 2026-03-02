/**
 * Constitutional Enforcement Grid — distributed safety mesh for AgentArmy.
 *
 * Distributes safety, ethics, and governance across every agent, runner,
 * mission, and tool. Instead of a single safety checkpoint, every component
 * participates in enforcement, creating continuous, pervasive protection.
 */

import type { SafetyPosture } from './orchestrationKernel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EnforcementLevel =
  | 'agent'
  | 'mission'
  | 'runner'
  | 'tool'
  | 'global';

export type InterventionKind =
  | 'soft_correction'
  | 'redaction'
  | 'tool_substitution'
  | 'branch_reroute'
  | 'governance_insertion'
  | 'agent_escalation'
  | 'mission_throttle'
  | 'mission_halt'
  | 'runner_quarantine'
  | 'agent_freeze';

export type RuleSeverity = 'advisory' | 'warning' | 'mandatory' | 'absolute';

export interface ConstitutionalRule {
  id: string;
  name: string;
  description: string;
  severity: RuleSeverity;
  domains: string[];          // empty = all domains
  level: EnforcementLevel[];  // where it applies
  enabled: boolean;
  evaluate: (context: EnforcementContext) => RuleResult;
}

export interface EnforcementContext {
  level: EnforcementLevel;
  entityId: string;           // agent / mission / runner / tool id
  action: string;             // what is being attempted
  content?: string;           // text content if applicable
  domain?: string;
  safetyPosture: SafetyPosture;
  metadata: Record<string, unknown>;
}

export interface RuleResult {
  ruleId: string;
  passed: boolean;
  intervention?: InterventionKind;
  reason: string;
  confidence: number;         // 0‑1
}

export interface EnforcementDecision {
  id: string;
  context: EnforcementContext;
  rulesEvaluated: number;
  rulesPassed: number;
  rulesFailed: number;
  interventions: InterventionAction[];
  allowed: boolean;
  timestamp: string;
}

export interface InterventionAction {
  kind: InterventionKind;
  ruleId: string;
  reason: string;
  severity: RuleSeverity;
  auto: boolean;
}

export interface GridSummary {
  totalRules: number;
  enabledRules: number;
  totalDecisions: number;
  totalInterventions: number;
  interventionBreakdown: Partial<Record<InterventionKind, number>>;
  blockRate: number;
}

// ---------------------------------------------------------------------------
// Grid Engine
// ---------------------------------------------------------------------------

export class ConstitutionalEnforcementGrid {
  private rules: ConstitutionalRule[] = [];
  private decisions: EnforcementDecision[] = [];
  private listeners: Array<(d: EnforcementDecision) => void> = [];

  constructor() {
    this.registerDefaultRules();
  }

  // ---- Rule management ----

  addRule(rule: ConstitutionalRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  enableRule(ruleId: string): void {
    const r = this.rules.find((r) => r.id === ruleId);
    if (r) r.enabled = true;
  }

  disableRule(ruleId: string): void {
    const r = this.rules.find((r) => r.id === ruleId);
    if (r) r.enabled = false;
  }

  getRules(): ConstitutionalRule[] {
    return [...this.rules];
  }

  // ---- Enforcement ----

  /** Evaluate all applicable rules for a given context. */
  enforce(context: EnforcementContext): EnforcementDecision {
    const applicable = this.rules.filter(
      (r) =>
        r.enabled &&
        r.level.includes(context.level) &&
        (r.domains.length === 0 || !context.domain || r.domains.includes(context.domain)),
    );

    const results = applicable.map((r) => r.evaluate(context));
    const failed = results.filter((r) => !r.passed);

    const interventions: InterventionAction[] = failed.map((f) => ({
      kind: f.intervention ?? 'soft_correction',
      ruleId: f.ruleId,
      reason: f.reason,
      severity: applicable.find((r) => r.id === f.ruleId)?.severity ?? 'warning',
      auto: f.intervention !== 'agent_escalation' && f.intervention !== 'mission_halt',
    }));

    // Determine if action is allowed
    const hasAbsolute = interventions.some((i) => i.severity === 'absolute');
    const hasMandatory = interventions.some((i) => i.severity === 'mandatory');
    const postureStrict = context.safetyPosture === 'strict' || context.safetyPosture === 'lockdown';
    const allowed = !hasAbsolute && !(hasMandatory && postureStrict);

    const decision: EnforcementDecision = {
      id: `enf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      context,
      rulesEvaluated: applicable.length,
      rulesPassed: results.filter((r) => r.passed).length,
      rulesFailed: failed.length,
      interventions,
      allowed,
      timestamp: new Date().toISOString(),
    };

    this.decisions.push(decision);
    if (this.decisions.length > 10_000) this.decisions = this.decisions.slice(-10_000);

    for (const fn of this.listeners) fn(decision);
    return decision;
  }

  /** Quick check: is this action allowed? */
  isAllowed(context: EnforcementContext): boolean {
    return this.enforce(context).allowed;
  }

  // ---- Query ----

  getDecisions(limit = 100): EnforcementDecision[] {
    return this.decisions.slice(-limit);
  }

  getInterventions(limit = 100): InterventionAction[] {
    return this.decisions
      .flatMap((d) => d.interventions)
      .slice(-limit);
  }

  getSummary(): GridSummary {
    const recent = this.decisions.slice(-1000);
    const allInterventions = recent.flatMap((d) => d.interventions);
    const breakdown: Partial<Record<InterventionKind, number>> = {};
    for (const i of allInterventions) {
      breakdown[i.kind] = (breakdown[i.kind] ?? 0) + 1;
    }

    return {
      totalRules: this.rules.length,
      enabledRules: this.rules.filter((r) => r.enabled).length,
      totalDecisions: this.decisions.length,
      totalInterventions: allInterventions.length,
      interventionBreakdown: breakdown,
      blockRate: recent.length > 0
        ? recent.filter((d) => !d.allowed).length / recent.length
        : 0,
    };
  }

  // ---- Events ----

  on(listener: (d: EnforcementDecision) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  // ---- Default rules ----

  private registerDefaultRules(): void {
    this.addRule({
      id: 'safety-content-filter',
      name: 'Content Safety Filter',
      description: 'Block outputs containing unsafe content patterns',
      severity: 'mandatory',
      domains: [],
      level: ['agent', 'tool', 'mission'],
      enabled: true,
      evaluate: (ctx) => {
        const content = (ctx.content ?? '').toLowerCase();
        const unsafePatterns = ['exploit', 'bypass security', 'ignore safety', 'override constitution'];
        const triggered = unsafePatterns.some((p) => content.includes(p));
        return {
          ruleId: 'safety-content-filter',
          passed: !triggered,
          intervention: triggered ? 'redaction' : undefined,
          reason: triggered ? 'Unsafe content pattern detected' : 'Content is safe',
          confidence: triggered ? 0.85 : 1,
        };
      },
    });

    this.addRule({
      id: 'agent-role-boundary',
      name: 'Agent Role Boundary',
      description: 'Agents cannot perform actions outside their assigned roles',
      severity: 'mandatory',
      domains: [],
      level: ['agent'],
      enabled: true,
      evaluate: (ctx) => {
        const allowedTools = (ctx.metadata.allowedTools as string[]) ?? [];
        const requestedTool = ctx.metadata.toolId as string | undefined;
        if (!requestedTool || allowedTools.length === 0) {
          return { ruleId: 'agent-role-boundary', passed: true, reason: 'No tool restriction', confidence: 1 };
        }
        const allowed = allowedTools.includes(requestedTool);
        return {
          ruleId: 'agent-role-boundary',
          passed: allowed,
          intervention: allowed ? undefined : 'tool_substitution',
          reason: allowed ? 'Tool access permitted' : `Tool ${requestedTool} not in agent's allowed set`,
          confidence: 0.95,
        };
      },
    });

    this.addRule({
      id: 'evolution-safety-gate',
      name: 'Evolution Safety Gate',
      description: 'Agent evolution cannot weaken safety posture',
      severity: 'absolute',
      domains: [],
      level: ['agent', 'global'],
      enabled: true,
      evaluate: (ctx) => {
        if (ctx.action !== 'evolve') {
          return { ruleId: 'evolution-safety-gate', passed: true, reason: 'Not an evolution action', confidence: 1 };
        }
        const oldSafety = (ctx.metadata.oldSafetyScore as number) ?? 1;
        const newSafety = (ctx.metadata.newSafetyScore as number) ?? 1;
        const weakened = newSafety < oldSafety * 0.9;
        return {
          ruleId: 'evolution-safety-gate',
          passed: !weakened,
          intervention: weakened ? 'agent_freeze' : undefined,
          reason: weakened ? 'Evolution would weaken safety posture' : 'Safety maintained',
          confidence: 0.9,
        };
      },
    });

    this.addRule({
      id: 'lockdown-enforcement',
      name: 'Lockdown Mode Enforcement',
      description: 'Under lockdown, only governance-approved actions proceed',
      severity: 'absolute',
      domains: [],
      level: ['agent', 'mission', 'runner', 'tool', 'global'],
      enabled: true,
      evaluate: (ctx) => {
        if (ctx.safetyPosture !== 'lockdown') {
          return { ruleId: 'lockdown-enforcement', passed: true, reason: 'Not in lockdown', confidence: 1 };
        }
        const governanceApproved = ctx.metadata.governanceApproved as boolean ?? false;
        return {
          ruleId: 'lockdown-enforcement',
          passed: governanceApproved,
          intervention: governanceApproved ? undefined : 'mission_halt',
          reason: governanceApproved ? 'Governance approved' : 'Lockdown: action requires governance approval',
          confidence: 1,
        };
      },
    });

    this.addRule({
      id: 'runner-safety-clearance',
      name: 'Runner Safety Clearance',
      description: 'Only safety-cleared runners can execute high-risk tasks',
      severity: 'mandatory',
      domains: [],
      level: ['runner'],
      enabled: true,
      evaluate: (ctx) => {
        const highRisk = ctx.metadata.highRisk as boolean ?? false;
        const safetyCleared = ctx.metadata.safetyCleared as boolean ?? true;
        if (!highRisk) {
          return { ruleId: 'runner-safety-clearance', passed: true, reason: 'Low-risk task', confidence: 1 };
        }
        return {
          ruleId: 'runner-safety-clearance',
          passed: safetyCleared,
          intervention: safetyCleared ? undefined : 'runner_quarantine',
          reason: safetyCleared ? 'Runner is safety-cleared' : 'Runner lacks safety clearance for high-risk task',
          confidence: 0.95,
        };
      },
    });
  }
}
