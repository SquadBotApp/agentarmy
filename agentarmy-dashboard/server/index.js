const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
// `fetch` is available globally in Node 18+; no extra dependency needed


const app = express();
app.use(cors());
app.use(bodyParser.json());

// LLM configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
// list of enabled providers and simple stats for routing
const enabledProviders = [];
const providerStats = {};
function recordProviderLatency(provider, latency) {
  if (!providerStats[provider]) providerStats[provider] = {count:0,totalLatency:0};
  providerStats[provider].count += 1;
  providerStats[provider].totalLatency += latency;
}

if (OPENAI_API_KEY) enabledProviders.push('openai');
if (ANTHROPIC_API_KEY) enabledProviders.push('anthropic');
// secret for JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/**
 * Call OpenAI API with fallback for dev/testing.
 * In production, requires OPENAI_API_KEY env var.
 */
async function callOpenAI(messages) {
  if (!OPENAI_API_KEY) {
    // Fallback: return mock response for development
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    return {
      content: `[Mock response] Processed: "${lastUserMsg?.content?.slice(0, 50) || 'N/A'}..."`,
      model: 'mock',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(errData)}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage,
    };
  } catch (err) {
    console.error('OpenAI call failed:', err);
    throw err;
  }
}

async function callAnthropic(messages) {
  if (!ANTHROPIC_API_KEY) {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    return {
      content: `[Mock Anthropic] ${lastUserMsg?.content || ''}`,
      model: 'mock-anthropic',
    };
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-2',
        prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        max_tokens: 1000,
      }),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(`Anthropic error: ${response.status} ${JSON.stringify(errData)}`);
    }
    const data = await response.json();
    return {
      content: data.completion || '',
      model: data.model,
    };
  } catch (err) {
    console.error('Anthropic call failed:', err);
    throw err;
  }
}

/**
 * POST /llm
 * Call LLM with given messages.
 * Expected body: { messages: LLMMessage[], model?: string }
 * Returns: { content: string, model: string }
 */
// simple auth middleware
function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// login route (demo only)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // simple hardcoded users
  const users = {
    admin: { password: 'admin', role: 'admin' },
    user: { password: 'user', role: 'user' },
  };
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(403).json({ error: 'invalid credentials' });
  }
  const token = jwt.sign({ username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: user.role });
});

app.post('/llm', authenticate, async (req, res) => {
  try {
    const { messages, model } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // helper to dispatch to provider and record latency
    async function callProvider(p) {
      const start = Date.now();
      try {
        if (p === 'anthropic') {
          const r = await callAnthropic(messages);
          recordProviderLatency(p, Date.now() - start);
          return r;
        }
        const r = await callOpenAI(messages);
        recordProviderLatency(p, Date.now() - start);
        return r;
      } catch (e) {
        recordProviderLatency(p, Date.now() - start);
        throw e;
      }
    }

    // if model==='all' or unspecified, return multi-results
    if (!model || model === 'all') {
      // compute best provider when unspecified
      if (!model && enabledProviders.length > 1) {
        // choose provider with lowest average latency
        let best = enabledProviders[0];
        let bestScore = Infinity;
        for (const p of enabledProviders) {
          const stats = providerStats[p];
          if (stats && stats.count > 0) {
            const avg = stats.totalLatency / stats.count;
            if (avg < bestScore) {
              bestScore = avg;
              best = p;
            }
          }
        }
        try {
          const r = await callProvider(best);
          return res.json({ content: r.content, model: best });
        } catch (e) {
          // fallback to others
          console.warn('fallback routing from', best, e.message);
        }
      }
      const calls = enabledProviders.map(p => callProvider(p).catch(err => ({ content: `[Error:${err.message}]`, model: p })));
      const results = await Promise.all(calls);
      return res.json({ results });
    }

    // explicit provider requested
    let result;
    try {
      result = await callProvider(model);
    } catch (err) {
      // fallback to another provider
      const fallback = enabledProviders.find(p => p !== model);
      if (fallback) result = await callProvider(fallback);
      else throw err;
    }
    res.json({ content: result.content, model: model || result.model });
  } catch (err) {
    console.error('LLM endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Simple in-memory prompts store
let prompts = [
  { id: 'p-1', name: 'Conservative Governance', content: 'Prioritize safety. Request human confirmation for risky changes.', createdAt: new Date().toISOString(), author: 'system' },
  { id: 'p-2', name: 'Concise Explanations', content: 'Provide short diffs and one-line rationale.', createdAt: new Date().toISOString(), author: 'system' },
];

app.get('/prompts', authenticate, (req, res) => {
  res.json(prompts);
});

// Require admin role for POST (JWT-based RBAC)
app.post('/prompts', authenticate, (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const { body } = req;
  if (!Array.isArray(body)) return res.status(400).json({ error: 'expected array' });
  prompts = body;
  res.json({ ok: true });
});

app.listen(4000, () => console.log('AgentArmy backend listening on http://localhost:4000 | LLM: ' + (OPENAI_API_KEY ? 'OpenAI' : 'mock')));
