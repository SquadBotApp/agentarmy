# AgentArmy Orchestration Integration Guide

## Overview

The AgentArmy orchestration system implements CPM scheduling, ZPE/Möbius scoring, and multi-agent routing to intelligently coordinate tasks across distributed worker agents.

## Architecture Layers

```
Frontend (React)
  ├─ OrchestrationPanel.tsx    [UI for decisions, ZPE, CPM timeline]
  │
Server Backend (Node.js)
  ├─ /orchestrate              [HTTP route accepting both legacy & advanced payloads]
  ├─ adapters/orchestration.js [Client for Python service]
  │
Orchestration Service (Python)
  ├─ orchestrator.py           [Core logic: CPM, ZPE, agent graph, routing]
  ├─ app.py                    [FastAPI HTTP wrapper]
  ├─ server_lightweight.py     [No-dependency HTTP wrapper fallback]
  └─ /health, /orchestrate    [REST endpoints]
```

## Quick Start

### 1. Verify Orchestrator Logic (No Dependencies)

The pure Python logic requires no HTTP server:

```bash
cd agentarmy-dashboard/orchestration
python verify_orchestrator.py
```

Expected output: 2 passing tests (simple scenario, completion scenario).

### 2. Optional: Run FastAPI Service

> **Note:** FastAPI has a Rust dependency (pydantic-core). If installation fails, skip to step 3.

```bash
cd agentarmy-dashboard/orchestration
# Install: pip install -r requirements.txt  # (may fail due to Rust)
python app.py
# Server runs on http://localhost:5000
```

### 3. Test Node Backend Integration

With the Node backend running, test orchestration routes:

```bash
cd agentarmy-dashboard/server
npm start
```

Then in another terminal:

```bash
# Test legacy format
curl -H "Authorization: Bearer test-token" \
  -X POST http://localhost:4000/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Create a marketing plan",
    "priority": "normal",
    "context": {}
  }'

# Or test advanced format
curl -H "Authorization: Bearer test-token" \
  -X POST http://localhost:4000/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "job": {"goal": "Research & analyze data", "constraints": {}},
    "state": {
      "tasks": [
        {"id": "t1", "name": "Research", "duration": 2.0, "depends_on": []},
        {"id": "t2", "name": "Analyze", "duration": 3.0, "depends_on": ["t1"]}
      ],
      "history": []
    },
    "previous_zpe": 0.5
  }'
```

### 4. Connect React Frontend

Import and use `OrchestrationPanel` in your dashboard. This example includes improved typing and error handling for a more robust implementation.

```tsx
import { OrchestrationPanel } from './components/OrchestrationPanel';
import { useState } from 'react';

// Based on the response format documented in this guide
type OrchestrationDecision = {
  nextTaskId: string;
  nextAgentId: string;
  zpe: { total: number; components: Record<string, number> };
  cpm: { project_duration: number; critical_tasks: string[] };
  rationale: string;
  alternatives: any[];
};

export function Dashboard() {
  const [decision, setDecision] = useState<OrchestrationDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitTask = async (taskGoal: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken'); // Assumes 'authToken' key
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('http://localhost:4000/orchestrate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: taskGoal,
          priority: 'normal',
          context: {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `Request failed: ${response.statusText}`);
      }

      const result = await response.json();
      // The original guide mentioned `result.result.decision`. The response
      // format section suggests the decision is the top-level object.
      // Please verify the actual response from your Node.js backend.
      // Assuming the response is the decision object itself:
      setDecision(result);
    } catch (e: any) {
      setError(e.message);
      console.error('Orchestration submission failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>AgentArmy Dashboard</h1>
      <OrchestrationPanel
        decision={decision}
        isLoading={isLoading}
        onSubmitTask={handleSubmitTask}
        error={error} // Pass error to the panel for display
      />
    </div>
  );
}
```

## Payload Formats

### Legacy Format (UI-friendly)

Node backend automatically transforms this:

```json
POST /orchestrate
{
  "task": "Create a marketing plan",
  "priority": "normal",
  "context": {
    "budget": 500,
    "timeline": "urgent"
  },
  "modelPreferences": {
    "planner": "anthropic",
    "executor": "openai"
  }
}
```

### Advanced Format (Full Control)

For direct orchestrator calls or programmatic routing:

```json
POST /orchestrate
{
  "job": {
    "goal": "Complete research task",
    "constraints": { "budget": 500, "timeline": "urgent" },
    "deadline_hours": 24,
    "budget": 500,
    "risk_tolerance": 0.4
  },
  "state": {
    "tasks": [
      {
        "id": "t1",
        "name": "Research market",
        "description": "Gather market data",
        "duration": 2.0,
        "depends_on": [],
        "assigned_agent": null
      },
      {
        "id": "t2",
        "name": "Draft campaign",
        "description": "Write copy",
        "duration": 3.0,
        "depends_on": ["t1"],
        "assigned_agent": null
      }
    ],
    "history": [
      { "task_id": "t0", "status": "completed", "agent_id": "planner" }
    ]
  },
  "previous_zpe": 0.5
}
```

## Response Format

Both payloads return the same decision structure:

```json
{
  "nextTaskId": "t1",
  "nextAgentId": "executor",
  "zpe": {
    "total": 0.78,
    "components": {
      "usefulness": 0.175,
      "coherence": 0.14,
      "cost": 0.1275,
      "latency": 0.0855,
      "risk": 0.1275,
      "alignment": 0.15
    }
  },
  "cpm": {
    "project_duration": 5.0,
    "critical_tasks": ["t1", "t2"]
  },
  "rationale": "Selected task 't1' for agent 'executor' (role=executor), ZPE=0.750, critical=True.",
  "alternatives": [
    {
      "task_id": "t1",
      "agent_id": "executor",
      "score": 0.750,
      "components": { ... },
      "is_critical": true
    },
    ...
  ]
}
```

## Core Algorithms

### Critical Path Method (CPM)

The orchestrator computes:
- **ES (Earliest Start)**: min(dependencies.EF)
- **EF (Earliest Finish)**: ES + duration
- **LS (Latest Start)**: LF - duration
- **LF (Latest Finish)**: min(successors.LS)
- **Slack**: LS - ES
- **Critical**: tasks with zero slack

### ZPE Scoring

Multi-factor weighted scoring combining:

| Factor | Weight | Notes |
|--------|--------|-------|
| Usefulness | 0.25 | Task/agent fitness |
| Coherence | 0.20 | Output quality likelihood |
| Cost | 0.15 | Inverted (lower cost = higher score) |
| Latency | 0.10 | Inverted (faster = higher score) |
| Risk | 0.15 | Inverted (safer = higher score) |
| Alignment | 0.15 | Agent risk-tolerance vs job constraint |

Formula:

```python
ZPE = (usefulness × 0.25) + (coherence × 0.20) + 
      ((1 - cost_norm) × 0.15) + ((1 - latency_norm) × 0.10) +
      ((1 - risk_norm) × 0.15) + (alignment × 0.15)

# Bias toward critical path
if is_critical:
    ZPE += 0.05
```

### Möbius Blending

Smooth score evolution to avoid thrashing:

```python
blended_score = 0.7 × previous_zpe + 0.3 × current_zpe
```

## Agent Graph

Default agents (extensible):

| Agent | Role | Cost/hr | Risk | Tools |
|-------|------|---------|------|-------|
| Planner | Strategic decomposition | $80 | 0.4 (moderate) | llm, search |
| Executor | Task execution | $70 | 0.6 (aggressive) | llm, codegen |
| Critic | Quality review | $90 | 0.3 (conservative) | llm |
| Governor | Governance & policy | $100 | 0.2 (ultra-safe) | llm, policy |

## Testing

### Unit Tests (Python)

```bash
cd orchestration
pytest test_orchestrator.py -v
```

Tests:
- Linear task chains with dependencies
- Completion detection when all tasks done
- CPM calculation and critical path identification
- ZPE component weighting

### Integration Test Harness (Node)

```bash
cd server
node orchestration-e2e.test.js
```

Tests:
- Health check endpoint
- Legacy and advanced payload handling
- Job creation and polling
- Command execution (FastAPI required)

## Dependency Notes

### Must-Have
- Node.js (for backend)
- Python 3.10+ (for orchestrator logic)

### Recommended
- FastAPI + uvicorn (HTTP layer) — may require Rust toolchain for some dependencies

### Optional
- CrewAI (for actual agent execution) — complex dependency tree

## Next Steps

1. **Run Python service** (skip if Rust issues): `python app.py`
2. **Start Node backend**: `npm start` (from server/)
3. **Launch React frontend**: Connect OrchestrationPanel to a dashboard route
4. **Test end-to-end**: Use curl or frontend UI to submit tasks
5. **Inspect decisions**: Monitor CPM, ZPE, alternatives in the panel
6. **Iterate on scoring**: Adjust ZPE weights or CPM heuristics in orchestrator.py
7. **Add execution**: Wire selected agents to CrewAI or other executors
