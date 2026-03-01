const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// LLM configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

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

/**
 * POST /llm
 * Call LLM with given messages.
 * Expected body: { messages: LLMMessage[], model?: string }
 * Returns: { content: string, model: string }
 */
app.post('/llm', async (req, res) => {
  try {
    const { messages, model } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Currently only supports OpenAI (model param ignored)
    const result = await callOpenAI(messages);
    res.json(result);
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

app.get('/prompts', (req, res) => {
  res.json(prompts);
});

// Require admin role for POST (simple RBAC via header x-user-role)
app.post('/prompts', (req, res) => {
  const role = (req.headers['x-user-role'] || 'user');
  if (role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const body = req.body;
  if (!Array.isArray(body)) return res.status(400).json({ error: 'expected array' });
  prompts = body;
  res.json({ ok: true });
});

app.listen(4000, () => console.log('AgentArmy backend listening on http://localhost:4000 | LLM: ' + (OPENAI_API_KEY ? 'OpenAI' : 'mock')));
