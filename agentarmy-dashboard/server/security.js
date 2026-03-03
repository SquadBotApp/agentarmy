function parseAllowedOrigins(raw, isProduction = false) {
  const explicit = String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (explicit.length > 0) return explicit;
  if (isProduction) return [];
  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4000',
    'http://127.0.0.1:4000',
  ];
}

function createCorsDelegate(options = {}) {
  const isProduction = Boolean(options.isProduction);
  const allowlist = parseAllowedOrigins(options.allowedOrigins, isProduction);
  return (req, callback) => {
    const origin = req.header('Origin');
    if (!origin && !isProduction) {
      callback(null, { origin: true, credentials: true });
      return;
    }
    if (allowlist.includes(String(origin || ''))) {
      callback(null, { origin: true, credentials: true });
      return;
    }
    callback(null, { origin: false });
  };
}

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

function createRateLimiter(options = {}) {
  const windowMs = Number.isFinite(options.windowMs) ? options.windowMs : 60_000;
  const maxRequests = Number.isFinite(options.maxRequests) ? options.maxRequests : 30;
  const maxEntries = Number.isFinite(options.maxEntries) ? options.maxEntries : 5000;
  const nowFn = typeof options.nowFn === 'function' ? options.nowFn : () => Date.now();
  const keyFn = typeof options.keyFn === 'function'
    ? options.keyFn
    : (req) => `${req.ip || 'unknown'}:${req.path || ''}`;
  const store = new Map();

  function middleware(req, res, next) {
    const now = nowFn();
    if (store.size >= maxEntries) {
      for (const [k, v] of store.entries()) {
        if (now >= v.resetAt) store.delete(k);
      }
      if (store.size > maxEntries) {
        const keys = Array.from(store.keys()).slice(0, store.size - maxEntries);
        for (const k of keys) store.delete(k);
      }
    }
    const key = String(keyFn(req) || 'unknown');
    const record = store.get(key);
    if (!record || now >= record.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      if (store.size > maxEntries) {
        const keys = Array.from(store.keys()).slice(0, store.size - maxEntries);
        for (const k of keys) store.delete(k);
      }
      next();
      return;
    }
    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        error: 'rate limit exceeded',
        retry_after_seconds: retryAfterSeconds,
      });
      return;
    }
    record.count += 1;
    store.set(key, record);
    next();
  }

  middleware._store = store;
  return middleware;
}

function computeSecurityPosture(env = process.env, isProduction = false) {
  const checks = [
    {
      id: 'jwt_secret',
      ok: String(env.JWT_SECRET || '').trim().length >= 16,
      required_in_production: true,
      message: 'JWT secret length should be at least 16 characters.',
    },
    {
      id: 'approval_token_secret',
      ok: String(env.APPROVAL_TOKEN_SECRET || '').trim().length >= 16
        || String(env.JWT_SECRET || '').trim().length >= 16,
      required_in_production: true,
      message: 'Approval signing secret should be set and strong.',
    },
    {
      id: 'cors_allowlist',
      ok: parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS || '', isProduction).length > 0,
      required_in_production: true,
      message: 'CORS allowlist should include explicit trusted origins.',
    },
    {
      id: 'auth_users_configured',
      ok: Boolean(String(env.AUTH_USERS_JSON || '').trim())
        || String(env.ALLOW_INSECURE_DEMO_AUTH || '').toLowerCase() === 'true',
      required_in_production: true,
      message: 'Auth users must be configured or explicit demo auth enabled.',
    },
    {
      id: 'root_override_disabled',
      ok: String(env.ALLOW_ROOT_OVERRIDE || '').toLowerCase() !== 'true',
      required_in_production: false,
      message: 'Root override should remain disabled except break-glass windows.',
    },
  ];

  const required = checks.filter((c) => !isProduction || c.required_in_production);
  const passed = required.filter((c) => c.ok).length;
  return {
    generated_at: new Date().toISOString(),
    is_production: isProduction,
    score: required.length ? Math.round((passed / required.length) * 100) : 100,
    status: required.every((c) => c.ok) ? 'pass' : 'warn',
    checks,
  };
}

module.exports = {
  parseAllowedOrigins,
  createCorsDelegate,
  securityHeaders,
  createRateLimiter,
  computeSecurityPosture,
};
