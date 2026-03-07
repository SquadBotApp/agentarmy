const educationCenter = require('../educationCenter');

function makeDbStub() {
  const store = {};
  return {
    config: {
      get: (k) => store[k] || null,
      set: (k, v) => { store[k] = v; },
    },
  };
}

describe('educationCenter domain', () => {
  test('starts active session for safe topic', () => {
    const db = makeDbStub();
    const out = educationCenter.startSession(db, {
      topic: 'python fundamentals',
      learner: { learner_id: 'u1', age: 16, level: 'beginner', style: 'mixed' },
    }, 'u1');
    expect(out.status).toBe('active');
    expect(out.session).toBeDefined();
    expect(out.lesson).toBeDefined();
  });

  test('blocks restricted topic', () => {
    const db = makeDbStub();
    const out = educationCenter.startSession(db, {
      topic: 'malware exploitation',
      learner: { learner_id: 'u2', age: 30 },
    }, 'u2');
    expect(out.status).toBe('blocked');
  });

  test('requires approval for mature topic for minors', () => {
    const db = makeDbStub();
    const out = educationCenter.startSession(db, {
      topic: 'violence awareness',
      learner: { learner_id: 'u3', age: 12 },
    }, 'u3');
    expect(out.status).toBe('pending_approval');
  });

  test('records assessment and issues reward', () => {
    const db = makeDbStub();
    const session = educationCenter.startSession(db, {
      topic: 'math basics',
      learner: { learner_id: 'u4', age: 18 },
    }, 'u4');
    const out = educationCenter.submitAssessment(db, {
      session_id: session.session.session_id,
      score: 85,
    }, 'u4');
    expect(out.status).toBe('recorded');
    expect(out.mastery_after).toBeGreaterThanOrEqual(out.mastery_before);
    expect(out.reward_issued).toBeGreaterThan(0);
  });

  test('blocks user from creating session for another learner id', () => {
    const db = makeDbStub();
    const out = educationCenter.startSession(db, {
      topic: 'python fundamentals',
      learner: { learner_id: 'other-user', age: 20 },
    }, 'u5', { role: 'user' });
    expect(out.status).toBe('blocked');
  });

  test('non-admin cannot assess another learner session', () => {
    const db = makeDbStub();
    const session = educationCenter.startSession(db, {
      topic: 'math basics',
      learner: { learner_id: 'u6', age: 18 },
    }, 'u6', { role: 'user' });
    expect(() => educationCenter.submitAssessment(db, {
      session_id: session.session.session_id,
      score: 90,
    }, 'u7', { role: 'user' })).toThrow('forbidden session access');
  });

  test('state view is scoped for non-admin viewer', () => {
    const db = makeDbStub();
    educationCenter.startSession(db, {
      topic: 'math basics',
      learner: { learner_id: 'u8', age: 18 },
    }, 'u8', { role: 'user' });
    educationCenter.startSession(db, {
      topic: 'science basics',
      learner: { learner_id: 'u9', age: 18 },
    }, 'u9', { role: 'user' });
    const out = educationCenter.getStateView(db, { viewerRole: 'user', viewerId: 'u8' });
    expect(out.summary.learners_total).toBe(1);
    expect(out.summary.sessions_total).toBe(1);
    expect(out.learners[0].learner_id).toBe('u8');
  });
});
