import React from "react";

import { mobilePlugins } from "../core/mobilePlugins";
import { runMobileDeployment } from "../core/workflow";

export function MobilePluginsPanel() {
  const [selectedVendors, setSelectedVendors] = React.useState<string[]>([
    "apple",
    "google",
  ]);
  const [goal, setGoal] = React.useState("Publish mobile workflow integrations");
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function toggleVendor(vendor: string) {
    setSelectedVendors((prev) =>
      prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor]
    );
  }

  async function deploy() {
    if (!selectedVendors.length) {
      setStatus("Select at least one mobile vendor.");
      return;
    }
    setLoading(true);
    setStatus("Deploying mobile integrations...");
    try {
      const result = await runMobileDeployment(
        goal,
        selectedVendors as Array<"apple" | "samsung" | "google" | "amazon">
      );
      setStatus(`Deployment submitted: ${result.job_id || "ok"}`);
    } catch (err) {
      setStatus(`Deployment failed: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>Mobile Plugins</h3>
      <p>Download connectors for Apple, Samsung, Google, and Amazon mobile ecosystems.</p>
      <div style={{ marginBottom: "0.75rem" }}>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          style={{ width: "100%", maxWidth: 520 }}
          placeholder="Mobile deployment goal"
        />
      </div>
      <div style={{ marginBottom: "0.75rem" }}>
        {["apple", "samsung", "google", "amazon"].map((vendor) => (
          <label key={vendor} style={{ marginRight: "1rem" }}>
            <input
              type="checkbox"
              checked={selectedVendors.includes(vendor)}
              onChange={() => toggleVendor(vendor)}
            />{" "}
            {vendor}
          </label>
        ))}
      </div>
      <div style={{ marginBottom: "0.75rem" }}>
        <button onClick={deploy} disabled={loading}>
          {loading ? "Deploying..." : "Deploy Mobile Integrations"}
        </button>
      </div>
      {status && <p>{status}</p>}
      <ul>
        {mobilePlugins.map((plugin) => (
          <li key={plugin.id} style={{ marginBottom: "0.75rem" }}>
            <strong>{plugin.name}</strong> ({plugin.ecosystem})
            <div>{plugin.description}</div>
            <a href={plugin.downloadUrl} target="_blank" rel="noreferrer">
              Download
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
