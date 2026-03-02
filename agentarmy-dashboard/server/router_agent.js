// Router agent: intelligent provider selection, tool routing, and request caching
const NodeCache = require('node-cache');

const adapters = require('./adapters');
const AdvancedToolSelector = require('./toolSelector');
const MonitoringSystem = require('./monitoring');

class RouterAgent {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 });
    this.stats = {};
    this.toolSelector = new AdvancedToolSelector();
    this.monitor = new MonitoringSystem();
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

    // Claude Haiku first when available (explicit product decision)
    if (enabledProviders.includes('anthropic')) return 'anthropic';

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

    if (model === 'all' || model === 'consensus') {
      return this.routeConsensus(messages, enabled, start, stats);
    }

    return this.routeSingleProvider(messages, model, enabled, start, stats);
  }

  async routeConsensus(messages, enabled, start, stats) {
    if (!enabled.length) throw new Error('No enabled providers configured for multi-provider routing.');
    const calls = enabled.map((p) => this.callProvider(p, messages, stats));
    const results = await Promise.all(calls);
    const best = this.pickBestResult(results);
    this.recordProviderSuccess(best.model, Date.now() - start);
    return best;
  }

  pickBestResult(results) {
    return results.reduce((a, b) => {
      const aLen = (a?.content || '').trim().length;
      const bLen = (b?.content || '').trim().length;
      if (aLen === 0) return b;
      if (bLen === 0) return a;
      return aLen >= bLen ? a : b;
    });
  }

  recordProviderSuccess(provider, latency) {
    if (!this.stats[provider]) this.stats[provider] = { count: 0, totalLatency: 0, failures: 0 };
    this.stats[provider].count += 1;
    this.stats[provider].totalLatency += latency;
  }

  async routeSingleProvider(messages, model, enabled, start, stats) {
    const provider = model || this.pickBestProvider(enabled, stats);
    try {
      const result = await this.callProvider(provider, messages, stats);
      this.recordProviderSuccess(provider, Date.now() - start);
      if (!model) {
        const cacheKey = this.generateCacheKey(messages, { provider, enabledProviders: enabled });
        this.cache.set(cacheKey, result);
      }
      return result;
    } catch (err) {
      return this.tryFallbackProvider(provider, messages, enabled, stats, err);
    }
  }

  async tryFallbackProvider(provider, messages, enabled, stats, err) {
    console.error(`[Router] ${provider} failed:`, err.message);
    if (!this.stats[provider]) this.stats[provider] = { count: 0, totalLatency: 0, failures: 0 };
    this.stats[provider].failures = (this.stats[provider].failures || 0) + 1;

    const candidates = enabled.length
      ? enabled.filter((p) => p !== provider)
      : Object.keys(adapters.providers || {}).filter((p) => p !== provider);

    if (!candidates.length) throw err;

    const fallback = this.pickBestProvider(candidates, stats);
    console.log(`[Router] Falling back to ${fallback}`);
    return this.callProvider(fallback, messages, stats);
  }

  // LangGraph-style state machine execution path (deterministic orchestration)
  // States: validate -> resolve_provider -> call_provider -> finalize | error
  async routeStateMachine(messages, model, enabledProviders, stats = this.stats) {
    const enabled = Array.isArray(enabledProviders) ? enabledProviders : [];
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages array required');
    }

    const provider = model || this.pickBestProvider(enabled, stats);
    try {
      return await this.callProvider(provider, messages, stats);
    } catch (err) {
      const fallbacks = enabled.filter((p) => p !== provider);
      if (!fallbacks.length) throw err;
      const fallback = this.pickBestProvider(fallbacks, stats);
      return this.callProvider(fallback, messages, stats);
    }
  }

  // Dispatch to correct adapter with monitoring
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
      
      const latencyMs = Date.now() - start;
      if (!stats[provider]) stats[provider] = { count: 0, totalLatency: 0, failures: 0 };
      stats[provider].count += 1;
      stats[provider].totalLatency += latencyMs;
      
      // Log to monitoring system
      const cost = this.calculateCost(provider, messages);
      this.monitor.logLLMCall(provider, result.model || provider, latencyMs, cost, messages.length, true);
      
      return { ...result, model: provider };
    } catch (err) {
      const latencyMs = Date.now() - start;
      if (!stats[provider]) stats[provider] = { count: 0, totalLatency: 0, failures: 0 };
      stats[provider].failures = (stats[provider].failures || 0) + 1;
      
      // Log error
      this.monitor.logLLMCall(provider, provider, latencyMs, 0, 0, false);
      this.monitor.logError('LLM_CALL_FAILED', `${provider} failed: ${err.message}`, { provider });
      throw err;
    }
  }

  // Calculate cost for an LLM call
  calculateCost(provider, messages) {
    // Rough estimation (adjust based on actual pricing)
    const costs = {
      openai: 0.01,
      anthropic: 0.008,
      groq: 0.001,
      xai: 0.005,
      gemini: 0.0001,
    };
    const baseCost = costs[provider] || 0.01;
    const inputTokens = messages.reduce((sum, m) => sum + (m.content?.length || 0) / 4, 0);
    return (inputTokens / 1000) * baseCost;
  }

  // Advanced tool selection methods
  async selectTool(query) {
    try {
      const start = Date.now();
      const decision = await this.toolSelector.selectTool(query);
      const latencyMs = Date.now() - start;
      
      this.monitor.logToolSelection(
        query,
        decision.tool?.id || 'unknown',
        [decision.tool],
        0.95,
        'hybrid'
      );
      
      return { ...decision, latencyMs };
    } catch (err) {
      this.monitor.logError('TOOL_SELECTION_ERROR', err.message, { query });
      throw err;
    }
  }

  async hierarchicalRoute(query) {
    try {
      const start = Date.now();
      const decision = await this.toolSelector.hierarchicalRoute(query);
      const latencyMs = Date.now() - start;
      
      return { ...decision, latencyMs };
    } catch (err) {
      this.monitor.logError('HIERARCHICAL_ROUTE_ERROR', err.message, { query });
      throw err;
    }
  }

  // Get current routing metrics
  getMetrics() {
    return {
      cache: this.cache.getStats(),
      stats: this.stats,
      toolSelector: this.toolSelector.getStats(),
      monitoring: this.monitor.getSummary(),
    };
  }

  // Expose cache for testing
  clearCache() {
    this.cache.flushAll();
  }

  // Test/public API methods (aliases for cleaner testing)
  recordLatency(provider, latency) {
    this.recordProviderSuccess(provider, latency);
  }

  selectProvider(messages, options = {}, enabledProviders = []) {
    const { model } = options;
    if (model && enabledProviders.includes(model)) return model;
    if (enabledProviders.includes('anthropic')) return 'anthropic';
    if (enabledProviders.length > 0) return this.pickBestProvider(enabledProviders, this.stats);
    return 'openai';
  }

  getCacheKey(messages, meta = {}) {
    return this.generateCacheKey(messages, meta);
  }
}

module.exports = RouterAgent;
