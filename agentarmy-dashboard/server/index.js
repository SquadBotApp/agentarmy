// initialize tracing as early as possible
require('./tracing');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const RouterAgent = require('./router_agent');

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

    // Route to best provider, with caching and fallback
    const result = await router.route(messages, model, enabledProviders);
    
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
  try {
    const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));

    let jobResult;
    const body = req.body || {};

    // legacy form: {task, priority, context, modelPreferences}
    if (body.task && typeof body.task === 'string') {
      jobResult = await client.submitTask(body.task, {
        priority: body.priority || 'normal',
        context: body.context || {},
        model_preferences: body.modelPreferences || {},
      });
    }
    // advanced/orchestrator form: {job: {...}, state: {...}, previous_zpe: ...}
    else if (body.job) {
      jobResult = await client.submitTask(body);
    } else {
      return res.status(400).json({ error: 'invalid payload; expected task or job object' });
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

// ============ Prompts Management ============
let prompts = [
  { id: 'p-1', name: 'Conservative Governance', content: 'Prioritize safety and request human confirmation for risky changes.', createdAt: new Date().toISOString(), author: 'system' },
  { id: 'p-2', name: 'Concise Explanations', content: 'Provide short, clear explanations with one-line rationale.', createdAt: new Date().toISOString(), author: 'system' },
];

app.get('/prompts', authenticate, (req, res) => {
  res.json(prompts);
});

app.post('/prompts', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'expected array' });
  prompts = req.body;
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
