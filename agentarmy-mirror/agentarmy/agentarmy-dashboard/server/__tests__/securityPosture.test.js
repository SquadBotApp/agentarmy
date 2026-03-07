const { computeSecurityPosture } = require('../security');

describe('security posture', () => {
  test('passes with strong production config', () => {
    const posture = computeSecurityPosture({
      JWT_SECRET: '1234567890abcdef1234567890abcdef',
      APPROVAL_TOKEN_SECRET: 'abcdef1234567890abcdef1234567890',
      CORS_ALLOWED_ORIGINS: 'https://app.example.com',
      AUTH_USERS_JSON: '{"admin":{"password":"x","role":"admin"}}',
      ALLOW_ROOT_OVERRIDE: 'false',
    }, true);
    expect(posture.status).toBe('pass');
    expect(posture.score).toBe(100);
  });

  test('warns with weak production config', () => {
    const posture = computeSecurityPosture({
      JWT_SECRET: 'short',
      CORS_ALLOWED_ORIGINS: '',
      AUTH_USERS_JSON: '',
      ALLOW_INSECURE_DEMO_AUTH: 'false',
    }, true);
    expect(posture.status).toBe('warn');
    expect(posture.score).toBeLessThan(100);
  });
});

