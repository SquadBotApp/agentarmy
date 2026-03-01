# AgentArmy Orchestration Service

## Overview
The AgentArmy OS Orchestration Service is a Python‑based backend component that leverages the **CrewAI** framework to manage multi‑agent workflows. It serves as the “brain” for AgentArmy OS, handling task decomposition, routing, execution, governance and synthesis in a scalable, self‑evolving manner. This service integrates with the broader AgentArmy architecture, including model diversification (Anthropic, xAI, Groq, Gemini), human‑in‑the‑loop controls, and physics‑inspired consensus mechanisms (ZPE/Möbius scoring). The core orchestration algorithms live in `orchestrator.py` — you can inspect the CPM scheduler, ZPE scoring, agent/ task models and public `orchestrate` entrypoint used by the `/orchestrate` HTTP route.

Key features:
- **Multi‑Agent Orchestration**: Uses CrewAI’s Agents, Tasks, Crews and Flows for role‑based collaboration.
- **Dynamic Routing**: Backend model diversification with provider‑specific scoring.
- **Governance & Security**: Constitutional rules, audit logs and JWT/RBAC support.
- **Integration Points**: Exposed via HTTP endpoints for the Node.js API; supports memory persistence and optimization loops.
- **Scalability**: Designed for Kubernetes deployment with Docker, handling Orders 1–3 (single to holographic armies).

This service completes ~15‑20 % of the remaining work on the AgentArmy OS roadmap – the multi‑agent orchestration layer.

## Architecture
```
Frontend (React)
    ↓
Backend (Node.js Express)
    ↓
Orchestration Service (Python + CrewAI)
    ├── Planner Agent (strategic decomposition)
    ├── Router Agent (intelligent routing with ZPE/Möbius scoring)
    ├── Governance Agent (constitutional enforcement)
    ├── Worker Agents (researcher, writer, etc.)
    └── Synthesizer Agent (output merging)
```

Agents map directly to CrewAI primitives, tasks encapsulate CPM scheduling logic, crews manage hierarchical execution, and flows power event‑driven universes.

## Key Features
- Role‑based agents for each functional responsibility
- Physics‑inspired ZPE/Möbius scoring for routing and consensus
- Constitutional governance with audit trail and HITL support
- Multi‑model support: OpenAI, Anthropic, Groq, xAI, Gemini
- FastAPI REST layer with JWT auth and rate limiting
- In‑memory job store (Redis/Postgres planned) with polling API
- Docker/Kubernetes friendly with health checks and metrics

## Prerequisites
- Python 3.10+ (tested on 3.12) – note that some dependencies (pydantic, crewai) build native extensions and may require a Rust toolchain during install
- Docker (for containerization)
- Node.js backend & React frontend from the existing repo
- PostgreSQL (persistence) and Redis (queues/memory) recommended
- API keys stored in `.env` for desired providers

## Installation & Setup

## Testing

After installing the Python dependencies you can verify the orchestrator logic with
pytest:

```bash
cd orchestration
pip install -r requirements.txt
pytest -q
```

Unit tests live alongside the code (`test_orchestrator.py`) and exercise CPM, task
selection and legacy payload handling.

```bash
# clone repo (already in workspace)
cd agentarmy-dashboard/orchestration

# install Python deps
pip install -r requirements.txt

# configure environment
cp .env.example .env
# edit .env with your keys and service URLs

# run locally
python app.py            # FastAPI listens on $ORCHESTRATION_PORT
```

### Docker
```bash
docker build -t agentarmy-orchestration .
docker run -p 8000:8000 --env-file .env agentarmy-orchestration
```

### Docker‑Compose (full stack)
```bash
docker-compose up -d
```
services:
- orchestration: Python (port 8000)
- backend: Node.js (port 4000)
- frontend: React (port 3000)
- db: Postgres
- redis: Redis

## How It Works
1. **Job initiation** – backend POSTs `/orchestrate` with task JSON.
2. **Planning & decomposition** – Planner agent generates dependency graph & CPM timings.
3. **Routing** – Router assigns subtasks to workers, scoring by ZPE and provider latency/cost.
4. **Execution** – Workers run in parallel/hierarchical crews; outputs recorded.
5. **Governance** – Constitutional agent inspects proposals, vetoes or requests human approval.
6. **Synthesis** – Synthesizer merges results, applies Möbius optimization loop.
7. **Response** – Completed job returned; audit logs saved, memory updated for learning.

For advanced Orders 2–3, flows handle branching universes; human approvals pause execution via API callbacks.

## API Reference
### POST `/orchestrate`
Starts a job or returns a routing decision. The endpoint accepts two shapes:

1. **Legacy mode** (used by existing Node adapter):
   ```json
   {
     "task": "Create a marketing plan",
     "priority": "normal",
     "context": { /* optional state or metadata */ },
     "model_preferences": { /* optional */ }
   }
   ```
   This is translated on the server into a minimal `job`/`state` payload and returns a
   decision object under `result.decision`.

2. **Orchestrator mode** (preferred for advanced routing):
   ```json
   {
     "job": {"goal":"...","constraints":{},"deadline_hours":12,"budget":500,"risk_tolerance":0.4},
     "state": {"tasks":[...],"history":[...]},
     "previous_zpe": 0.5
   }
   ```
   Use this shape when calling directly from the backend or during testing; it gives full
   control over the workflow state. The response mirrors the `OrchestrationDecision`:
   ```json
   {
     "nextTaskId": "task‑1",
     "nextAgentId": "executor",
     "zpe": {"total":0.78,...},
     "cpm": {...},
     "rationale": "...",
     "alternatives": [...]
   }
   ```

Both formats are supported by the Python service to maintain compatibility with earlier
Node.js code.
### GET `/jobs/{job_id}`
Poll status/result.  
### GET `/jobs?status={status}`
List jobs.  
### GET `/health`
Returns enabled providers and service health.

(Full examples retained above.)

## Integration Guide
### With Node.js Backend
Adapter (`server/adapters/orchestration.js`) wraps HTTP calls. Backend routes:
```js
// Express route that accepts both the original "task" form and the
// full orchestrator payload.  OrchestrationClient.submitTask is polymorphic
// so the body can be forwarded directly when `job` is present.
app.post('/orchestrate', authenticate, async (req, res) => {
  const client = getOrchestrationClient(req.headers.authorization.replace(/^Bearer\s+/i, ''));

  let job;
  if (req.body.job) {
    // advanced request from backend logic
    job = await client.submitTask(req.body);
  } else {
    // legacy convenience form used by the UI
    job = await client.submitTask(req.body.task, {
      priority: req.body.priority,
      context: req.body.context,
      model_preferences: req.body.modelPreferences,
    });
  }
  res.json(job);
});
``` 
Frontend calls backend endpoints; JWT flows through.

### With Frontend (React)
Use API client to hit backend endpoints. Display status in `SwarmPanel` or similar; consider WebSocket/Socket.io for real‑time updates.
Visual layer agents can be triggered via `/vision` endpoint when needed.

## Monitoring & Observability
- Console logs + optional file logging
- `/health` endpoint reports provider availability
- Audit trail table in DB (planned)
- Optional LangSmith tracing for detailed debugging

## Testing
- **Unit**: `pytest tests/` covers crew logic, agents, adapters.
- **Integration**: run sample jobs via `curl` or Postman against locally running service.
- **E2E**: use docker‑compose stack and simulate user workflow.

## Troubleshooting
- **Service fails to start**: ensure Python≥3.10 and required packages
- **API errors**: check `.env` for valid keys, hit `/health`
- **Slow jobs**: inspect provider latencies; adjust `model_preferences`
- **Governance rejections**: view audit log (future) or check logs for flagged items

## Roadmap & Contributions
Next phases:
- Phase 2: sub‑crews for exploding armies
- Phase 3: flows for universes
- CPM scheduler integration to priority routing
- Memory & self‑improvement via vector store
- Visual intelligence agents (Phase 4)

Issues and PRs welcome – contact repo maintainers.

## License
Same as root AgentArmy OS project.

## Integration with Node.js Backend

The Node.js backend (`server/adapters/orchestration.js`) provides a client to call this service:

```javascript
const { getOrchestrationClient } = require('./adapters/orchestration');

// From Express route handler (with JWT token from frontend)
const client = getOrchestrationClient(token);
const jobResult = await client.submitTask("My task", {
  priority: "high",
  model_preferences: { router: "groq" }
});

// Poll for completion
const finalResult = await client.waitForCompletion(jobResult.job_id);
```

The backend exposes these endpoints to the frontend:
- `POST /orchestrate` → triggers Python service
- `GET /orchestrate/jobs/{jobId}` → gets status
- `GET /orchestrate/jobs?status=...` → lists jobs

## Docker Deployment

**Run all services**:
```bash
docker-compose up -d
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Orchestration: http://localhost:5000
- PostgreSQL: localhost:5432 (for persistence)
- Redis: localhost:6379 (for caching)

## Extensibility

### Adding a New Agent Role

1. Add method in `crews/core_brain_crew.py`:
   ```python
   @agent
   def analyst(self) -> Agent:
       return Agent(
           role="Data Analyst",
           goal="Analyze and extract insights",
           backstory="Expert in data visualization...",
           llm_config=self._get_llm_for_role("analyst"),
           tools=get_tools_by_category("analysis"),
       )
   ```

2. Add task in `_build_tasks()`:
   ```python
   self.tasks.append(Task(
       description="Analyze dataset...",
       expected_output="Insights and visualizations",
       agent=self.agents["analyst"],
   ))
   ```

3. Update crew edges and process in `core_crew()`.

### Adding a New Tool

1. Register in `tools/tool_loader.py`:
   ```python
   all_tools["new_tool"] = NewToolClass()
   TOOL_CATEGORIES["analysis"].append("new_tool")
   ```

2. Use in agents:
   ```python
   tools=get_tools_by_category("analysis")
   ```

## Monitoring & Observability

- **Logs**: Printed to console + optional file logging
- **Job Metrics**: Exposed via `/health` endpoint (work in progress)
- **Trace instrumentation**: OpenTelemetry is built‑in; set `ENABLE_TRACING=true` and point `OTLP_ENDPOINT` at `http://localhost:4318` (AI Toolkit trace viewer if running) or your OTLP collector.  Node.js server initializes spans for HTTP/Express calls, Python service instruments FastAPI.  Run VS Code command `ai-mlstudio.tracing.open` to start the collector.
- **Audit Trail**: Every agent execution and decision can be logged to database
- **Integration with LangSmith**: (Optional) Add LangSmith tracing for detailed debugging:
  ```python
  import langsmith
  langsmith.client.configure_client()
  ```

## Next Steps (Phase 2–3)

- **Phase 2**: Add sub-crews for exploding armies (Order 2)
- **Phase 3**: Implement Flows for event-driven universes (Order 3)
- **CPM Integration**: Use CPM output to prioritize agent execution
- **Memory & Learning**: Integrate your vector store for agent self-improvement
- **Visual Layer**: Expose agent execution graphs to dashboard

## Troubleshooting

### Service won't start
- Check Python version: `python --version` (need 3.11+)
- Check API keys in `.env`
- Check ports: `lsof -i :5000` (ensure 5000 is free)

### Jobs failing
- Check orchestration service logs: `docker logs orchestration`
- Verify LLM API keys are valid
- Ensure backend can reach service: `curl http://localhost:5000/health`

### Slow responses
- Check LLM provider latency (which model is slowest?)
- Use `model_preferences` to route to faster providers
- Increase agent task parallelization

## License

Same as AgentArmy OS (see root README).
