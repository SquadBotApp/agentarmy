const DEFAULT_POLICIES = {
  version: '1.0.0',
  deny_by_default: false,
  rules: [
    {
      id: 'allow-read-metrics',
      effect: 'allow',
      action_pattern: 'read.*',
      roles: ['admin', 'user'],
      requires_approval: false,
      risk: 'low',
    },
    {
      id: 'approve-high-risk',
      effect: 'allow',
      action_pattern: '*.high_risk',
      roles: ['admin'],
      requires_approval: true,
      risk: 'high',
    },
    {
      id: 'deny-user-high-risk',
      effect: 'deny',
      action_pattern: '*.high_risk',
      roles: ['user'],
      requires_approval: false,
      risk: 'high',
    },
    {
      id: 'allow-user-runtime',
      effect: 'allow',
      action_pattern: 'runtime.*',
      roles: ['admin', 'user'],
      requires_approval: false,
      risk: 'medium',
    },
    {
      id: 'deny-user-admin-scope',
      effect: 'deny',
      action_pattern: 'admin.*',
      roles: ['user'],
      requires_approval: false,
      risk: 'high',
    },
  ],
};

function safeObject(value, fallback = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return fallback;
}

function normalizePolicies(input) {
  const raw = safeObject(input, {});
  const rulesRaw = Array.isArray(raw.rules) ? raw.rules : DEFAULT_POLICIES.rules;
  const rules = rulesRaw
    .filter((r) => r && typeof r === 'object')
    .map((r, idx) => ({
      id: String(r.id || `rule-${idx + 1}`),
      effect: r.effect === 'deny' ? 'deny' : 'allow',
      action_pattern: String(r.action_pattern || '*'),
      roles: Array.isArray(r.roles) && r.roles.length > 0 ? r.roles.map((x) => String(x)) : ['admin', 'user'],
      requires_approval: Boolean(r.requires_approval),
      risk: String(r.risk || 'medium'),
    }));

  return {
    version: String(raw.version || DEFAULT_POLICIES.version),
    deny_by_default: Boolean(raw.deny_by_default),
    rules,
  };
}

function wildcardMatch(pattern, value) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`, 'i');
  return regex.test(value);
}

function getPolicies(db) {
  return normalizePolicies(db.config.get('kernel_policies') || DEFAULT_POLICIES);
}

function setPolicies(db, policies) {
  const normalized = normalizePolicies(policies);
  db.config.set('kernel_policies', normalized);
  return normalized;
}

function evaluatePolicy(policies, action, role = 'user') {
  const rules = Array.isArray(policies.rules) ? policies.rules : [];
  for (const rule of rules) {
    const roleMatch = Array.isArray(rule.roles) ? rule.roles.includes(role) : true;
    if (!roleMatch) continue;
    if (!wildcardMatch(String(rule.action_pattern || '*'), action)) continue;
    return {
      matched: true,
      rule_id: rule.id,
      allowed: rule.effect !== 'deny',
      requires_approval: Boolean(rule.requires_approval),
      risk: String(rule.risk || 'medium'),
    };
  }

  return {
    matched: false,
    rule_id: null,
    allowed: !policies.deny_by_default,
    requires_approval: false,
    risk: 'unknown',
  };
}

function authorizeAction(db, params) {
  const action = String(params?.action || '').trim();
  const user = safeObject(params?.user, {});
  const role = String(user.role || 'user');
  const actor = String(user.username || user.id || 'unknown');
  const context = safeObject(params?.context, {});
  const approvalToken = String(params?.approvalToken || '').trim();
  const rootOverride = Boolean(params?.rootOverride);

  if (!action) {
    return { status: 'blocked', allowed: false, reason: 'action required' };
  }

  const policies = getPolicies(db);
  const evaluation = evaluatePolicy(policies, action, role);
  let status = evaluation.allowed ? 'allowed' : 'blocked';
  let reason = evaluation.allowed ? 'policy allow' : 'policy deny';

  if (rootOverride && role === 'admin') {
    status = 'allowed';
    reason = 'root override';
  } else if (status === 'allowed' && evaluation.requires_approval && !approvalToken) {
    status = 'pending_approval';
    reason = 'approval required';
  }

  const decision = {
    status,
    allowed: status === 'allowed',
    reason,
    action,
    actor,
    role,
    rule_id: evaluation.rule_id,
    risk: evaluation.risk,
    requires_approval: evaluation.requires_approval,
  };

  db.kernelEvents.record({
    event_type: 'policy_decision',
    action,
    actor,
    payload: context,
    decision,
  });

  return decision;
}

async function executeCommand(db, params) {
  const action = String(params?.action || '').trim();
  const payload = safeObject(params?.payload, {});
  const user = safeObject(params?.user, {});
  const handlers = safeObject(params?.handlers, {});
  const dryRun = Boolean(params?.dryRun);
  const approvalToken = String(params?.approvalToken || '');
  const rootOverride = Boolean(params?.rootOverride);

  const decision = authorizeAction(db, {
    action,
    user,
    context: payload,
    approvalToken,
    rootOverride,
  });

  if (!decision.allowed) {
    return {
      status: decision.status,
      action,
      decision,
      result: null,
    };
  }

  const actor = String(user.username || user.id || 'unknown');
  if (dryRun) {
    const result = {
      status: 'dry_run',
      action,
      decision,
      result: { preview: true },
    };
    db.kernelEvents.record({
      event_type: 'command_execute',
      action,
      actor,
      payload,
      decision: { status: 'dry_run' },
    });
    return result;
  }

  const handler = handlers[action];
  if (typeof handler !== 'function') {
    return {
      status: 'failed',
      action,
      decision,
      error: 'no handler registered for action',
    };
  }

  try {
    const output = await handler(payload, { user });
    db.kernelEvents.record({
      event_type: 'command_execute',
      action,
      actor,
      payload,
      decision: { status: 'completed' },
    });
    return {
      status: 'completed',
      action,
      decision,
      result: output,
    };
  } catch (err) {
    const message = err?.message || String(err);
    db.kernelEvents.record({
      event_type: 'command_execute',
      action,
      actor,
      payload,
      decision: { status: 'failed', error: message },
    });
    return {
      status: 'failed',
      action,
      decision,
      error: message,
    };
  }
}

function getKernelState(db) {
  const policies = getPolicies(db);
  const events = db.kernelEvents.list(100);
  const blocked = events.filter((e) => e.decision?.status === 'blocked').length;
  const pending = events.filter((e) => e.decision?.status === 'pending_approval').length;
  return {
    generated_at: new Date().toISOString(),
    policies,
    event_chain: {
      total_events: events.length,
      blocked_events: blocked,
      pending_approval_events: pending,
      recent: events,
    },
  };
}

module.exports = {
  DEFAULT_POLICIES,
  getPolicies,
  setPolicies,
  evaluatePolicy,
  authorizeAction,
  executeCommand,
  getKernelState,
};
