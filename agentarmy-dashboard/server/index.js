// initialize tracing as early as possible
require('./tracing');

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const RouterAgent = require('./router_agent');
const db = require('./db');
const superpowers = require('./superpowers');
const kernel = require('./kernel');
const educationCenter = require('./educationCenter');
const {
  createCorsDelegate,
  securityHeaders,
  createRateLimiter,
  computeSecurityPosture,
} = require('./security');

// Initialize router agent with caching and intelligent routing
const router = new RouterAgent();

// Configuration from environment
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const XAI_API_KEY = process.env.XAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const IS_PRODUCTION = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (IS_PRODUCTION ? '' : 'dev-insecure-secret-change-me');
if (IS_PRODUCTION && !JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}
const DEFAULT_LLM_PROVIDER = process.env.DEFAULT_LLM_PROVIDER || 'anthropic';
const PROFILE_KINDS = new Set(['social', 'ssh', 'comms']);
const CONNECTOR_ENV_KEYS = [
  'N8N_WEBHOOK_URL',
  'THREECX_PHONE_WEBHOOK_URL',
  'CLAUDE_CHANNEL_WEBHOOK_URL',
  'MICROSOFT_COPILOT_STUDIO_WEBHOOK_URL',
  'APPLE_MOBILE_WEBHOOK_URL',
  'GOOGLE_MOBILE_WEBHOOK_URL',
  'SAMSUNG_MOBILE_WEBHOOK_URL',
  'AMAZON_MOBILE_WEBHOOK_URL',
  'SSH_OPS_ENABLED',
];
const SECURITY_POSTURE = computeSecurityPosture(process.env, IS_PRODUCTION);
if (IS_PRODUCTION && SECURITY_POSTURE.status !== 'pass') {
  const failing = SECURITY_POSTURE.checks.filter((c) => c.required_in_production && !c.ok).map((c) => c.id);
  throw new Error(`Security posture checks failed in production: ${failing.join(', ')}`);
}

const app = express();
app.use(cors(createCorsDelegate({
  isProduction: IS_PRODUCTION,
  allowedOrigins: process.env.CORS_ALLOWED_ORIGINS || '',
})));
app.use(securityHeaders);
app.use(bodyParser.json({ limit: process.env.REQUEST_BODY_LIMIT || '256kb' }));
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  res.setHeader('x-trace-id', req.traceId);
  next();
});

const PROMPTS_PATH = path.join(__dirname, '..', 'data', 'prompts.json');

function readPromptsFromDisk() {
  try {
    if (!fs.existsSync(PROMPTS_PATH)) return null;
    const raw = fs.readFileSync(PROMPTS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.error('[Prompts] Failed to read prompts file:', err.message);
    return null;
  }
}

function writePromptsToDisk(nextPrompts) {
  const dir = path.dirname(PROMPTS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PROMPTS_PATH, JSON.stringify(nextPrompts, null, 2), 'utf8');
}

// Build enabled providers list dynamically
const enabledProviders = [];
if (OPENAI_API_KEY) enabledProviders.push('openai');
if (ANTHROPIC_API_KEY) enabledProviders.push('anthropic');
if (GROQ_API_KEY) enabledProviders.push('groq');
if (XAI_API_KEY) enabledProviders.push('xai');
if (GEMINI_API_KEY) enabledProviders.push('gemini');

console.log(`[AgentArmy Server] Enabled providers: ${enabledProviders.join(', ') || 'mock'}`);

function loadAuthUsers() {
  const raw = String(process.env.AUTH_USERS_JSON || '').trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (err) {
      console.error('[Auth] Failed to parse AUTH_USERS_JSON:', err.message);
    }
  }
  const allowDemo = !IS_PRODUCTION && String(process.env.ALLOW_INSECURE_DEMO_AUTH || 'true').toLowerCase() !== 'false';
  if (!allowDemo) return {};
  return {
    admin: { password: process.env.ADMIN_PASSWORD || 'admin', role: 'admin' },
    user: { password: process.env.USER_PASSWORD || 'user', role: 'user' },
    demo: { password: process.env.DEMO_PASSWORD || 'demo', role: 'user' },
  };
}

function redact(value) {
  const fn = db?._internals?.redactForAudit;
  return typeof fn === 'function' ? fn(value) : value;
}

function scrubSecretsInText(text) {
  const input = String(text || '');
  // Remove duplicate characters in regex and use replaceAll
  // Use string for replaceAll, fix regex, and avoid duplicate chars
    return input
      .replaceAll(/Bearer\s+[A-Za-z\d._~+/=]*/gi, 'Bearer [REDACTED]')
    .replaceAll(/(api[_-]?key|token|password|secret)\s*[:=]\s*['"]?[^'"\s]+['"]?/gi, '$1=[REDACTED]')
    .slice(0, 12000);
}

function sanitizePrompts(input) {
  if (!Array.isArray(input)) return null;
  return input.slice(0, 200).map((p, idx) => ({
    id: String(p?.id || `p-${idx + 1}`),
    name: String(p?.name || `Prompt ${idx + 1}`).slice(0, 120),
    content: scrubSecretsInText(p?.content || ''),
    createdAt: String(p?.createdAt || new Date().toISOString()),
    author: String(p?.author || 'unknown').slice(0, 80),
  }));
}

const loginRateLimit = createRateLimiter({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_LOGIN || '10', 10),
  keyFn: (req) => `login:${req.ip || 'unknown'}`,
});
const approvalIssueRateLimit = createRateLimiter({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_APPROVALS || '20', 10),
  keyFn: (req) => `approval:${req.ip || 'unknown'}:${req.user?.username || 'anon'}`,
});
const highRiskRateLimit = createRateLimiter({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_HIGHRISK || '8', 10),
  keyFn: (req) => `highrisk:${req.ip || 'unknown'}:${req.user?.username || 'anon'}`,
});

// ============ Auth Middleware ============
function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    console.error('[Auth] JWT validation error:', e.message);
    return res.status(401).json({ error: 'invalid token' });
  }
}

function kernelAuthorize(req, res, action, context = {}) {
  const decision = kernel.authorizeAction(db, {
    action,
    user: req.user || {},
    context,
    approvalToken: req.headers['x-approval-token'],
    rootOverride: String(req.headers['x-root-override'] || '').toLowerCase() === 'true',
  });
  if (!decision.allowed) {
    const code = decision.status === 'pending_approval' ? 409 : 403;
    res.status(code).json({ error: decision.reason, decision, trace_id: req.traceId });
    return null;
  }
  return decision;
}

// ============ Auth Routes ============
app.post('/login', loginRateLimit, (req, res) => {
  const { username, password } = req.body;
  const users = loadAuthUsers();
  if (!Object.keys(users).length) {
    return res.status(503).json({ error: 'auth users not configured' });
  }
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(403).json({ error: 'invalid credentials' });
  }
  const token = jwt.sign({ username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: user.role });
});

app.post('/logout', authenticate, (req, res) => {
  // Stateless JWT: no server-side session to clear.
  // Client removes token from localStorage.
  res.json({ ok: true });
});

// ============ LLM Routing ============
app.post('/llm', authenticate, async (req, res) => {
  try {
    const { messages, model } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const preferredModel = model || DEFAULT_LLM_PROVIDER;

    // Route to best provider, with caching and fallback
    const result = await router.route(messages, preferredModel, enabledProviders);
    
    res.json({
      content: result.content,
      model: result.model || 'unknown',
    });
  } catch (err) {
    console.error('[LLM] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============ Routing Metrics ============
app.get('/metrics', authenticate, (req, res) => {
  const metrics = router.getMetrics();
  res.json({
    providers: enabledProviders,
    stats: metrics.stats,
    cacheSize: metrics.cache.keys.length,
  });
});

app.get('/security/posture', authenticate, (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'admin only' });
    const posture = computeSecurityPosture(process.env, IS_PRODUCTION);
    res.json({
      generated_at: posture.generated_at,
      is_production: posture.is_production,
      score: posture.score,
      status: posture.status,
      checks: posture.checks,
      trace_id: req.traceId,
    });
  } catch (err) {
    console.error('[Security] Posture endpoint failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

// ============ Kernel (Unified Intelligence Kernel) ============

app.get('/kernel/state', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'read.kernel.state', {});
    if (!decision) return;
    res.json(kernel.getKernelState(db));
  } catch (err) {
    console.error('[Kernel] state failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.get('/kernel/policies', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'read.kernel.policies', {});
    if (!decision) return;
    res.json(kernel.getPolicies(db));
  } catch (err) {
    console.error('[Kernel] get policies failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.put('/kernel/policies', authenticate, (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'admin only' });
    }
    const decision = kernelAuthorize(req, res, 'admin.kernel.policies.update.high_risk', req.body || {});
    if (!decision) return;
    const saved = kernel.setPolicies(db, req.body || {});
    res.json({ ok: true, policies: saved });
  } catch (err) {
    console.error('[Kernel] set policies failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/kernel/approvals/issue', authenticate, approvalIssueRateLimit, (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'admin only' });
    const action = String(req.body?.action || '').trim();
    if (!action) return res.status(400).json({ error: 'action required' });
    const actor = String(req.body?.actor || req.user?.username || '').trim();
    const role = String(req.body?.role || req.user?.role || '').trim();
    const ttlSeconds = Number(req.body?.ttl_seconds) || 300;
    const token = kernel.issueApprovalToken({ action, actor, role, ttlSeconds });
    res.json({
      token,
      action,
      actor: actor || null,
      role: role || null,
      expires_in_seconds: Math.max(30, Math.min(3600, ttlSeconds)),
    });
  } catch (err) {
    console.error('[Kernel] issue approval failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/kernel/commands/execute', authenticate, highRiskRateLimit, async (req, res) => {
  try {
    const action = String(req.body?.action || '').trim();
    const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {};
    const dryRun = Boolean(req.body?.dry_run);

    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const handlers = {
      'runtime.orchestrate.submit': async (p) => {
        if (p.job) return client.submitTask(p);
        return client.submitTask(String(p.task || ''), {
          priority: p.priority || 'normal',
          context: p.context || {},
          integrations: p.integrations || {},
          framework: p.framework || 'native',
        });
      },
      'runtime.comms.broadcast': async (p) => client.broadcastComms(p),
      'runtime.profile.upsert': async (p, meta) => {
        const kind = String(p.kind || '').toLowerCase();
        const name = String(p.name || '').trim();
        const data = p.data && typeof p.data === 'object' ? p.data : {};
        if (!PROFILE_KINDS.has(kind)) throw new Error('invalid profile kind');
        if (!name) throw new Error('profile name required');
        db.profiles.upsert(kind, name, data, meta.user?.username || 'unknown');
        return { ok: true, kind, name };
      },
    };

    const result = await kernel.executeCommand(db, {
      action,
      payload,
      user: req.user || {},
      dryRun,
      approvalToken: req.headers['x-approval-token'],
      rootOverride: String(req.headers['x-root-override'] || '').toLowerCase() === 'true',
      handlers,
    });

    let code = 500;
    if (result.status === 'completed' || result.status === 'dry_run') {
      code = 200;
    } else if (result.status === 'pending_approval') {
      code = 409;
    } else if (result.status === 'blocked') {
      code = 403;
    }
    res.status(code).json(result);
  } catch (err) {
    console.error('[Kernel] execute command failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

// ============ Orchestration (Multi-Agent Brain) ============
const { getOrchestrationClient } = require('./adapters/orchestration');

app.post('/orchestrate', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const decision = kernelAuthorize(req, res, 'runtime.orchestrate.submit', req.body || {});
    if (!decision) return;
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));

    let jobResult;
    const body = req.body || {};
    let goal;
    let constraints = {};
    let riskTolerance = 0.5;
    let tasks = [];

    // legacy form: {task, priority, context, modelPreferences}
    if (body.task && typeof body.task === 'string') {
      goal = body.task;
      constraints = body.context?.constraints || {};
      tasks = body.context?.state?.tasks || [];
      
      // Include learned agent weights in payload
      const agentWeights = db.config.getAgentWeights();
      const enrichedContext = {
        ...body.context,
        agent_weights: agentWeights,
      };
      
      jobResult = await client.submitTask(body.task, {
        priority: body.priority || 'normal',
        context: enrichedContext,
        model_preferences: body.modelPreferences || {},
        integrations: body.integrations || {},
        framework: body.framework || 'native',
      });
    } else if (body.job) {
      goal = body.job.goal || 'Advanced orchestration task';
      constraints = body.job.constraints || {};
      riskTolerance = body.job.risk_tolerance || 0.5;
      tasks = body.state?.tasks || [];
      
      // Include learned agent weights in payload
      const agentWeights = db.config.getAgentWeights();
      const enrichedPayload = {
        ...body,
        agent_weights: agentWeights,
        framework: body.framework || body.execution?.framework || 'native',
      };
      
      jobResult = await client.submitTask(enrichedPayload);
    } else {
      return res.status(400).json({ error: 'invalid payload; expected task or job object' });
    }

    // Persist job to SQLite
    const jobId = jobResult.job_id;
    try {
      db.jobs.create({
        id: jobId,
        workspaceId: req.user?.workspaceId || null,
        goal,
        constraints,
        riskTolerance,
      });

      // Persist tasks if provided
      if (tasks.length > 0) {
        db.tasks.createBatch(tasks.map(t => ({
          id: t.id,
          jobId,
          name: t.name,
          description: t.description,
          duration: t.duration,
          dependsOn: t.depends_on || t.dependsOn || [],
        })));
      }

      // Persist decision from orchestrator response
      // Python API returns: {result: {decision: {nextAgentId, zpe: {total, components}, rationale, ...}}}
      const decision = jobResult.result?.decision || {};
      const agentId = decision.nextAgentId || decision.agent_id || decision.selected_agent || 'orchestrator';
      const zpeData = decision.zpe || {};
      const zpeTotal = zpeData.total ?? decision.zpe_total ?? null;
      const zpeComponents = zpeData.components || decision.zpe_components || null;
      const metrics = jobResult.result?.metrics || {};
      
      db.decisions.create({
        jobId,
        taskId: decision.nextTaskId || decision.task_id || null,
        agentId,
        zpeTotal,
        zpeComponents,
        isCritical: decision.is_critical || false,
        rationale: decision.rationale || decision.reasoning || null,
      });

      // Record agent performance
      const latencyMs = Date.now() - startTime;
      const success = jobResult.status === 'completed';
      
      db.performance.record({
        agentId,
        jobId,
        taskId: decision.nextTaskId || decision.task_id || null,
        success,
        latencyMs,
        costEstimate: metrics.execution_cost_estimate || decision.cost_estimate || null,
        zpeAtDecision: zpeTotal,
      });

      // Update job status
      db.jobs.update(jobId, {
        status: jobResult.status,
        finishedAt: jobResult.completed_at || new Date().toISOString(),
      });

    } catch (error_) {
      console.error('[DB] Persistence error (non-fatal):', error_.message);
      // Continue - persistence failure shouldn't block orchestration
    }

    res.json(jobResult);
  } catch (err) {
    console.error('[Orchestration] Submit failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/orchestrate/jobs/:jobId', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const jobResult = await client.getJobStatus(jobId);
    res.json(jobResult);
  } catch (err) {
    console.error('[Orchestration] Get job failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/orchestrate/jobs', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const jobs = await client.listJobs(status);
    res.json(jobs);
  } catch (err) {
    console.error('[Orchestration] List jobs failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/orchestrate/capabilities', authenticate, async (req, res) => {
  try {
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const capabilities = await client.getCapabilities();
    res.json(capabilities);
  } catch (err) {
    console.error('[Orchestration] Capabilities failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/orchestrate/efficiency-plan', authenticate, async (req, res) => {
  try {
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const plan = await client.getEfficiencyPlan(req.body || {});
    res.json(plan);
  } catch (err) {
    console.error('[Orchestration] Efficiency plan failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/orchestrate/social-intel', authenticate, async (req, res) => {
  try {
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const intel = await client.getSocialIntel(req.body || {});
    res.json(intel);
  } catch (err) {
    console.error('[Orchestration] Social intel failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/orchestrate/ssh-plan', authenticate, async (req, res) => {
  try {
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const plan = await client.getSshPlan(req.body || {});
    res.json(plan);
  } catch (err) {
    console.error('[Orchestration] SSH plan failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/orchestrate/comms-broadcast', authenticate, async (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.comms.broadcast', req.body || {});
    if (!decision) return;
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const result = await client.broadcastComms(req.body || {});
    res.json(result);
  } catch (err) {
    console.error('[Orchestration] Comms broadcast failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.get('/orchestrate/connectors/health', authenticate, async (req, res) => {
  try {
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const serviceHealth = await client.healthCheck();
    res.json({
      trace_id: req.traceId,
      orchestration_service: serviceHealth,
      connector_health: client.getConnectorHealth(),
    });
  } catch (err) {
    console.error('[Orchestration] Connector health failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.get('/orchestrate/config-health', authenticate, (req, res) => {
  try {
    const checks = CONNECTOR_ENV_KEYS.map((key) => {
      const raw = process.env[key];
      const configured = raw != null && String(raw).trim() !== '' && String(raw).trim().toLowerCase() !== 'false';
      return { key, configured };
    });
    const configuredCount = checks.filter((c) => c.configured).length;
    res.json({
      trace_id: req.traceId,
      configured_count: configuredCount,
      total_count: checks.length,
      checks,
    });
  } catch (err) {
    console.error('[Orchestration] Config health failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.get('/profiles/:kind', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'read.profiles.list', { kind: req.params.kind });
    if (!decision) return;
    const kind = String(req.params.kind || '').toLowerCase();
    if (!PROFILE_KINDS.has(kind)) {
      return res.status(400).json({ error: 'invalid profile kind' });
    }
    const profiles = db.profiles.list(kind);
    res.json({ kind, profiles });
  } catch (err) {
    console.error('[Profiles] List failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/profiles/:kind', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.profile.upsert', { kind: req.params.kind, name: req.body?.name });
    if (!decision) return;
    const kind = String(req.params.kind || '').toLowerCase();
    if (!PROFILE_KINDS.has(kind)) {
      return res.status(400).json({ error: 'invalid profile kind' });
    }
    const name = String(req.body?.name || '').trim();
    const data = req.body?.data;
    if (!name) {
      return res.status(400).json({ error: 'profile name required' });
    }
    if (data == null || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ error: 'profile data object required' });
    }
    db.profiles.upsert(kind, name, data, req.user?.username || 'unknown');
    res.json({ ok: true, kind, name });
  } catch (err) {
    console.error('[Profiles] Upsert failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============ Persistence & Analytics ============

// Get agent performance stats (for UI dashboard)
app.get('/analytics/agents', authenticate, (req, res) => {
  try {
    const stats = db.performance.getAgentStats();
    const weights = db.config.getAgentWeights();
    res.json({
      agents: stats.map(agent => redact({
        ...agent,
        learned_weight: weights[agent.agent_id] || 1,
      })),
      last_updated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Analytics] Agent stats failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get recent decisions (for audit/debugging)
app.get('/analytics/decisions', authenticate, (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 50;
    const decisions = db.decisions.getRecent(limit);
    res.json(decisions.map(d => redact({
      ...d,
      zpe_components: (() => {
        try {
          return d.zpe_components ? JSON.parse(d.zpe_components) : null;
        } catch {
          return null;
        }
      })(),
    })));
  } catch (err) {
    console.error('[Analytics] Decisions failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get decisions for a specific job
app.get('/analytics/jobs/:jobId/decisions', authenticate, (req, res) => {
  try {
    const decisions = db.decisions.getByJob(req.params.jobId);
    res.json(decisions.map(d => redact({
      ...d,
      zpe_components: (() => {
        try {
          return d.zpe_components ? JSON.parse(d.zpe_components) : null;
        } catch {
          return null;
        }
      })(),
    })));
  } catch (err) {
    console.error('[Analytics] Job decisions failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get persisted jobs from SQLite (historical view)
app.get('/analytics/jobs', authenticate, (req, res) => {
  try {
    const { status } = req.query;
    const jobs = db.jobs.list(status || null);
    res.json(jobs.map(j => redact({
      ...j,
      constraints: (() => {
        try {
          return j.constraints ? JSON.parse(j.constraints) : null;
        } catch {
          return null;
        }
      })(),
    })));
  } catch (err) {
    console.error('[Analytics] Jobs failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get current config (ZPE weights, agent weights)
app.get('/analytics/config', authenticate, (req, res) => {
  try {
    res.json(redact({
      agent_weights: db.config.getAgentWeights(),
      zpe_weights: db.config.getZpeWeights(),
    }));
  } catch (err) {
    console.error('[Analytics] Config failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============ Learning Loop Triggers ============

// Trigger agent weight recomputation (manual or scheduled)
app.post('/learning/recompute-weights', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'admin only' });
  }
  try {
    const weights = db.computeAgentWeights();
    res.json({
      message: 'Agent weights recomputed',
      weights,
    });
  } catch (err) {
    console.error('[Learning] Recompute failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update ZPE component weights (manual tuning)
app.put('/learning/zpe-weights', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'admin only' });
  }
  try {
    const { weights } = req.body;
    if (!weights || typeof weights !== 'object') {
      return res.status(400).json({ error: 'weights object required' });
    }
    db.config.setZpeWeights(weights);
    res.json({
      message: 'ZPE weights updated',
      weights: db.config.getZpeWeights(),
    });
  } catch (err) {
    console.error('[Learning] ZPE update failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============ Prompts Management ============
let prompts = [
  { id: 'p-1', name: 'Conservative Governance', content: 'Prioritize safety and request human confirmation for risky changes.', createdAt: new Date().toISOString(), author: 'system' },
  { id: 'p-2', name: 'Concise Explanations', content: 'Provide short, clear explanations with one-line rationale.', createdAt: new Date().toISOString(), author: 'system' },
];

const diskPrompts = readPromptsFromDisk();
if (diskPrompts) prompts = diskPrompts;

app.get('/prompts', authenticate, (req, res) => {
  res.json(redact(prompts));
});

app.post('/prompts', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'expected array' });
  const sanitized = sanitizePrompts(req.body);
  if (!sanitized) return res.status(400).json({ error: 'expected array' });
  prompts = sanitized;
  try {
    writePromptsToDisk(prompts);
  } catch (err) {
    console.error('[Prompts] Failed to persist prompts:', err.message);
    return res.status(500).json({ error: 'failed to persist prompts' });
  }
  res.json({ ok: true });
});

// ============ Superpowers Control Plane ============

app.post('/superpowers/autonomous-pr', authenticate, highRiskRateLimit, async (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.superpowers.autonomous_pr.high_risk', req.body || {});
    if (!decision) return;
    const goal = String(req.body?.goal || '').trim();
    if (!goal) return res.status(400).json({ error: 'goal required' });
    const dryRun = req.body?.dry_run !== false;
    const branch = `autonomous/${Date.now()}-${goal.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').slice(0, 24)}`;
    const checklist = [
      'Create branch',
      'Implement scoped changes',
      'Run tests/typecheck',
      'Generate risk summary',
      'Prepare PR draft',
    ];

    let orchestrationJob = null;
    if (!dryRun) {
      const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
      orchestrationJob = await client.submitTask(goal, {
        priority: 'high',
        context: { mode: 'autonomous_pr' },
      });
    }

    const result = {
      run_id: `spr-${crypto.randomUUID()}`,
      goal,
      dry_run: dryRun,
      branch,
      checklist,
      risk_summary: {
        level: 'medium',
        blockers: ['human review before merge'],
      },
      orchestration_job: orchestrationJob,
      created_at: new Date().toISOString(),
    };
    superpowers.appendMemory(db, { type: 'autonomous_pr', user: req.user?.username || 'unknown', result });
    res.json(result);
  } catch (err) {
    console.error('[Superpowers] autonomous-pr failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/superpowers/tool-graph/compile', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.superpowers.tool_graph.compile', req.body || {});
    if (!decision) return;
    const goal = String(req.body?.goal || '').trim();
    if (!goal) return res.status(400).json({ error: 'goal required' });
    const graph = superpowers.compileToolGraph(goal);
    superpowers.appendMemory(db, { type: 'tool_graph', user: req.user?.username || 'unknown', graph });
    res.json(graph);
  } catch (err) {
    console.error('[Superpowers] tool-graph failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/superpowers/self-heal/run', authenticate, async (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.superpowers.self_heal.run', req.body || {});
    if (!decision) return;
    const objective = String(req.body?.objective || 'stabilize runtime').trim();
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const plan = await client.getEfficiencyPlan({ goal: `Self-heal objective: ${objective}` });
    const result = {
      run_id: `heal-${crypto.randomUUID()}`,
      objective,
      selected_framework: plan.recommended_framework,
      actions: plan.parallel_tracks,
      generated_at: new Date().toISOString(),
    };
    superpowers.appendMemory(db, { type: 'self_heal', user: req.user?.username || 'unknown', result });
    res.json(result);
  } catch (err) {
    console.error('[Superpowers] self-heal failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/superpowers/pair/suggest', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.superpowers.pair.suggest', req.body || {});
    if (!decision) return;
    const suggestion = superpowers.buildPairSuggestion(req.body?.file, req.body?.intent);
    superpowers.appendMemory(db, { type: 'pair_suggest', user: req.user?.username || 'unknown', suggestion });
    res.json(suggestion);
  } catch (err) {
    console.error('[Superpowers] pair suggest failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/superpowers/marketplace/install', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.superpowers.marketplace.install', req.body || {});
    if (!decision) return;
    const entry = superpowers.installSkill(db, req.body?.skill_id, req.body?.metadata);
    superpowers.appendMemory(db, { type: 'skill_install', user: req.user?.username || 'unknown', entry });
    res.json({ ok: true, installed: entry });
  } catch (err) {
    console.error('[Superpowers] marketplace install failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/superpowers/dsl/execute', authenticate, highRiskRateLimit, async (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.superpowers.dsl.execute', req.body || {});
    if (!decision) return;
    const parsed = superpowers.parseDsl(req.body?.command);
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));
    const job = await client.submitTask(parsed.goal, {
      priority: 'high',
      context: { dsl_intent: parsed.intent, pipeline: parsed.pipeline },
    });
    const result = { parsed, job, executed_at: new Date().toISOString() };
    superpowers.appendMemory(db, { type: 'dsl_execute', user: req.user?.username || 'unknown', result });
    res.json(result);
  } catch (err) {
    console.error('[Superpowers] dsl execute failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.get('/superpowers/control-tower', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'read.superpowers.control_tower', {});
    if (!decision) return;
    res.json(redact(superpowers.buildControlTower(db)));
  } catch (err) {
    console.error('[Superpowers] control-tower failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

// ============ EducationCenter (Top-Level Learning Domain) ============

app.get('/education/state', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'read.education.state', {});
    if (!decision) return;
    res.json(educationCenter.getStateView(db, {
      viewerRole: req.user?.role || 'user',
      viewerId: req.user?.username || 'unknown',
    }));
  } catch (err) {
    console.error('[EducationCenter] state failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/education/session/start', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.education.session.start', req.body || {});
    if (!decision) return;
    const out = educationCenter.startSession(
      db,
      req.body || {},
      req.user?.username || 'unknown',
      { role: req.user?.role || 'user' }
    );
    let code = 403;
    if (out.status === 'active') {
      code = 200;
    } else if (out.status === 'pending_approval') {
      code = 409;
    }
    res.status(code).json(out);
  } catch (err) {
    console.error('[EducationCenter] session start failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/education/session/assess', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.education.assessment.submit', req.body || {});
    if (!decision) return;
    const out = educationCenter.submitAssessment(
      db,
      req.body || {},
      req.user?.username || 'unknown',
      { role: req.user?.role || 'user' }
    );
    res.json(out);
  } catch (err) {
    console.error('[EducationCenter] assess failed:', err.message);
    const code = String(err?.message || '').includes('forbidden session access') ? 403 : 500;
    res.status(code).json({ error: err.message, trace_id: req.traceId });
  }
});

app.post('/education/simulation/generate', authenticate, (req, res) => {
  try {
    const decision = kernelAuthorize(req, res, 'runtime.education.simulation.generate', req.body || {});
    if (!decision) return;
    res.json(educationCenter.buildSimulation(req.body || {}));
  } catch (err) {
    console.error('[EducationCenter] simulation failed:', err.message);
    res.status(500).json({ error: err.message, trace_id: req.traceId });
  }
});

// ============ Startup ============
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 AgentArmy API Server running at http://localhost:${PORT}`);
  console.log(`   LLM providers: ${enabledProviders.length ? enabledProviders.join(', ') : 'mock (no keys configured)'}`);
  console.log(`   Orchestration: ${process.env.ORCHESTRATION_SERVICE_URL || 'http://localhost:5000'}`);
  console.log(`   Available endpoints: /login, /logout, /llm, /prompts, /metrics, /orchestrate\n`);
});

module.exports = app;
