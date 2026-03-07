import {
  compileToolGraph,
  executeDsl,
  fetchControlTower,
  installSkill,
  runAutonomousPr,
  runSelfHeal,
  suggestPairEdit,
} from "../superpowersApi";

const originalFetch = global.fetch;

describe("superpowersApi contracts", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("calls autonomous-pr endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ run_id: "r1" }) });
    const out = await runAutonomousPr("Ship auth", true);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/superpowers/autonomous-pr");
    expect((out as any).run_id).toBe("r1");
  });

  it("calls compile tool graph endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ graph_id: "g1" }) });
    const out = await compileToolGraph("Build graph");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/superpowers/tool-graph/compile");
    expect((out as any).graph_id).toBe("g1");
  });

  it("calls self-heal endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ run_id: "h1" }) });
    const out = await runSelfHeal("stabilize");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/superpowers/self-heal/run");
    expect((out as any).run_id).toBe("h1");
  });

  it("calls pair suggest endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ file: "x" }) });
    const out = await suggestPairEdit("x", "improve");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/superpowers/pair/suggest");
    expect((out as any).file).toBe("x");
  });

  it("calls install skill endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    const out = await installSkill("auto-pr-v1");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/superpowers/marketplace/install");
    expect((out as any).ok).toBe(true);
  });

  it("calls dsl execute endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ parsed: { intent: "ship" } }) });
    const out = await executeDsl("ship x");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/superpowers/dsl/execute");
    expect((out as any).parsed.intent).toBe("ship");
  });

  it("calls control tower endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: { jobs_total: 1, jobs_completed: 1, jobs_failed: 0, recent_decisions: 1, installed_skills: 0, memory_items: 0 } }),
    });
    const out = await fetchControlTower();
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/superpowers/control-tower");
    expect(out.summary.jobs_total).toBe(1);
  });
});
