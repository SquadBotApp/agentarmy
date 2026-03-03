const { createRateLimiter, parseAllowedOrigins } = require('../security');

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

describe('security helpers', () => {
  test('parseAllowedOrigins returns dev defaults when unset', () => {
    const out = parseAllowedOrigins('', false);
    expect(out).toContain('http://localhost:3000');
  });

  test('rate limiter blocks after max requests', () => {
    let now = 1000;
    const limiter = createRateLimiter({
      windowMs: 60_000,
      maxRequests: 2,
      nowFn: () => now,
      keyFn: () => 'k',
    });
    const req = { ip: '1.1.1.1', path: '/x' };
    const res = mockRes();
    let nextCount = 0;
    const next = () => { nextCount += 1; };

    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);

    expect(nextCount).toBe(2);
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('rate limit exceeded');

    now += 61_000;
    const res2 = mockRes();
    limiter(req, res2, next);
    expect(nextCount).toBe(3);
  });

  test('rate limiter prunes stale keys when oversized', () => {
    let now = 1000;
    const limiter = createRateLimiter({
      windowMs: 10,
      maxRequests: 1,
      maxEntries: 2,
      nowFn: () => now,
      keyFn: (req) => req.key,
    });
    const mkReq = (key) => ({ key });
    const next = () => {};
    limiter(mkReq('a'), mockRes(), next);
    limiter(mkReq('b'), mockRes(), next);
    now = 2000; // both stale
    limiter(mkReq('c'), mockRes(), next);
    expect(limiter._store.size).toBeLessThanOrEqual(2);
  });
});
