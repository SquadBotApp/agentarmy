const dbModule = require('../db');

describe('db audit redaction', () => {
  test('redacts sensitive keys recursively', () => {
    const input = {
      password: 'abc123',
      nested: {
        api_key: 'xyz',
        Authorization: 'Bearer topsecret',
        ok: 'value',
      },
    };
    const out = dbModule._internals.redactForAudit(input);
    expect(out.password).toBe('[REDACTED]');
    expect(out.nested.api_key).toBe('[REDACTED]');
    expect(out.nested.Authorization).toBe('[REDACTED]');
    expect(out.nested.ok).toBe('value');
  });
});

