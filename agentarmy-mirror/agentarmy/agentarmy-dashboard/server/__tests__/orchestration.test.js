// mock axios before loading adapter to avoid ESM issues
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({ post: jest.fn(), get: jest.fn() }),
}));

const { OrchestrationClient } = require('../adapters/orchestration');

describe('OrchestrationClient', () => {
  const fakeToken = 'fake-token';
  const client = new OrchestrationClient(fakeToken, { retryAttempts: 0 });

  // replace internal axios instance with simple spies
  beforeEach(() => {
    const mockClient = {
      post: jest.fn(),
      get: jest.fn(),
    };
    client.client = mockClient;
    client.clients = [mockClient];
    client.baseUrls = ['http://primary.test'];
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('submitTask sends correct payload and returns data (legacy form)', async () => {
    const responseData = { job_id: 'job-1', status: 'pending' };
    client.client.post.mockResolvedValue({ data: responseData });

    const result = await client.submitTask('do thing', { priority: 'high' });
    expect(client.client.post).toHaveBeenCalledWith('/orchestrate', {
      task: 'do thing',
      priority: 'high',
      context: {},
      model_preferences: {},
      integrations: {},
      framework: 'native',
    });
    expect(result).toBe(responseData);
  });

  test('submitTask accepts advanced orchestrator payload', async () => {
    const responseData = { nextTaskId: 't1' };
    client.client.post.mockResolvedValue({ data: responseData });

    const payload = {
      job: { goal: 'foo', constraints: {} },
      state: { tasks: [], history: [] },
      previous_zpe: 0.3,
    };
    const result = await client.submitTask(payload);
    expect(client.client.post).toHaveBeenCalledWith('/orchestrate', payload);
    expect(result).toBe(responseData);
  });

  test('getJobStatus returns remote job data', async () => {
    const jobData = { job_id: 'job-1', status: 'completed' };
    client.client.get.mockResolvedValue({ data: jobData });

    const result = await client.getJobStatus('job-1');
    expect(client.client.get).toHaveBeenCalledWith('/jobs/job-1');
    expect(result).toBe(jobData);
  });

  test('listJobs filters when status passed', async () => {
    const listing = [{ job_id: 'job-1', status: 'completed' }];
    client.client.get.mockResolvedValue({ data: listing });

    const result = await client.listJobs('completed');
    expect(client.client.get).toHaveBeenCalledWith('/jobs?status=completed');
    expect(result).toBe(listing);
  });

  test('healthCheck handles failure gracefully', async () => {
    client.client.get.mockRejectedValue(new Error('network')); 
    const result = await client.healthCheck();
    expect(result.status).toBe('unhealthy');
  });

  test('getCapabilities returns capability payload', async () => {
    const data = { frameworks: ['native', 'langgraph'] };
    client.client.get.mockResolvedValue({ data });
    const result = await client.getCapabilities();
    expect(client.client.get).toHaveBeenCalledWith('/capabilities');
    expect(result).toBe(data);
  });

  test('getEfficiencyPlan posts payload and returns plan', async () => {
    const payload = { goal: 'Ship mobile feature', mobile_vendors: ['apple'] };
    const data = { recommended_framework: 'langgraph' };
    client.client.post.mockResolvedValue({ data });
    const result = await client.getEfficiencyPlan(payload);
    expect(client.client.post).toHaveBeenCalledWith('/efficiency/plan', payload);
    expect(result).toBe(data);
  });

  test('getSocialIntel posts payload and validates response', async () => {
    const payload = {
      goal: 'brand defense',
      profiles: [{ platform: 'x', handle: '@agentarmy' }],
      signals: [],
    };
    const data = {
      profiles: [{ platform: 'x' }],
      credibility_summary: { total_signals: 0, credible_count: 0, low_confidence_count: 0, average_score: 0 },
    };
    client.client.post.mockResolvedValue({ data });
    const result = await client.getSocialIntel(payload);
    expect(client.client.post).toHaveBeenCalledWith('/social/intel/analyze', payload);
    expect(result).toBe(data);
  });

  test('getSshPlan posts payload and validates response', async () => {
    const payload = {
      goal: 'Harden SSH',
      profiles: [{ host: '10.0.0.8', profile_type: 'linux_server', auth_mode: 'ed25519_key' }],
    };
    const data = {
      profiles: [{ host: '10.0.0.8' }],
      summary: { total_profiles: 1, high_risk_profiles: 0, ready_profiles: 1 },
    };
    client.client.post.mockResolvedValue({ data });
    const result = await client.getSshPlan(payload);
    expect(client.client.post).toHaveBeenCalledWith('/ssh/plan', payload);
    expect(result).toBe(data);
  });

  test('broadcastComms posts payload and validates response', async () => {
    const payload = {
      message: 'Bridge online',
      targets: ['3cx', 'claude', 'copy'],
    };
    const data = {
      targets: ['threecx_phone', 'claude_channel', 'microsoft_copilot_studio'],
      results: {},
    };
    client.client.post.mockResolvedValue({ data });
    const result = await client.broadcastComms(payload);
    expect(client.client.post).toHaveBeenCalledWith('/comms/broadcast', payload);
    expect(result).toBe(data);
  });

  test('submitTask rejects null payload', async () => {
    await expect(client.submitTask(null)).rejects.toThrow('submitTask requires task or payload');
  });

  test('getJobStatus rejects empty jobId', async () => {
    await expect(client.getJobStatus('')).rejects.toThrow('getJobStatus requires jobId');
  });

  test('listJobs encodes status query value', async () => {
    client.client.get.mockResolvedValue({ data: [] });
    await client.listJobs('in progress');
    expect(client.client.get).toHaveBeenCalledWith('/jobs?status=in%20progress');
  });

  test('waitForCompletion validates polling inputs', async () => {
    await expect(client.waitForCompletion('', 5000, 50)).rejects.toThrow('waitForCompletion requires jobId');
    await expect(client.waitForCompletion('job-1', 0, 50)).rejects.toThrow('maxWaitMs');
    await expect(client.waitForCompletion('job-1', 5000, 0)).rejects.toThrow('pollIntervalMs');
  });

  test('submitTask rejects malformed advanced payload', async () => {
    await expect(client.submitTask({ foo: 'bar' })).rejects.toThrow('advanced payload must include job object');
  });

  test('failover tries secondary connector when primary fails', async () => {
    const primary = { post: jest.fn(), get: jest.fn() };
    const secondary = { post: jest.fn(), get: jest.fn() };
    primary.post.mockRejectedValue(new Error('primary down'));
    secondary.post.mockResolvedValue({ data: { job_id: 'job-failover', status: 'pending' } });

    client.clients = [primary, secondary];
    client.baseUrls = ['http://primary.test', 'http://secondary.test'];
    client.connectorHealth = {
      'http://primary.test': { healthy: true, success_count: 0, failure_count: 0, last_error: null, last_checked_at: null },
      'http://secondary.test': { healthy: true, success_count: 0, failure_count: 0, last_error: null, last_checked_at: null },
    };

    const result = await client.submitTask('deploy with failover');
    expect(result.job_id).toBe('job-failover');
    expect(primary.post).toHaveBeenCalledTimes(1);
    expect(secondary.post).toHaveBeenCalledTimes(1);

    const health = client.getConnectorHealth();
    const primaryHealth = health.connectors.find((c) => c.base_url === 'http://primary.test');
    const secondaryHealth = health.connectors.find((c) => c.base_url === 'http://secondary.test');
    expect(primaryHealth.healthy).toBe(false);
    expect(secondaryHealth.healthy).toBe(true);
  });
});
