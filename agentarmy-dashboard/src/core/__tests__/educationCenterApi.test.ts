import {
  fetchEducationState,
  generateEducationSimulation,
  startEducationSession,
  submitEducationAssessment,
} from "../educationCenterApi";

const originalFetch = global.fetch;

describe("educationCenterApi contracts", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetchEducationState hits education state endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ summary: {} }) });
    const out = await fetchEducationState();
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/education/state");
    expect((out as any).summary).toBeDefined();
  });

  it("startEducationSession posts payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ status: "active" }) });
    const out = await startEducationSession({ topic: "python" });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/education/session/start");
    expect((out as any).status).toBe("active");
  });

  it("submitEducationAssessment posts payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ status: "recorded" }) });
    const out = await submitEducationAssessment({ session_id: "s1", score: 80 });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/education/session/assess");
    expect((out as any).status).toBe("recorded");
  });

  it("generateEducationSimulation posts payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify({ simulation_id: "sim-1" }) });
    const out = await generateEducationSimulation({ topic: "math" });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/education/simulation/generate");
    expect((out as any).simulation_id).toBeDefined();
  });
});

