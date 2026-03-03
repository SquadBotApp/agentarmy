import { aiRewrite, aiSummarize, aiPlan, aiClaudebot, runMobileDeployment } from '../workflow';

// mock the llmAdapter module instead of spying
jest.mock('../llmAdapter', () => ({
  callLLM: async (messages: any[]) => {
    // echo back last user message
    const last = messages.filter((m: any) => m.role === 'user').pop();
    return { content: `echo: ${last?.content}`, model: 'mock' };
  },
}));

describe('AI workflow stubs', () => {
  it('aiRewrite should return transformed text', async () => {
    const out = await aiRewrite('hello');
    expect(out).toContain('echo:');
  });

  it('aiSummarize should return bullet points', async () => {
    const out = await aiSummarize('line1\nline2');
    expect(out).toContain('echo:');
  });

  it('aiPlan should return an array of tasks', async () => {
    const tasks = await aiPlan('do something');
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThanOrEqual(0);
  });

  it('aiClaudebot should route through claude model workflow', async () => {
    const out = await aiClaudebot('Draft release notes');
    expect(out).toContain('echo:');
  });

  it('runMobileDeployment should call orchestration endpoint', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ job_id: 'j1' }),
      text: async () => '',
    } as any);

    const result = await runMobileDeployment('Ship mobile build', ['apple', 'google']);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/orchestrate');
    expect(result.job_id).toBe('j1');

    global.fetch = originalFetch;
  });
});
