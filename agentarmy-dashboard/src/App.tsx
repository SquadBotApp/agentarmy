import "./App.css";
import React, { useEffect, useState } from "react";

import { BackgroundLayer } from "./components/BackgroundLayer";
import { CandidateModal } from "./components/CandidateModal";
import { EventsCard } from "./components/EventsCard";
import { HoneycombLayout } from "./components/HoneycombLayout";
import { OrchestrationPanel } from "./components/OrchestrationPanel";
import { PromptManager } from "./components/PromptManager";
import { RoutingCard } from "./components/RoutingCard";
import { WarRoom } from "./components/WarRoom";
import { WorkspaceCard } from "./components/WorkspaceCard";
import { ZPECard } from "./components/ZPECard";
import { AgentArmyDashboard } from "./components/AgentArmyDashboard";
import { proposeCandidates, ScoredCandidate } from "./core/upgrade";
import { Prompt } from "./core/prompts";
import { AgentArmyState, initialAgentArmyState } from "./core/types";
import { TotalSystemUnification } from "./core/totalSystemUnification";
import { useAgentStore } from "./store/agentStore";
import { ThemeProvider, useThemeStore } from "./store/themeStore";
import { BackgroundMode, useUnifiedAgentStore } from "./store/unifiedAgentStore";

type ViewMode = "dashboard" | "honeycomb";
type EventItem = { text: string; ts: string; user?: string; snapshot?: Prompt };

function InnerApp() {
  const { state: themeState, dispatch } = useThemeStore();
  const theme = themeState.theme as "quantum" | "forest" | "architecture";

  const backgroundMode = useUnifiedAgentStore((s) => s.backgroundMode);
  const setBackgroundMode = useUnifiedAgentStore((s) => s.setBackgroundMode);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("agentarmy_viewmode");
    return saved === "honeycomb" ? "honeycomb" : "dashboard";
  });
  const [zpe, setZpe] = useState(1);
  const [useWebGL, setUseWebGL] = useState(false);
  const [lastTool, setLastTool] = useState("vision-model-x");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [flowActive, setFlowActive] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState<string>(
    () => localStorage.getItem("agentarmy_universe") || "Universe B"
  );
  const [jobs, setJobs] = useState<number>(() => {
    const raw = localStorage.getItem("agentarmy_jobs");
    return raw ? Number(raw) : 12;
  });
  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      const raw = localStorage.getItem("agentarmy_events");
      if (raw) return JSON.parse(raw) as EventItem[];
    } catch {}
    return [
      { text: "Started pipeline", ts: new Date().toISOString() },
      { text: "Policy check passed", ts: new Date().toISOString() },
    ];
  });
  const [pastEvents, setPastEvents] = useState<EventItem[][]>([]);
  const [futureEvents, setFutureEvents] = useState<EventItem[][]>([]);

  const [coreState, setCoreState] = useState<AgentArmyState>(() => {
    try {
      const raw = localStorage.getItem("agentarmy_state");
      return raw ? (JSON.parse(raw) as AgentArmyState) : initialAgentArmyState;
    } catch {
      return initialAgentArmyState;
    }
  });
  const [pastCoreStates, setPastCoreStates] = useState<AgentArmyState[]>([]);

  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidateList, setCandidateList] = useState<ScoredCandidate[] | null>(null);
  const [promptManagerOpen, setPromptManagerOpen] = useState(false);
  const [orchestrationDecision, setOrchestrationDecision] = useState<any>(null);
  const [orchestrationLoading, setOrchestrationLoading] = useState(false);
  const [warRoomOpen, setWarRoomOpen] = useState(false);
  const [tsu] = useState(() => new TotalSystemUnification());

  const tools = ["vision-model-x", "language-model-y", "planner-z"];
  const [selectedTool, setSelectedTool] = useState(tools[0]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(null);
    };
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("agentarmy_jobs", String(jobs));
    } catch {}
  }, [jobs]);

  useEffect(() => {
    try {
      localStorage.setItem("agentarmy_events", JSON.stringify(events));
    } catch {}
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem("agentarmy_universe", selectedUniverse);
    } catch {}
  }, [selectedUniverse]);

  useEffect(() => {
    try {
      localStorage.setItem("agentarmy_viewmode", viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem("agentarmy_state", JSON.stringify(coreState));
    } catch {}
    setZpe(coreState.metrics.zpe);
    setSelectedUniverse(coreState.activeUniverse);
  }, [coreState]);

  function runTool() {
    const stamp = `${selectedTool} @ ${new Date().toLocaleTimeString()}`;
    setLastTool(stamp);
    const item = { text: stamp, ts: new Date().toISOString() };
    setPastEvents((p) => [...p, events]);
    setEvents((e) => [item, ...e].slice(0, 50));
    setFutureEvents([]);
    setFlowActive(true);
    setTimeout(() => setFlowActive(false), 900);
  }

  function addNote() {
    if (!note.trim()) return;
    const item = { text: note.trim(), ts: new Date().toISOString() };
    setPastEvents((p) => [...p, events]);
    setEvents((e) => [item, ...e].slice(0, 50));
    setFutureEvents([]);
    setNote("");
  }

  function evolveOnce() {
    setCandidateList(proposeCandidates(coreState));
    setCandidateModalOpen(true);
  }

  function revertLastEvolution() {
    const last = pastCoreStates.at(-1);
    if (!last) return;
    setPastCoreStates((p) => p.slice(0, -1));
    setCoreState(last);
    setEvents((e) => [
      { text: `Reverted to v${last.version}`, ts: new Date().toISOString() },
      ...e,
    ].slice(0, 50));
  }

  function applyCandidate(state: AgentArmyState) {
    setPastCoreStates((p) => [...p, coreState]);
    setCoreState(state);
    setCandidateModalOpen(false);
    setCandidateList(null);
    setEvents((e) => [
      { text: `Applied candidate v${state.version}`, ts: new Date().toISOString() },
      ...e,
    ].slice(0, 50));
  }

  function applyPrompt(prompt: Prompt) {
    const user = useAgentStore.getState().currentUser;
    setEvents((e) => [
      {
        text: `User ${user?.id} applied prompt: ${prompt.name}`,
        ts: new Date().toISOString(),
        user: user?.id,
        snapshot: prompt,
      },
      ...e,
    ].slice(0, 50));
    useAgentStore.getState().applyPromptAudit(prompt);
    setPromptManagerOpen(false);
  }

  async function handleSubmitTask(taskGoal: string) {
    setOrchestrationLoading(true);
    try {
      const { token } = useAgentStore.getState();
      const response = await fetch("http://localhost:4000/orchestrate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || "demo"}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: taskGoal,
          priority: "normal",
          context: {},
        }),
      });
      const result = await response.json();
      if (result.result?.decision) {
        setOrchestrationDecision(result.result.decision);
        setEvents((e) => [
          { text: `Orchestrated task: ${taskGoal}`, ts: new Date().toISOString() },
          ...e,
        ].slice(0, 50));
      }
    } catch (err) {
      setEvents((e) => [
        { text: `Orchestration failed: ${String(err)}`, ts: new Date().toISOString() },
        ...e,
      ].slice(0, 50));
    } finally {
      setOrchestrationLoading(false);
    }
  }

  return (
    <div className="App">
      <AgentArmyDashboard />
      <header className="App-header">
        <h1>AgentArmy Prototype</h1>
        <div className="header-controls">
          <div className="theme-select">
            <label htmlFor="viewmode">View:</label>
            <select
              id="viewmode"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
            >
              <option value="dashboard">Dashboard</option>
              <option value="honeycomb">Honeycomb</option>
            </select>
          </div>
          {viewMode === "honeycomb" && (
            <div className="theme-select">
              <label htmlFor="bgmode">Background:</label>
              <select
                id="bgmode"
                value={backgroundMode}
                onChange={(e) => setBackgroundMode(e.target.value as BackgroundMode)}
              >
                <option value="subtle">Subtle</option>
                <option value="high-energy">High-Energy</option>
              </select>
            </div>
          )}
          <div className="theme-select">
            <label htmlFor="theme">Visual:</label>
            <select
              id="theme"
              value={theme}
              onChange={(e) =>
                dispatch({ type: "setTheme", theme: e.target.value as "quantum" | "forest" | "architecture" })
              }
            >
              <option value="quantum">Quantum</option>
              <option value="forest">Forest</option>
              <option value="architecture">Architecture</option>
            </select>
          </div>
          <div>
            <button className="btn" onClick={() => setPromptManagerOpen(true)}>
              Prompts
            </button>
          </div>
          <div>
            <button className="btn btn-warroom" onClick={() => setWarRoomOpen(true)}>
              War Room
            </button>
          </div>
          <div>
            <button className="btn" onClick={evolveOnce}>
              Evolve
            </button>
            <button className="btn btn-ml8" onClick={revertLastEvolution}>
              Revert
            </button>
          </div>
          <div className="header-right">
            {useAgentStore.getState().token ? (
              <button
                className="btn"
                onClick={() => {
                  useAgentStore.getState().logout();
                  localStorage.removeItem("agent-token");
                }}
              >
                Logout
              </button>
            ) : (
              <button
                className="btn"
                onClick={async () => {
                  const user = prompt("Username");
                  const pass = prompt("Password");
                  if (user && pass) {
                    const success = await useAgentStore.getState().login(user, pass);
                    if (!success) alert("login failed");
                  }
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {viewMode === "honeycomb" ? (
        <div data-bg-mode={backgroundMode}>
          <BackgroundLayer />
          <HoneycombLayout />
        </div>
      ) : (
        <main className="dashboard-grid">
          <ZPECard
            zpe={zpe}
            setZpe={setZpe}
            useWebGL={useWebGL}
            setUseWebGL={setUseWebGL}
            theme={theme}
            expanded={expanded}
            setExpanded={setExpanded}
          />
          <WorkspaceCard />
          <OrchestrationPanel
            decision={orchestrationDecision}
            isLoading={orchestrationLoading}
            onSubmitTask={handleSubmitTask}
          />

          <button
            className={`card ${expanded === "gov" ? "expanded" : ""}`}
            type="button"
            onClick={() => setExpanded("gov")}
          >
            <h2>Governance</h2>
            <p>Blocked outputs: 3%</p>
          </button>

          <RoutingCard
            lastTool={lastTool}
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            tools={tools}
            runTool={runTool}
            flowActive={flowActive}
            expanded={expanded}
            setExpanded={setExpanded}
          />

          <button
            className={`card ${expanded === "universes" ? "expanded" : ""}`}
            type="button"
            onClick={() => setExpanded("universes")}
          >
            <h2>Universes</h2>
            <p>Winner: {selectedUniverse}</p>
            <div className="mt8">
              <label htmlFor="universe-select">Universe:</label>
              <select
                id="universe-select"
                value={selectedUniverse}
                onChange={(e) => setSelectedUniverse(e.target.value)}
              >
                <option>Universe A</option>
                <option>Universe B</option>
                <option>Universe C</option>
              </select>
            </div>
          </button>

          <button
            className={`card ${expanded === "cost" ? "expanded" : ""}`}
            type="button"
            onClick={() => setExpanded("cost")}
          >
            <h2>Cost</h2>
            <p>Avg cost per job: $0.27</p>
          </button>

          <div className="card">
            <h2>Jobs</h2>
            <p>
              Active jobs: <strong>{jobs}</strong>
            </p>
            <div className="controls">
              <button className="btn" onClick={() => setJobs((j) => j + 1)}>
                +
              </button>
              <button className="btn" onClick={() => setJobs((j) => Math.max(0, j - 1))}>
                -
              </button>
            </div>
          </div>

          <EventsCard
            events={events}
            note={note}
            setNote={setNote}
            addNote={addNote}
            pastEvents={pastEvents}
            futureEvents={futureEvents}
            setPastEvents={setPastEvents}
            setFutureEvents={setFutureEvents}
            setEvents={setEvents}
          />
        </main>
      )}

      {expanded && (
        <dialog className="modal" open>
          <div
            className="modal-content"
            role="none"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2>{expanded.toUpperCase()} Details</h2>
            <p>More detailed metrics will go here.</p>
            <button type="button" onClick={() => setExpanded(null)} className="mt-1rem">
              Close
            </button>
          </div>
        </dialog>
      )}

      {candidateModalOpen && candidateList && (
        <CandidateModal
          candidates={candidateList}
          onClose={() => {
            setCandidateModalOpen(false);
            setCandidateList(null);
          }}
          onApply={applyCandidate}
        />
      )}

      {promptManagerOpen && (
        <PromptManager onClose={() => setPromptManagerOpen(false)} onApply={applyPrompt} />
      )}

      {warRoomOpen && <WarRoom tsu={tsu} onClose={() => setWarRoomOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <InnerApp />
    </ThemeProvider>
  );
}
