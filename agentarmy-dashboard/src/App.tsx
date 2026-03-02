import "./App.css";
import React, { useState, useEffect } from "react";
 
import { ZPECard } from "./components/ZPECard";
import { RoutingCard } from "./components/RoutingCard";
import { EventsCard } from "./components/EventsCard";
import { OrchestrationPanel } from "./components/OrchestrationPanel";
import { ThemeProvider, useThemeStore } from "./store/themeStore";
import { AgentArmyState, initialAgentArmyState } from "./core/types";
import { proposeCandidates, ScoredCandidate } from "./core/upgrade";
import { CandidateModal } from "./components/CandidateModal";
import { PromptManager } from "./components/PromptManager";
import { Prompt } from "./core/prompts";
import { WorkspaceCard } from "./components/WorkspaceCard";
import { useAgentStore } from "./store/agentStore";
import { HoneycombLayout } from "./components/HoneycombLayout";
import { BackgroundLayer } from "./components/BackgroundLayer";
import { useUnifiedAgentStore, BackgroundMode } from "./store/unifiedAgentStore";

type ViewMode = 'dashboard' | 'honeycomb';

function InnerApp() {
  const { state: themeState, dispatch } = useThemeStore();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('agentarmy_viewmode');
    return (saved === 'honeycomb' ? 'honeycomb' : 'dashboard') as ViewMode;
  });
  const [zpe, setZpe] = useState(1);
  const [lastTool, setLastTool] = useState("vision-model-x");
  const [useWebGL, setUseWebGL] = useState(false);
  const [jobs, setJobs] = useState<number>(() => {
    const raw = localStorage.getItem("agentarmy_jobs");
    return raw ? Number(raw) : 12;
  });

  type EventItem = { text: string; ts: string };
  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      const raw = localStorage.getItem("agentarmy_events");
      if (!raw) return [{ text: "Started pipeline", ts: new Date().toISOString() }, { text: "Policy check passed", ts: new Date().toISOString() }];
      return JSON.parse(raw) as EventItem[];
    } catch {
      return [{ text: "Started pipeline", ts: new Date().toISOString() }];
    }
  });
  // simple undo/redo stacks for events
  const [pastEvents, setPastEvents] = useState<EventItem[][]>([]);
  const [futureEvents, setFutureEvents] = useState<EventItem[][]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [flowActive, setFlowActive] = useState(false);
  const theme = themeState.theme as "quantum" | "forest" | "architecture";
  const tools = ["vision-model-x", "language-model-y", "planner-z"];
  const [selectedTool, setSelectedTool] = useState(tools[0]);
  const [selectedUniverse, setSelectedUniverse] = useState<string>(() => {
    return localStorage.getItem("agentarmy_universe") || "Universe B";
  });

  const [coreState, setCoreState] = useState<AgentArmyState>(() => {
    try {
      const raw = localStorage.getItem('agentarmy_state');
      return raw ? (JSON.parse(raw) as AgentArmyState) : initialAgentArmyState;
    } catch { return initialAgentArmyState; }
  });
  const [pastCoreStates, setPastCoreStates] = useState<AgentArmyState[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpanded(null);
    }
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [setExpanded]);

  function runTool() {
    const stamp = `${selectedTool} @ ${new Date().toLocaleTimeString()}`;
    setLastTool(stamp);
    const item = { text: stamp, ts: new Date().toISOString() };
    setPastEvents((p) => [...p, events]);
    setEvents((e) => [item, ...e].slice(0, 50));
    setFutureEvents([]);
    // trigger a short routing flow micro-animation
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

  // persist jobs and events
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
    try { localStorage.setItem("agentarmy_universe", selectedUniverse); } catch {}
  }, [selectedUniverse]);

  useEffect(() => {
    try { localStorage.setItem('agentarmy_viewmode', viewMode); } catch {}
  }, [viewMode]);

  useEffect(() => {
    try { localStorage.setItem('agentarmy_state', JSON.stringify(coreState)); } catch {}
    // reflect coreState into UI metrics
    setZpe(coreState.metrics.zpe);
    setSelectedUniverse(coreState.activeUniverse);
  }, [coreState]);

  function evolveOnce() {
    // produce scored candidates and open modal for human selection
    const scored = proposeCandidates(coreState);
    setCandidateList(scored);
    setCandidateModalOpen(true);
  }

  function revertLastEvolution() {
    const last = pastCoreStates.at(-1);
    if (!last) return;
    setPastCoreStates((p) => p.slice(0, -1));
    setCoreState(last);
    const item = { text: `Reverted to v${last.version}`, ts: new Date().toISOString() };
    setEvents((e) => [item, ...e].slice(0, 50));
  }

  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidateList, setCandidateList] = useState<ScoredCandidate[] | null>(null);
  const [promptManagerOpen, setPromptManagerOpen] = useState(false);
  const [orchestrationDecision, setOrchestrationDecision] = useState<any>(null);
  const [orchestrationLoading, setOrchestrationLoading] = useState(false);

  async function handleSubmitTask(taskGoal: string) {
    setOrchestrationLoading(true);
    try {
      const token = useAgentStore.getState().token;
      const response = await fetch('http://localhost:4000/orchestrate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || 'demo'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: taskGoal,
          priority: 'normal',
          context: {},
        }),
      });
      const result = await response.json();
      if (result.result?.decision) {
        setOrchestrationDecision(result.result.decision);
        const item = { text: `📊 Orchestrated task: ${taskGoal}`, ts: new Date().toISOString() };
        setEvents((e) => [item, ...e].slice(0, 50));
      }
    } catch (err) {
      console.error('Orchestration error:', err);
      const item = { text: `❌ Orchestration failed: ${err}`, ts: new Date().toISOString() };
      setEvents((e) => [item, ...e].slice(0, 50));
    } finally {
      setOrchestrationLoading(false);
    }
  }

  function applyCandidate(s: AgentArmyState) {
    setPastCoreStates((p) => [...p, coreState]);
    setCoreState(s);
    setCandidateModalOpen(false);
    setCandidateList(null);
    const x = { text: `Applied candidate v${s.version}`, ts: new Date().toISOString() };
    setEvents((e) => [x, ...e].slice(0, 50));
  }

  function applyPrompt(p: Prompt) {
    const user = useAgentStore.getState().currentUser;
    const snapshot = p;
    const item = { text: `User ${user?.id} applied prompt: ${p.name}`, ts: new Date().toISOString(), user: user?.id, snapshot } as any;
    setEvents((e) => [item, ...e].slice(0, 50));
    // also record in store audits
    useAgentStore.getState().applyPromptAudit(p);
    setPromptManagerOpen(false);
  }

  return (
    <div className="app">
      <header className="top-bar">
        <h1>AgentArmy Prototype</h1>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {/* View mode toggle */}
          <div className="theme-select">
            <label htmlFor="viewmode">View:</label>
            <select 
              id="viewmode" 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              style={{ background: viewMode === 'honeycomb' ? '#d4af37' : undefined, color: viewMode === 'honeycomb' ? '#0a0a0f' : undefined }}
            >
              <option value="dashboard">Dashboard</option>
              <option value="honeycomb">🐝 Honeycomb</option>
            </select>
          </div>
          {/* Background mode toggle - only shown in honeycomb view */}
          {viewMode === 'honeycomb' && (
            <div className="theme-select">
              <label htmlFor="bgmode">Background:</label>
              <select
                id="bgmode"
                value={useUnifiedAgentStore.getState().backgroundMode}
                onChange={(e) => useUnifiedAgentStore.getState().setBackgroundMode(e.target.value as BackgroundMode)}
                style={{ background: '#1a3a2a', borderColor: '#66ff66' }}
              >
                <option value="subtle">✨ Subtle</option>
                <option value="high-energy">⚡ High-Energy</option>
              </select>
            </div>
          )}
          <div className="theme-select">
            <label htmlFor="theme">Visual:</label>
            <select id="theme" value={theme} onChange={(e) => dispatch({ type: "setTheme", theme: e.target.value as any })}>
              <option value="quantum">Quantum</option>
              <option value="forest">Forest</option>
              <option value="architecture">Architecture</option>
            </select>
          </div>
          <div>
            <button className="btn" onClick={() => setPromptManagerOpen(true)}>Prompts</button>
          </div>
          <div>
            <button className="btn" onClick={evolveOnce}>Evolve</button>
            <button className="btn" onClick={revertLastEvolution} style={{marginLeft:8}}>Revert</button>
          </div>
          <div style={{marginLeft:'auto'}}> 
            {useAgentStore.getState().token ? (
              <button className="btn" onClick={() => {
                useAgentStore.getState().logout();
                localStorage.removeItem('agent-token');
              }}>Logout</button>
            ) : (
              <button className="btn" onClick={async () => {
                const user = prompt('Username');
                const pass = prompt('Password');
                if (user && pass) {
                  const success = await useAgentStore.getState().login(user, pass);
                  if (!success) alert('login failed');
                }
              }}>Login</button>
            )}
          </div>
        </div>
      </header>

      {viewMode === 'honeycomb' ? (
        <div data-bg-mode={useUnifiedAgentStore.getState().backgroundMode}>
          <BackgroundLayer />
          <HoneycombLayout />
        </div>
      ) : (
        <main className="dashboard-grid">
          <ZPECard zpe={zpe} setZpe={setZpe} useWebGL={useWebGL} setUseWebGL={setUseWebGL} theme={theme} expanded={expanded} setExpanded={setExpanded} />
          <WorkspaceCard />        <OrchestrationPanel decision={orchestrationDecision} isLoading={orchestrationLoading} onSubmitTask={handleSubmitTask} />
          <button
            className={`card ${expanded === "gov" ? "expanded" : ""}`}
            type="button"
            onClick={() => setExpanded("gov")}
          >
            <h2>Governance</h2>
            <p>Blocked outputs: 3%</p>
          </button>

          <RoutingCard lastTool={lastTool} selectedTool={selectedTool} setSelectedTool={setSelectedTool} tools={tools} runTool={runTool} flowActive={flowActive} expanded={expanded} setExpanded={setExpanded} />

          <button
            className={`card ${expanded === "universes" ? "expanded" : ""}`}
            type="button"
            onClick={() => setExpanded("universes")}
          >
            <h2>Universes</h2>
            <p>Winner: {selectedUniverse}</p>
            <div style={{marginTop:8}}>
              <label htmlFor="universe-select">Universe:</label>
              <select id="universe-select" value={selectedUniverse} onChange={(e)=>setSelectedUniverse(e.target.value)}>
                <option>Universe A</option>
                <option>Universe B</option>
                <option>Universe C</option>
              </select>
            </div>
            <div className="wavefield" />
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
            <p>Active jobs: <strong>{jobs}</strong></p>
            <div className="controls">
              <button className="btn" onClick={() => setJobs((j) => j + 1)}>
                +
              </button>
              <button className="btn" onClick={() => setJobs((j) => Math.max(0, j - 1))}>
                −
              </button>
            </div>
          </div>

          <EventsCard events={events} note={note} setNote={setNote} addNote={addNote} pastEvents={pastEvents} futureEvents={futureEvents} setPastEvents={setPastEvents} setFutureEvents={setFutureEvents} setEvents={setEvents} />
        </main>
      )}

      {expanded && (
        <dialog className="modal" open onClick={() => setExpanded(null)} onKeyDown={(e) => { if (e.key === 'Escape') setExpanded(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{expanded.toUpperCase()} Details</h2>
            <p>More detailed metrics will go here.</p>
          </div>
        </dialog>
      )}
      {candidateModalOpen && candidateList && (
        <CandidateModal candidates={candidateList} onClose={() => { setCandidateModalOpen(false); setCandidateList(null); }} onApply={applyCandidate} />
      )}
      {promptManagerOpen && (
        <PromptManager onClose={() => setPromptManagerOpen(false)} onApply={applyPrompt} />
      )}
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
