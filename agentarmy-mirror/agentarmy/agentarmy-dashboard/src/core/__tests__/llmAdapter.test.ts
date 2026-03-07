import { callLLM, callMultiModel, LLMMessage } from '../llmAdapter';

// mock global fetch
const originalFetch = global.fetch;

describe('llmAdapter', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.clear();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends Authorization header if token present', async () => {
    localStorage.setItem('agent-token', 'tok123');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: 'hi', model: 'openai' }),
    });
    const msg: LLMMessage = { role: 'user', content: 'hello' };
    const res = await callLLM([msg]);
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('Bearer tok123');
    expect(res.content).toBe('hi');
  });

  it('callMultiModel returns multiple results', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ content: 'foo', model: 'm1' }) });
    const msg: LLMMessage = { role: 'user', content: 'test' };
    const results = await callMultiModel([msg], ['m1','m2']);
    expect(results).toHaveLength(2);
  });
});