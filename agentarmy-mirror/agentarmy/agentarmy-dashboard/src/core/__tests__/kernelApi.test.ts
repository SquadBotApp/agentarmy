import { executeKernelCommand, fetchKernelPolicies, fetchKernelState } from "../kernelApi";

const originalFetch = global.fetch;

describe("kernelApi contracts", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetchKernelState hits kernel state endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ event_chain: {} }) });
    const out = await fetchKernelState();
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/kernel/state");
    expect((out as any).event_chain).toBeDefined();
  });

  it("fetchKernelPolicies hits kernel policies endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ rules: [] }) });
    const out = await fetchKernelPolicies();
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/kernel/policies");
    expect(Array.isArray((out as any).rules)).toBe(true);
  });

  it("executeKernelCommand posts action payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ status: "dry_run" }),
    });
    const out = await executeKernelCommand("runtime.comms.broadcast", { message: "x" }, true);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/kernel/commands/execute");
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.action).toBe("runtime.comms.broadcast");
    expect((out as any).status).toBe("dry_run");
  });
});
