import { listProfiles, saveProfile } from "../profileStoreApi";

const originalFetch = global.fetch;

describe("profileStoreApi contracts", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("listProfiles requests the kind-specific endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        kind: "social",
        profiles: [{ kind: "social", name: "default", data: { enabled: true } }],
      }),
    });
    const profiles = await listProfiles("social");
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/profiles/social");
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe("default");
  });

  it("saveProfile posts canonical body", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => "",
    });
    await saveProfile("ssh", "prod", { host: "10.0.0.8" });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain("/profiles/ssh");
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.name).toBe("prod");
    expect(body.data.host).toBe("10.0.0.8");
  });
});
