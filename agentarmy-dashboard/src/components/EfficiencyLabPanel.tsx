import React from "react";

import { EfficiencyPlan, fetchEfficiencyPlan } from "../core/efficiencyPlannerApi";

export function EfficiencyLabPanel() {
  const [goal, setGoal] = React.useState("Ship mobile-ready orchestration with strong governance");
  const [vendors, setVendors] = React.useState<string[]>(["apple", "google"]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [plan, setPlan] = React.useState<EfficiencyPlan | null>(null);

  function toggleVendor(vendor: string) {
    setVendors((prev) =>
      prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor]
    );
  }

  async function runPlan() {
    setLoading(true);
    setError("");
    try {
      const result = await fetchEfficiencyPlan(goal, vendors);
      setPlan(result);
    } catch (err) {
      setError(String(err));
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>Efficiency Lab</h3>
      <p>Generate an optimized internal execution graph before running a mission.</p>
      <div style={{ marginBottom: "0.5rem" }}>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          style={{ width: "100%", maxWidth: 700 }}
        />
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        {["apple", "samsung", "google", "amazon"].map((vendor) => (
          <label key={vendor} style={{ marginRight: "1rem" }}>
            <input
              type="checkbox"
              checked={vendors.includes(vendor)}
              onChange={() => toggleVendor(vendor)}
            />{" "}
            {vendor}
          </label>
        ))}
      </div>
      <button onClick={runPlan} disabled={loading}>
        {loading ? "Planning..." : "Generate Plan"}
      </button>
      {error && <p>{error}</p>}
      {plan && (
        <div style={{ marginTop: "0.75rem" }}>
          <div>
            <strong>Framework:</strong> {plan.recommended_framework}
          </div>
          <div>
            <strong>Intents:</strong> {plan.intents.join(", ")}
          </div>
          <div>
            <strong>Toolchain:</strong> {plan.toolchain.join(", ")}
          </div>
          <div>
            <strong>Integrations:</strong> {plan.integration_targets.join(", ")}
          </div>
        </div>
      )}
    </section>
  );
}
