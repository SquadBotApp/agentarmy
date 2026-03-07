# AgentArmy Orchestration System - Complete Integration Guide

## Status: ✅ Fully Integrated & Tested

All components of the orchestration system are now integrated, tested, and ready for production use.

## Quick Start (5 Minutes)

### 1. Start Flask Orchestration Service
```bash
cd agentarmy-dashboard/orchestration
python server_lightweight.py
# Server runs on http://127.0.0.1:5000
```

### 2. Start Node Backend
```bash
cd agentarmy-dashboard/server
npm start
# Server runs on http://localhost:4000
```

### 3. Start React Dashboard
```bash
cd agentarmy-dashboard
npm start
# Dashboard runs on http://localhost:3000
```

### 4. Use the Brain Panel
- Open http://localhost:3000
- Expand the **Brain (Orchestration)** panel
- Enter a task goal and click Submit
- Watch the orchestration engine route your task!

## What's Been Built

### 1. **Orchestrator Engine** (`orchestrator.py`)
✅ CPM scheduling (critical path method)  
✅ ZPE/Möbius scoring (6-factor weighted)  
✅ Agent graph (4-agent model)  
✅ Task routing & decision making  
✅ Pure Python—no external dependencies  

### 2. **Flask HTTP Wrapper** (`server_lightweight.py`)
✅ Lightweight (no Rust dependencies)  
✅ Dual-payload support (legacy + advanced)  
✅ Job management & polling  
✅ Health checks & tracing-ready  

### 3. **Node.js Integration** (`server/`)
✅ `/orchestrate` endpoint (both payload shapes)  
✅ `OrchestrationClient` adapter (polymorphic)  
✅ Job status endpoints  
✅ Full E2E testing harness  

### 4. **React UI Component** (`OrchestrationPanel.tsx`)
✅ Task submission form  
✅ Decision display & visualization  
✅ ZPE score breakdown  
✅ CPM timeline & critical path  
✅ Top 5 alternatives ranked  
✅ Responsive dark UI  

### 5. **Tests** 
✅ Python: `test_orchestrator.py` (CPM logic)  
✅ Python: `verify_orchestrator.py` (standalone)  
✅ Python: `test_server.py` (Flask endpoints)  
✅ TypeScript: `OrchestrationPanel.test.tsx` (React component)  
✅ Node: `orchestration-e2e.test.js` (end-to-end)  

## Architecture

```
React Dashboard (http://localhost:3000)
    └─ OrchestrationPanel
          │
          ├─ Task Submission Form
          ├─ Decision Display (task/agent/score)
          ├─ ZPE Visualization
          ├─ CPM Timeline
          └─ Alternatives List

           │
           ▼
           
Node.js Backend (http://localhost:4000)
    └─ /orchestrate endpoint
          │
          ├─ Validates auth (JWT)
          ├─ Routes to Python service (or local logic)
          └─ Returns orchestration decision

           │
           ▼
           
Flask Orchestration Service (http://127.0.0.1:5000)
    └─ /orchestrate endpoint
          │
          ├─ Accepts legacy or advanced payload
          ├─ Calls orchestrator.py
          └─ Returns decision JSON

           │
           ▼
           
Pure Python Orchestrator (orchestrator.py)
    ├─ CPM Scheduler
    │  └─ Computes ES, EF, LS, LF, slack, critical path
    │
    ├─ Agent Graph
    │  └─ 4 agents (planner, executor, critic, governor)
    │
    ├─ ZPE Scoring
    │  └─ Weights: usefulness (0.25), coherence (0.2), cost (0.15),
    │            latency (0.1), risk (0.15), alignment (0.15)
    │
    └─ Decision Engine
       └─ Selects best (task, agent) pair + alternatives
```

## Payload Formats

### Legacy Format (UI-friendly)

Submitted from React component → Node backend → Python service:

```json
POST /orchestrate
{
  "task": "Create marketing plan",
  "priority": "normal",
  "context": {}
}
```

### Advanced Format (Full Control)

For programmatic routing or testing:

```json
POST /orchestrate
{
  "job": {
    "goal": "Complete research task",
    "constraints": {},
    "deadline_hours": 24,
    "risk_tolerance": 0.5
  },
  "state": {
    "tasks": [
      {
        "id": "t1",
        "name": "Research",
        "duration": 2.0,
        "depends_on": []
      },
      {
        "id": "t2",
        "name": "Analyze",
        "duration": 3.0,
        "depends_on": ["t1"]
      }
    ],
    "history": []
  },
  "previous_zpe": 0.5
}
```

### Response Format (Unified)

Both payloads return:

```json
{
  "nextTaskId": "t1",
  "nextAgentId": "executor",
  "zpe": {
    "total": 0.735,
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
  "rationale": "Selected task 'Research' for agent 'Executor' (role=executor), ZPE=0.750, critical=True.",
  "alternatives": [...]
}
```

## Testing

### Run All Tests

```bash
# Python logic verification
cd orchestration
python verify_orchestrator.py

# Flask server tests
python test_server.py

# React component tests (requires npm)
cd ..
npm test -- OrchestrationPanel.test.tsx

# Node E2E tests (requires Orchestration service running)
cd server
npm install jest-cli -g
node orchestration-e2e.test.js
```

## Key Algorithms

### Critical Path Method (CPM)

1. **Topological sort** of task dependencies
2. **Forward pass**: Compute earliest start (ES) and finish (EF)
3. **Backward pass**: Compute latest start (LS) and finish (LF)
4. **Slack calculation**: LS - ES
5. **Critical path**: Tasks with zero slack

### ZPE Scoring

Weighted combination of 6 factors:

```
ZPE = Σ(factor × weight)
    = (usefulness × 0.25) + (coherence × 0.2) + 
      ((1 - cost) × 0.15) + ((1 - latency) × 0.1) +
      ((1 - risk) × 0.15) + (alignment × 0.15)

# Bias toward critical path: +0.05 for critical tasks

# Möbius blending: avoid score thrash
blended = 0.7 × previous + 0.3 × current
```

### Agent Graph

| Agent | Role | Cost/hr | Risk | Tools |
|-------|------|---------|------|-------|
| Planner | Strategic decomposition | $80 | 0.4 | llm, search |
| Executor | Task execution | $70 | 0.6 | llm, codegen |
| Critic | Quality review | $90 | 0.3 | llm |
| Governor | Governance, policy | $100 | 0.2 | llm, policy |

## Environment Setup

### Python
- Python 3.10+
- `flask` (pre-built wheels, no Rust)
- `requests` (for testing)

### Node.js
- Node 16+
- Express, axios, jsonwebtoken
- OpenTelemetry packages (tracing)

### Optional
- FastAPI + uvicorn (if Rust available)
- CrewAI (for actual agent execution)
- Redis/Postgres (for persistence)

## Troubleshooting

### Flask Server Won't Start
```bash
pip install flask --prefer-binary
pip install requests
```

### "Port 5000 already in use"
```bash
# Kill the port
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Orchestration returns "No tasks; workflow complete"
This is expected when submitting legacy tasks without a task list. Provide an advanced payload with `state.tasks` to test CPM.

### React component not updating after submission
Check browser console for CORS errors. Ensure backend is running on http://localhost:4000.

## Next Steps

1. **Wire to actual execution**: Connect selected agents to CrewAI or custom executors
2. **Add persistence**: Store decisions & outcomes in Redis/Postgres for learning
3. **Tune ZPE weights**: Adjust based on real task outcomes
4. **Multi-agent collaboration**: Implement agent graph traversal for hierarchical execution
5. **Human-in-the-loop**: Add approval workflows for risky decisions
6. **Advanced scoring**: Integrate real latency, cost, and risk metrics from providers

## File Locations

```
agentarmy-dashboard/
├── orchestration/
│   ├── orchestrator.py                (Core logic)
│   ├── server_lightweight.py           (Flask wrapper)
│   ├── test_orchestrator.py            (Unit tests)
│   ├── verify_orchestrator.py          (Verification)
│   ├── test_server.py                  (Integration tests)
│   ├── README.md                       (Orchestration README)
│   └── requirements.txt                (Python deps)
├── server/
│   ├── index.js                        (Node backend)
│   ├── adapters/orchestration.js       (Client adapter)
│   ├── orchestration-e2e.test.js       (E2E tests)
│   └── __tests__/orchestration.test.js (Unit tests)
├── src/
│   ├── components/
│   │   ├── OrchestrationPanel.tsx      (React component)
│   │   └── __tests__/
│   │       └── OrchestrationPanel.test.tsx
│   ├── App.tsx                         (Integrated into dashboard)
│   └── core/
│       └── types.ts
├── ORCHESTRATION_GUIDE.md              (Integration guide)
└── README.md                           (This file)
```

## Questions?

Refer to:
- `ORCHESTRATION_GUIDE.md` for detailed integration
- `orchestration/README.md` for service documentation
- Test files for code examples

---

**Built with**: Python, Flask, Node.js, React, TypeScript, OpenTelemetry  
**Last Updated**: March 1, 2026  
**Status**: Production Ready ✅
