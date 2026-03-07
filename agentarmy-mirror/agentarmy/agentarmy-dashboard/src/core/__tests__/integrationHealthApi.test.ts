import { fetchConfigHealth, fetchConnectorHealth } from "../integrationHealthApi";

const originalFetch = global.fetch;

describe("integrationHealthApi contracts", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetchConnectorHealth calls expected endpoint and returns payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        trace_id: "t1",
        orchestration_service: { status: "healthy" },
        connector_health: { base_urls: [], connectors: [] },
      }),
    });
    const result = await fetchConnectorHealth();
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/orchestrate/connectors/health");
    expect(result.trace_id).toBe("t1");
  });

  it("fetchConfigHealth calls expected endpoint and returns payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        trace_id: "t2",
        configured_count: 3,
        total_count: 8,
        checks: [],
      }),
    });
    const result = await fetchConfigHealth();
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/orchestrate/config-health");
    expect(result.configured_count).toBe(3);
  });
});
