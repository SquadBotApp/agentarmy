// Core provider adapters for AgentArmy, centralized provider-specific logic.

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const XAI_API_KEY = process.env.XAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Provider registry
const providers = {
  openai: { name: 'openai', available: !!OPENAI_API_KEY, cost: 0.01, speed: 'fast' },
  anthropic: { name: 'anthropic', available: !!ANTHROPIC_API_KEY, cost: 0.008, speed: 'fast' },
  groq: { name: 'groq', available: !!GROQ_API_KEY, cost: 0.005, speed: 'fastest' },
  xai: { name: 'xai', available: !!XAI_API_KEY, cost: 0.008, speed: 'fast' },
  gemini: { name: 'gemini', available: !!GEMINI_API_KEY, cost: 0.012, speed: 'medium' },
};

async function callOpenAI(messages) {
  if (!OPENAI_API_KEY) {
    const lastUserMsg = messages.findLast(m => m.role === 'user');
    return { content: `[Mock OpenAI] ${lastUserMsg?.content?.slice(0, 50) || 'N/A'}...`, model: 'mock-openai' };
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
      await response.json();
      throw new Error(`OpenAI error: ${response.status}`);
    }
    const data = await response.json();
    return { content: data.choices[0]?.message?.content || '', model: 'openai' };
  } catch (err) {
    console.error('OpenAI call failed:', err.message);
    throw err;
  }
}

async function callAnthropic(messages) {
  if (!ANTHROPIC_API_KEY) {
    const lastUserMsg = messages.findLast(m => m.role === 'user');
    return { content: `[Mock Anthropic/Claude Haiku] ${lastUserMsg?.content || ''}`, model: 'mock-anthropic' };
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-10-16',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1000,
        messages: messages,
      }),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(`Anthropic error: ${response.status} - ${errData.error?.message || 'Unknown error'}`);
    }
    const data = await response.json();
    return { content: data.content[0]?.text || '', model: `anthropic:${ANTHROPIC_MODEL}` };
  } catch (err) {
    console.error('Anthropic/Claude Haiku call failed:', err.message);
    throw err;
  }
}

async function callGroq(messages) {
  if (!GROQ_API_KEY) {
    const lastUserMsg = messages.findLast(m => m.role === 'user');
    return { content: `[Mock Groq] ${lastUserMsg?.content?.slice(0, 50) || ''}`, model: 'mock-groq' };
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    if (!response.ok) throw new Error(`Groq error: ${response.status}`);
    const data = await response.json();
    return { content: data.choices[0]?.message?.content || '', model: 'groq' };
  } catch (err) {
    console.error('Groq call failed:', err.message);
    throw err;
  }
}

async function callXAI(messages) {
  if (!XAI_API_KEY) {
    const lastUserMsg = messages.findLast(m => m.role === 'user');
    return { content: `[Mock xAI] ${lastUserMsg?.content?.slice(0, 50) || ''}`, model: 'mock-xai' };
  }
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-1',
        messages: messages,
        max_tokens: 1000,
      }),
    });
    if (!response.ok) throw new Error(`xAI error: ${response.status}`);
    const data = await response.json();
    return { content: data.choices[0]?.message?.content || '', model: 'xai' };
  } catch (err) {
    console.error('xAI call failed:', err.message);
    throw err;
  }
}

async function callGemini(messages) {
  if (!GEMINI_API_KEY) {
    const lastUserMsg = messages.findLast(m => m.role === 'user');
    return { content: `[Mock Gemini] ${lastUserMsg?.content?.slice(0, 50) || ''}`, model: 'mock-gemini' };
  }
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: messages.findLast(m => m.role === 'user').content }] }],
      }),
    });
    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    const data = await response.json();
    return { content: data.candidates[0]?.content?.parts[0]?.text || '', model: 'gemini' };
  } catch (err) {
    console.error('Gemini call failed:', err.message);
    throw err;
  }
}

// Export for use in router
module.exports = {
  providers,
  callOpenAI,
  callAnthropic,
  callGroq,
  callXAI,
  callGemini,
};
