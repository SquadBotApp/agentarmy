const RouterAgent = require('../router_agent');

describe('RouterAgent', () => {
  let router;

  beforeEach(() => {
    router = new RouterAgent();
  });

  test('should initialize with empty cache and stats', () => {
    const metrics = router.getMetrics();
    expect(metrics.cache.keys).toEqual([]);
    expect(Object.keys(metrics.stats)).toEqual([]);
  });

  test('should record provider latency', () => {
    router.recordLatency('openai', 150);
    router.recordLatency('openai', 200);
    router.recordLatency('anthropic', 100);

    const metrics = router.getMetrics();
    expect(metrics.stats.openai).toBeDefined();
    expect(metrics.stats.openai.count).toBe(2);
    expect(metrics.stats.anthropic).toBeDefined();
    expect(metrics.stats.anthropic.count).toBe(1);
  });

  test('should select provider with lowest average latency', async () => {
    router.recordLatency('openai', 100);
    router.recordLatency('openai', 100);
    router.recordLatency('anthropic', 200);
    router.recordLatency('anthropic', 200);

    // selectProvider should prefer openai (avg 100 vs 200)
    const selected = router.selectProvider([], {}, ['openai', 'anthropic']);
    expect(selected).toBe('openai');
  });

  test('should handle caching with hashed message keys', async () => {
    const messages = [{ role: 'user', content: 'hello' }];
    
    // Mock a cache entry
    const key = router.getCacheKey(messages);
    router.cache.set(key, { content: 'cached response', model: 'mock' });

    const cached = router.cache.get(key);
    expect(cached).toBeDefined();
    expect(cached.content).toBe('cached response');
  });

  test('should return first available provider when none specified', () => {
    const providers = ['openai', 'anthropic', 'groq'];
    const selected = router.selectProvider([], {}, providers);
    expect(providers).toContain(selected);
  });

  test('should prefer explicitly requested provider if available', () => {
    const providers = ['openai', 'anthropic', 'groq'];
    const selected = router.selectProvider([], { model: 'anthropic' }, providers);
    expect(selected).toBe('anthropic');
  });
});
