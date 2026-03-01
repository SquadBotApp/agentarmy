// Router agent: intelligent provider selection and request caching
const NodeCache = require('node-cache');

const adapters = require('./adapters');

class RouterAgent {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 });
    this.stats = {};
  }

  // Generate a stable cache key from messages + routing inputs to avoid collisions
  // NOTE: keep this small but include any fields that affect output selection.
  generateCacheKey(messages, { model, provider, enabledProviders } = {}) {
    const payload = {
      messages,
      model: model || null,
      provider: provider || null,
      enabledProviders: Array.isArray(enabledProviders) ? enabledProviders.slice().sort() : [],
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64').substring(0, 64);
  }

  // Score a provider: lower is better (latency + cost + failures)
  // Uses adapter registry for default cost if not present in stats.
  scoreProvider(providerName, stats) {
    const s = stats[providerName] || { count: 0, totalLatency: 0, failures: 0 };
    const avgLatency = s.totalLatency / Math.max(1, s.count || 0);
    const failureRate = (s.failures || 0) / Math.max(1, s.count || 0);
    const registryCost = (adapters.providers && adapters.providers[providerName]?.cost) || 0.01;
    const cost = typeof s.cost === 'number' ? s.cost : registryCost;
    return avgLatency * 0.4 + cost * 1000 * 0.3 + failureRate * 1000;
  }

  // Pick the best provider from enabled list (fall back to lowest cost if no stats yet)
  pickBestProvider(enabledProviders, stats) {
    if (!enabledProviders || enabledProviders.length === 0) return 'openai';

    const scored = enabledProviders.map((p) => ({ provider: p, score: this.scoreProvider(p, stats) }));
    scored.sort((a, b) => a.score - b.score);

    // If everything is Infinity (no stats), choose cheapest known provider
    if (!Number.isFinite(scored[0].score)) {
      const cheapest = enabledProviders
        .map((p) => ({ provider: p, cost: (adapters.providers && adapters.providers[p]?.cost) || 0.01 }))
        .sort((a, b) => a.cost - b.cost)[0];
      return cheapest.provider;
    }

    return scored[0].provider;
  }

  // Route a request to the best provider (or specified provider)
  async route(messages, model, enabledProviders, stats) {
    const start = Date.now();

    // Normalize enabled providers (empty means "default")
    const enabled = Array.isArray(enabledProviders) ? enabledProviders : [];

    // Check cache first only for "default selection" mode (model unspecified)
    if (!model) {
      const cacheKey = this.generateCacheKey(messages, { enabledProviders: enabled });
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`[Router] Cache hit for key ${cacheKey}`);
        return cached;
      }
    }

    // Determine which provider(s) to use
    if (model === 'all' || model === 'consensus') {
      // Multi-provider ensemble
      if (!enabled.length) throw new Error('No enabled providers configured for multi-provider routing.');
      const calls = enabled.map((p) => this.callProvider(p, messages, stats));
      const results = await Promise.all(calls);

      // Heuristic v1: prefer non-empty + shorter error-like responses.
      // (Better: judge model / structured scoring; keep this deterministic for now.)
      const best = results.reduce((a, b) => {
        const aLen = (a?.content || '').trim().length;
        const bLen = (b?.content || '').trim().length;
        if (aLen === 0) return b;
        if (bLen === 0) return a;
        // Prefer longer only when both have content
        return aLen >= bLen ? a : b;
      });

      const latency = Date.now() - start;
      if (!this.stats[best.model]) this.stats[best.model] = { count: 0, totalLatency: 0, failures: 0 };
      this.stats[best.model].count += 1;
      this.stats[best.model].totalLatency += latency;
      return best;
    }

    // Single provider
    const provider = model || this.pickBestProvider(enabled, stats);
    try {
      const result = await this.callProvider(provider, messages, stats);
      const latency = Date.now() - start;
      if (!this.stats[provider]) this.stats[provider] = { count: 0, totalLatency: 0, failures: 0 };
      this.stats[provider].count += 1;
      this.stats[provider].totalLatency += latency;

      // Cache the result only when provider was auto-selected (model unspecified)
      if (!model) {
        const cacheKey = this.generateCacheKey(messages, { provider, enabledProviders: enabled });
        this.cache.set(cacheKey, result);
      }

      return result;
    } catch (err) {
      console.error(`[Router] ${provider} failed:`, err.message);
      if (!this.stats[provider]) this.stats[provider] = { count: 0, totalLatency: 0, failures: 0 };
      this.stats[provider].failures = (this.stats[provider].failures || 0) + 1;

      // Try fallback (next best by score)
      const candidates = enabled.length ? enabled.filter((p) => p !== provider) : Object.keys(adapters.providers || {}).filter((p) => p !== provider);
      if (candidates.length) {
        const fallback = this.pickBestProvider(candidates, stats);
        console.log(`[Router] Falling back to ${fallback}`);
        return this.callProvider(fallback, messages, stats);
      }
      throw err;
    }
  }

  // Dispatch to correct adapter
  async callProvider(provider, messages, stats) {
    const start = Date.now();
    let result;
    try {
      if (provider === 'openai') result = await adapters.callOpenAI(messages);
      else if (provider === 'anthropic') result = await adapters.callAnthropic(messages);
      else if (provider === 'groq') result = await adapters.callGroq(messages);
      else if (provider === 'xai') result = await adapters.callXAI(messages);
      else if (provider === 'gemini') result = await adapters.callGemini(messages);
      else throw new Error(`Unknown provider: ${provider}`);
      
      const latency = Date.now() - start;
      if (!stats[provider]) stats[provider] = { count: 0, totalLatency: 0, failures: 0 };
      stats[provider].count += 1;
      stats[provider].totalLatency += latency;
      
      return { ...result, model: provider };
    } catch (err) {
      if (!stats[provider]) stats[provider] = { count: 0, totalLatency: 0, failures: 0 };
      stats[provider].failures = (stats[provider].failures || 0) + 1;
      throw err;
    }
  }

  // Get current routing metrics
  getMetrics() {
    return { cache: this.cache.getStats(), stats: this.stats };
  }

  // Expose cache for testing
  clearCache() {
    this.cache.flushAll();
  }

  // Test/public API methods (aliases for cleaner testing)
  recordLatency(provider, latency) {
    if (!this.stats[provider]) this.stats[provider] = { count: 0, totalLatency: 0, failures: 0 };
    this.stats[provider].count += 1;
    this.stats[provider].totalLatency += latency;
  }

  selectProvider(messages, options = {}, enabledProviders = []) {
    const { model } = options;
    if (model && enabledProviders.includes(model)) return model;
    if (enabledProviders.length > 0) return this.pickBestProvider(enabledProviders, this.stats);
    return 'openai';
  }

  getCacheKey(messages, meta = {}) {
    return this.generateCacheKey(messages, meta);
  }
}

module.exports = RouterAgent;
