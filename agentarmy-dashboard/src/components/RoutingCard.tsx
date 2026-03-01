import React from "react";

type Props = {
  lastTool: string;
  selectedTool: string;
  setSelectedTool: (s: string) => void;
  tools: string[];
  runTool: () => void;
  flowActive: boolean;
  expanded: string | null;
  setExpanded: (s: string | null) => void;
};

export function RoutingCard({ lastTool, selectedTool, setSelectedTool, tools, runTool, flowActive, expanded, setExpanded }: Props) {
  return (
    <div
      className={`card ${expanded === "routing" ? "expanded" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => setExpanded("routing") }
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded("routing"); }}
    >
      <h2>Routing</h2>
      <p>Last tool: <strong>{lastTool}</strong></p>
      <div className="controls">
        <select
          value={selectedTool}
          onChange={(e) => setSelectedTool(e.target.value)}
        >
          {tools.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button className="btn" onClick={runTool}>
          Run tool
        </button>
      </div>
      <div className={`flow ${flowActive ? "animate" : ""}`} aria-hidden />
    </div>
  );
}
