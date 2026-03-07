const superpowers = require('../superpowers');

function makeDbStub() {
  const store = {};
  return {
    config: {
      get: (k) => store[k] || null,
      set: (k, v) => { store[k] = v; },
    },
    _internals: {
      redactForAudit: (value) => {
        if (!value || typeof value !== 'object') return value;
        const copy = JSON.parse(JSON.stringify(value));
        if (copy.token) copy.token = '[REDACTED]';
        if (copy.result && copy.result.token) copy.result.token = '[REDACTED]';
        return copy;
      },
    },
  };
}

describe('superpowers memory redaction', () => {
  test('appendMemory stores redacted entry', () => {
    const db = makeDbStub();
    superpowers.appendMemory(db, { type: 'x', token: 'secret-token', result: { token: 'abc' } });
    const tower = superpowers.buildControlTower({
      ...db,
      performance: { getAgentStats: () => [] },
      decisions: { getRecent: () => [] },
      jobs: { list: () => [] },
    });
    const item = tower.recent_memory[0];
    expect(item.token).toBe('[REDACTED]');
    expect(item.result.token).toBe('[REDACTED]');
  });
});

