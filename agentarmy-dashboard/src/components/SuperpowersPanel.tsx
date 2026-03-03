import React from "react";

import {
  compileToolGraph,
  executeDsl,
  fetchControlTower,
  installSkill,
  runAutonomousPr,
  runSelfHeal,
  suggestPairEdit,
  SuperpowerTower,
} from "../core/superpowersApi";

export function SuperpowersPanel() {
  const [goal, setGoal] = React.useState("Ship feature with tests and migration");
  const [file, setFile] = React.useState("src/App.tsx");
  const [intent, setIntent] = React.useState("reduce complexity and add tests");
  const [dsl, setDsl] = React.useState("ship mobile plugin hardening");
  const [result, setResult] = React.useState<string>("");
  const [tower, setTower] = React.useState<SuperpowerTower | null>(null);
  const [error, setError] = React.useState("");

  async function run(action: () => Promise<any>) {
    setError("");
    try {
      const out = await action();
      setResult(JSON.stringify(out, null, 2));
    } catch (err) {
      setError(String(err));
    }
  }

  async function refreshTower() {
    setError("");
    try {
      setTower(await fetchControlTower());
    } catch (err) {
      setError(String(err));
    }
  }

  React.useEffect(() => {
    refreshTower();
  }, []);

  return (
    <section>
      <h3>Superpowers Console</h3>
      <p>Autonomous PR, tool graph compiler, self-heal, pair suggestions, skill marketplace, DSL, control tower.</p>
      <div style={{ marginBottom: "0.5rem" }}>
        <input value={goal} onChange={(e) => setGoal(e.target.value)} style={{ width: "100%", maxWidth: 760 }} />
      </div>
      <button onClick={() => run(() => runAutonomousPr(goal, true))}>Autonomous PR (Dry Run)</button>
      <button onClick={() => run(() => compileToolGraph(goal))} style={{ marginLeft: "0.5rem" }}>
        Compile Tool Graph
      </button>
      <button onClick={() => run(() => runSelfHeal("stabilize connectors"))} style={{ marginLeft: "0.5rem" }}>
        Run Self-Heal
      </button>
      <div style={{ marginTop: "0.5rem" }}>
        <input value={file} onChange={(e) => setFile(e.target.value)} />
        <input value={intent} onChange={(e) => setIntent(e.target.value)} style={{ marginLeft: "0.5rem", width: 360 }} />
        <button onClick={() => run(() => suggestPairEdit(file, intent))} style={{ marginLeft: "0.5rem" }}>
          Pair Suggest
        </button>
      </div>
      <div style={{ marginTop: "0.5rem" }}>
        <input value={dsl} onChange={(e) => setDsl(e.target.value)} style={{ width: 420 }} />
        <button onClick={() => run(() => executeDsl(dsl))} style={{ marginLeft: "0.5rem" }}>
          Execute DSL
        </button>
        <button onClick={() => run(() => installSkill("auto-pr-v1"))} style={{ marginLeft: "0.5rem" }}>
          Install Skill
        </button>
      </div>
      <div style={{ marginTop: "0.5rem" }}>
        <button onClick={refreshTower}>Refresh Control Tower</button>
      </div>
      {tower && (
        <div style={{ marginTop: "0.5rem" }}>
          <strong>Tower:</strong> jobs={tower.summary.jobs_total}, skills={tower.summary.installed_skills}, memory={tower.summary.memory_items}
        </div>
      )}
      {error && <pre>{error}</pre>}
      {result && <pre>{result}</pre>}
    </section>
  );
}
