// mock axios before loading adapter to avoid ESM issues
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({ post: jest.fn(), get: jest.fn() }),
}));

const { OrchestrationClient } = require('../adapters/orchestration');

describe('OrchestrationClient', () => {
  const fakeToken = 'fake-token';
  const client = new OrchestrationClient(fakeToken);

  // replace internal axios instance with simple spies
  beforeEach(() => {
    client.client = {
      post: jest.fn(),
      get: jest.fn(),
    };
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
});
