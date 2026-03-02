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
const RouterAgent = require('./router_agent');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize router agent with caching and intelligent routing
const router = new RouterAgent();

// Configuration from environment
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const XAI_API_KEY = process.env.XAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const DEFAULT_LLM_PROVIDER = process.env.DEFAULT_LLM_PROVIDER || 'anthropic';

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

// ============ Auth Routes ============
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = {
    admin: { password: 'admin', role: 'admin' },
    user: { password: 'user', role: 'user' },
    demo: { password: 'demo', role: 'user' },
  };
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

// ============ Orchestration (Multi-Agent Brain) ============
const { getOrchestrationClient } = require('./adapters/orchestration');

app.post('/orchestrate', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
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

// ============ Persistence & Analytics ============

// Get agent performance stats (for UI dashboard)
app.get('/analytics/agents', authenticate, (req, res) => {
  try {
    const stats = db.performance.getAgentStats();
    const weights = db.config.getAgentWeights();
    res.json({
      agents: stats.map(agent => ({
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
    res.json(decisions.map(d => ({
      ...d,
      zpe_components: d.zpe_components ? JSON.parse(d.zpe_components) : null,
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
    res.json(decisions.map(d => ({
      ...d,
      zpe_components: d.zpe_components ? JSON.parse(d.zpe_components) : null,
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
    res.json(jobs.map(j => ({
      ...j,
      constraints: j.constraints ? JSON.parse(j.constraints) : null,
    })));
  } catch (err) {
    console.error('[Analytics] Jobs failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get current config (ZPE weights, agent weights)
app.get('/analytics/config', authenticate, (req, res) => {
  try {
    res.json({
      agent_weights: db.config.getAgentWeights(),
      zpe_weights: db.config.getZpeWeights(),
    });
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
  res.json(prompts);
});

app.post('/prompts', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'expected array' });
  prompts = req.body;
  try {
    writePromptsToDisk(prompts);
  } catch (err) {
    console.error('[Prompts] Failed to persist prompts:', err.message);
    return res.status(500).json({ error: 'failed to persist prompts' });
  }
  res.json({ ok: true });
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
