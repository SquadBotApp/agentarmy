import { fetchEfficiencyPlan } from "../efficiencyPlannerApi";

describe("efficiencyPlannerApi", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("sends framework when provided", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        goal: "x",
        intents: ["coding"],
        recommended_framework: "frabric",
        toolchain: [],
        integration_targets: [],
        parallel_tracks: [],
        notes: [],
      }),
    } as unknown as Response);

    await fetchEfficiencyPlan("goal", ["apple"], "frabric");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchArgs[1].body);
    expect(body.framework).toBe("frabric");
    expect(body.mobile_vendors).toEqual(["apple"]);
  });

  test("omits framework when not provided", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        goal: "x",
        intents: ["analysis"],
        recommended_framework: "native",
        toolchain: [],
        integration_targets: [],
        parallel_tracks: [],
        notes: [],
      }),
    } as unknown as Response);

    await fetchEfficiencyPlan("goal", ["google"]);

    const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchArgs[1].body);
    expect(body.framework).toBeUndefined();
    expect(body.mobile_vendors).toEqual(["google"]);
  });
});
