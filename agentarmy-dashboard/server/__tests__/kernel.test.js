const kernel = require('../kernel');

function makeDbStub() {
  const configStore = {};
  const events = [];
  return {
    config: {
      get: (k) => configStore[k],
      set: (k, v) => { configStore[k] = v; },
    },
    kernelEvents: {
      record: (event) => {
        events.push(event);
        return { id: events.length, event_hash: `h${events.length}`, prev_hash: events.length > 1 ? `h${events.length - 1}` : null };
      },
      list: (limit = 100) => events.slice(-limit).reverse(),
    },
    _events: events,
  };
}

describe('kernel policy engine', () => {
  test('allows runtime action for user', () => {
    const db = makeDbStub();
    const decision = kernel.authorizeAction(db, {
      action: 'runtime.comms.broadcast',
      user: { username: 'u1', role: 'user' },
      context: {},
    });
    expect(decision.allowed).toBe(true);
  });

  test('blocks high-risk user action', () => {
    const db = makeDbStub();
    const decision = kernel.authorizeAction(db, {
      action: 'runtime.superpowers.autonomous_pr.high_risk',
      user: { username: 'u1', role: 'user' },
      context: {},
    });
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe('blocked');
  });

  test('pending approval for admin high-risk without token', async () => {
    const db = makeDbStub();
    const result = await kernel.executeCommand(db, {
      action: 'runtime.superpowers.autonomous_pr.high_risk',
      user: { username: 'admin', role: 'admin' },
      payload: { goal: 'x' },
      handlers: {
        'runtime.superpowers.autonomous_pr.high_risk': async () => ({ ok: true }),
      },
    });
    expect(result.status).toBe('pending_approval');
  });
});
