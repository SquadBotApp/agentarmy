import React, { useEffect, useState } from "react";
import {
  fetchEducationState,
  generateEducationSimulation,
  startEducationSession,
  submitEducationAssessment,
} from "../core/educationCenterApi";

type JsonRecord = Record<string, unknown>;

export function EducationCenterPanel() {
  const [state, setState] = useState<JsonRecord | null>(null);
  const [topic, setTopic] = useState("Python fundamentals");
  const [age, setAge] = useState(16);
  const [level, setLevel] = useState("beginner");
  const [style, setStyle] = useState("mixed");
  const [session, setSession] = useState<JsonRecord | null>(null);
  const [assessment, setAssessment] = useState<JsonRecord | null>(null);
  const [simulation, setSimulation] = useState<JsonRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refreshState() {
    try {
      const out = await fetchEducationState();
      setState(out);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    refreshState();
  }, []);

  async function onStart() {
    setLoading(true);
    setError(null);
    try {
      const out = await startEducationSession({
        topic,
        learner: {
          learner_id: "dashboard-user",
          age,
          level,
          style,
          mode: "general",
        },
      });
      setSession(out);
      await refreshState();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onAssess() {
    const id = String((session?.session as JsonRecord | undefined)?.session_id || "");
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const out = await submitEducationAssessment({
        session_id: id,
        score: 82,
      });
      setAssessment(out);
      await refreshState();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onSimulate() {
    setLoading(true);
    setError(null);
    try {
      const out = await generateEducationSimulation({ topic, level });
      setSimulation(out);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>EducationCenter</h3>
      <p>Adaptive learning domain with policy, assessment, simulation, and rewards.</p>
      <div>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
        <input
          type="number"
          value={age}
          min={5}
          max={99}
          onChange={(e) => setAge(Number(e.target.value))}
          placeholder="Age"
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="beginner">beginner</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
        <select value={style} onChange={(e) => setStyle(e.target.value)}>
          <option value="mixed">mixed</option>
          <option value="visual">visual</option>
          <option value="audio">audio</option>
        </select>
        <button onClick={onStart} disabled={loading}>Start Session</button>
        <button onClick={onAssess} disabled={loading}>Submit Assessment</button>
        <button onClick={onSimulate} disabled={loading}>Generate Simulation</button>
        <button onClick={refreshState} disabled={loading}>Refresh</button>
      </div>
      {error && <pre style={{ color: "red" }}>{error}</pre>}
      {state && (
        <pre>{JSON.stringify((state as { summary?: unknown }).summary || {}, null, 2)}</pre>
      )}
      {session && <pre>{JSON.stringify(session, null, 2)}</pre>}
      {assessment && <pre>{JSON.stringify(assessment, null, 2)}</pre>}
      {simulation && <pre>{JSON.stringify(simulation, null, 2)}</pre>}
    </section>
  );
}

