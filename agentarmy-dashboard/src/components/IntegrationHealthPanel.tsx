import React from "react";

import { fetchConfigHealth, fetchConnectorHealth, ConfigHealthPayload, ConnectorHealthPayload } from "../core/integrationHealthApi";
import { listProfiles, saveProfile, ProfileKind, StoredProfile } from "../core/profileStoreApi";

export function IntegrationHealthPanel() {
  const [connectorHealth, setConnectorHealth] = React.useState<ConnectorHealthPayload | null>(null);
  const [configHealth, setConfigHealth] = React.useState<ConfigHealthPayload | null>(null);
  const [error, setError] = React.useState("");

  const [kind, setKind] = React.useState<ProfileKind>("social");
  const [name, setName] = React.useState("default");
  const [jsonData, setJsonData] = React.useState('{"enabled": true}');
  const [profiles, setProfiles] = React.useState<StoredProfile[]>([]);
  const [profilesError, setProfilesError] = React.useState("");

  async function refreshHealth() {
    setError("");
    try {
      const [ch, cfg] = await Promise.all([fetchConnectorHealth(), fetchConfigHealth()]);
      setConnectorHealth(ch);
      setConfigHealth(cfg);
    } catch (err) {
      setError(String(err));
    }
  }

  async function refreshProfiles() {
    setProfilesError("");
    try {
      const result = await listProfiles(kind);
      setProfiles(result);
    } catch (err) {
      setProfilesError(String(err));
    }
  }

  async function persistProfile() {
    setProfilesError("");
    try {
      const parsed = JSON.parse(jsonData);
      await saveProfile(kind, name, parsed);
      await refreshProfiles();
    } catch (err) {
      setProfilesError(String(err));
    }
  }

  React.useEffect(() => {
    refreshHealth();
    refreshProfiles();
  }, [kind]);

  return (
    <section>
      <h3>Integration Health</h3>
      <button onClick={refreshHealth}>Refresh Health</button>
      {error && <p>{error}</p>}
      {configHealth && (
        <div>
          <strong>Config Readiness:</strong> {configHealth.configured_count}/{configHealth.total_count}
        </div>
      )}
      {connectorHealth && (
        <div>
          <strong>Connectors:</strong>
          <ul>
            {connectorHealth.connector_health.connectors.map((c) => (
              <li key={c.base_url}>
                {c.base_url}: {c.healthy ? "healthy" : "unhealthy"} (ok={c.success_count}, fail={c.failure_count})
              </li>
            ))}
          </ul>
        </div>
      )}

      <h4>Profile Store</h4>
      <div style={{ marginBottom: "0.5rem" }}>
        <label>
          Kind{" "}
          <select value={kind} onChange={(e) => setKind(e.target.value as ProfileKind)}>
            <option value="social">social</option>
            <option value="ssh">ssh</option>
            <option value="comms">comms</option>
          </select>
        </label>
        <label style={{ marginLeft: "0.75rem" }}>
          Name <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </div>
      <div style={{ marginBottom: "0.5rem" }}>
        <textarea rows={5} cols={80} value={jsonData} onChange={(e) => setJsonData(e.target.value)} />
      </div>
      <button onClick={persistProfile}>Save Profile</button>
      <button onClick={refreshProfiles} style={{ marginLeft: "0.5rem" }}>
        Reload Profiles
      </button>
      {profilesError && <p>{profilesError}</p>}
      <ul>
        {profiles.map((p) => (
          <li key={`${p.kind}-${p.name}`}>
            {p.name} ({p.kind}) by {p.created_by || "unknown"}
          </li>
        ))}
      </ul>
    </section>
  );
}
