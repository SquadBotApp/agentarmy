# AgentArmy OS Platform Roadmap

## Vision
A **generalized AI operating system** that orchestrates multi-agent workflows with intelligent routing, real-time decision-making, and continuous learning. The platform is the foundation for enterprise AI deployments, tool marketplaces, and third-party integrations.

---

## Phase 1: Demo-Ready ✅ (COMPLETE)

### ✅ Orchestration Engine
- [x] CPM scheduling (critical path method)
- [x] ZPE/Möbius scoring (6-factor weighted)
- [x] Agent graph (4-agent model)
- [x] Decision engine (task routing)
- [x] Dual-payload support (legacy + advanced)

### ✅ HTTP Service
- [x] Flask lightweight wrapper (no Rust deps)
- [x] `/health`, `/orchestrate`, `/jobs` endpoints
- [x] Job management & polling
- [x] OpenTelemetry tracing hooks

### ✅ Integration & UI
- [x] Node.js backend (`/orchestrate` route)
- [x] React component (`OrchestrationPanel`)
- [x] Full tests & documentation
- [x] Live demo on localhost

**Status**: Production-ready for demo/PoC ✅

---

## Phase 2: Real Agent Execution (NEXT - 3 days)

### Goal
Wire the orchestration decisions to actual agent execution. Make the system **execute real tasks**.

### Components to Build

#### A. Agent Execution Layer
**File**: `orchestration/executor.py`
```python
class AgentExecutor:
    "Execute decisions returned by orchestrator"
    
    async def execute(self, task_id, agent_id, task_spec):
        """Run agent on task and return outcome"""
        agent = self._load_agent(agent_id)
        result = await agent.execute(task_spec)
        return {
            "task_id": task_id,
            "agent_id": agent_id,
            "status": "completed|failed",
            "output": result,
            "metrics": {"latency": ..., "tokens": ...}
        }
```

#### B. Agent Implementations
**File**: `orchestration/agents/`
- `planner_agent.py` - Strategic decomposition (Claude)
- `executor_agent.py` - Task execution (GPT-4)
- `critic_agent.py` - Output review (Anthropic)
- `governor_agent.py` - Policy enforcement (Llama)

#### C. Async Job Runner
**File**: `orchestration/job_runner.py`
```python
class JobRunner:
    "Manages job lifecycle: orchestrate → execute → feedback"
    
    async def run_workflow(self, job_spec):
        """Full loop: orchestrate → execute → learn → persist"""
        # 1. Orchestrate (get decision)
        # 2. Execute (run agent)
        # 3. Evaluate (compare expected vs actual)
        # 4. Learn (update ZPE weights)
        # 5. Persist (save outcomes)
```

### Deliverables

- [ ] Agent executor interface (abstract)
- [ ] 4 agent implementations (with real LLM calls)
- [ ] Async job runner (orchestrate → execute loop)
- [ ] Outcome tracking (latency, cost, quality)
- [ ] Tests for agent execution

### Success Criteria
- Submit task → Orchestrator decides → Agent executes → Result appears in UI ✅

---

## Phase 3: Persistence & Learning (3-4 days)

### Goal
**Store outcomes and continuously improve orchestration decisions.**

### Components

#### A. Persistence Layer
**File**: `orchestration/persistence/`
- `store.py` - Abstract storage interface
- `redis_store.py` - Redis backend (fast, distributed)
- `json_store.py` - JSON backend (local, simple)
- `postgres_store.py` - SQL backend (enterprise)

```python
# Save decision + outcome
await store.save_outcome({
    "job_id": "job-123",
    "decision": {...},
    "execution": {...},
    "metrics": {
        "latency": 2.34,
        "cost": 0.45,
        "quality_score": 0.92,
        "agent_fit": 0.88
    }
})
```

#### B. Learning Loop
**File**: `orchestration/learning/`
- `feedback_handler.py` - Collect outcome feedback
- `scorer.py` - Calculate empirical metrics
- `optimizer.py` - Adjust ZPE weights based on data
- `evaluator.py` - A/B test decisions

```python
# Learn from outcomes
outcomes = await store.query_outcomes(
    agent_id="executor",
    last_n_days=30
)
new_weights = optimizer.fit(outcomes)
orchestrator.update_zpe_weights(new_weights)
```

#### C. Dashboard Telemetry
**File**: `src/pages/TelemetryPage.tsx`
- Decision success rate by agent
- Cost vs quality tradeoff chart
- Learning curve visualization
- A/B test results

### Deliverables

- [ ] Abstract storage interface
- [ ] Redis + JSON implementations
- [ ] Learning loop that adjusts ZPE weights
- [ ] Telemetry dashboard
- [ ] A/B testing framework

### Success Criteria
- System learns which agents perform best ✅
- ZPE weights improve over time ✅
- Real ROI metrics visible in dashboard ✅

---

## Phase 4: Tool Registry & Marketplace (4-5 days)

### Goal
**Host third-party tools, agents, and workflows. Make AgentArmy a platform.**

### Components

#### A. Tool Registry
**File**: `orchestration/registry/`
- `tool_registry.py` - Catalog of available tools
- `agent_registry.py` - Catalog of agents
- `plugin_loader.py` - Dynamic loading

```python
# Register a tool
registry.register_tool({
    "id": "web-search",
    "name": "Web Search",
    "provider": "google",
    "cost_per_call": 0.001,
    "latency_ms": 200,
    "agents": ["planner", "executor"]  # compatible
})

# Load in orchestrator
agent = await registry.get_agent("executor")
```

#### B. Marketplace API
**File**: `server/routes/marketplace.js`
```
GET /marketplace/tools         - Browse tools
POST /marketplace/tools        - Upload tool
GET /marketplace/agents        - Browse agents
POST /agents/:id/invoke        - Run agent
```

#### C. Plugin System
**File**: `orchestration/plugins/`
- Abstract plugin interface
- Hook system (pre-orchestrate, post-execute)
- Sandboxed execution

```python
class AgentArmyPlugin:
    async def on_decision_made(self, decision):
        """Hook: after orchestration decision"""
        ...
    
    async def on_execution_complete(self, outcome):
        """Hook: after agent execution"""
        ...
```

### Deliverables

- [ ] Tool & agent registry
- [ ] Plugin loader & hook system
- [ ] Marketplace REST API
- [ ] Community tool examples
- [ ] Documentation for plugin developers

### Success Criteria
- Third-party tools appear in registry ✅
- Users can upload & run custom agents ✅
- Community can extend the platform ✅

---

## Phase 5: Deployment & Scaling (3-4 days)

### Goal
**Run AgentArmy in production—on-prem or cloud.**

### Components

#### A. Docker & Docker Compose
**File**: `Dockerfile`, `docker-compose.yml`
```yaml
services:
  orchestration:  # Flask + Python
    build: ./orchestration
    ports: ["5000:5000"]
  
  backend:        # Node.js
    build: ./server
    ports: ["4000:4000"]
  
  frontend:       # React
    build: ./
    ports: ["3000:3000"]
  
  redis:          # Persistence
    image: redis:latest
    ports: ["6379:6379"]
  
  postgres:       # Analytics
    image: postgres:15
    ports: ["5432:5432"]
```

#### B. Kubernetes Manifests
**File**: `k8s/`
- `deployment.yml` - Pod specs
- `service.yml` - Expose services
- `configmap.yml` - Configuration
- `persistent-volumes.yml` - Storage

#### C. Production Config
**File**: `orchestration/config.py`
```python
# Read from env, support multi-region
ORCHESTRATION_REPLICAS = int(os.getenv("REPLICAS", "3"))
REDIS_URL = os.getenv("REDIS_URL")
...
```

#### D. Monitoring & Alerts
**File**: `infrastructure/prometheus.yml`, `grafana-dashboards.json`
- Latency, error rate, throughput
- Cost per decision
- Learning loop health

### Deliverables

- [ ] Docker images & compose file
- [ ] Kubernetes manifests
- [ ] Helm charts (optional)
- [ ] Production environment checklist
- [ ] Monitoring dashboards

### Success Criteria
- Deployer runs one command: `docker-compose up` ✅
- System scales to 10,000 decisions/min ✅
- Monitoring shows real-time health ✅

---

## Phase 6: Enterprise & Pilots (Ongoing)

### Goal
**Partner with early customers, gather feedback, refine platform.**

### Activities

#### A. Customer Solutions
- [ ] Build "Reference Architectures" for common use cases
  - Customer support triage (classify → route → respond)
  - Data processing pipelines (extract → analyze → summarize)
  - Code review automation (understand → critique → suggest)

#### B. Pilot Programs
- [ ] 3-5 enterprise pilots
- [ ] Revenue model (per-decision, per-agent, per-tool)
- [ ] SLA & support

#### C. Documentation
- [ ] Admin guide (deploy, configure, operate)
- [ ] Developer guide (build agents, plugins, tools)
- [ ] API reference (all endpoints)
- [ ] Case studies & ROI calculator

---

## High-Level Architecture (End State)

```
┌─────────────────────────────────────────────────────────────┐
│                     React Dashboard                          │
│   (Orchestration, Telemetry, Marketplace, Settings)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Node.js Backend                            │
│   (/orchestrate, /marketplace, /jobs, /analytics)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Python Orchestration Core                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Orchestrator (CPM, ZPE, Möbius, Routing)            │   │
│  │ + Agent Executor (runs decisions)                    │   │
│  │ + Learning Loop (feedback → optimization)            │   │
│  │ + Tool Registry (marketplace)                        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼──┐   ┌──────▼──┐   ┌──────▼──┐
    │Redis │   │Postgres │   │S3/Cloud│
    │Cache │   │Analytics│   │Storage │
    └──────┘   └─────────┘   └────────┘
    
    + External: LLM APIs, Tools, Custom Agents
```

---

## Timeline & Effort

| Phase | Duration | Team | Status |
|-------|----------|------|--------|
| 1: Demo | ✅ Done | 1 | Complete |
| 2: Execution | 3 days | 1-2 | Ready to start |
| 3: Learning | 3-4 days | 1-2 | Following |
| 4: Marketplace | 4-5 days | 2-3 | Following |
| 5: Deployment | 3-4 days | 1-2 | Following |
| 6: Enterprise | Ongoing | 3+ | Parallel |

**Total to MVP**: ~18-20 days  
**Current progress**: Phase 1 ✅, ready for Phase 2

---

## Success Metrics

By end of Phase 5:
- [ ] Orchestration decisions in < 100ms
- [ ] Agent execution in < 5s (P95)
- [ ] Learning loop converging (ZPE MAE decreasing)
- [ ] 10+ community-built tools in registry
- [ ] 1,000+ decisions/day in production use
- [ ] Customer satisfaction > 4.5/5

---

## Getting Started: Phase 2 - Agent Execution

**Next step**: Build agent executor layer.

```bash
# Start here:
cd orchestration
touch executor.py           # Abstract executor
mkdir agents/
touch agents/planner.py     # Real implementations
# ... implement 4 agents
```

This connects orchestration decisions to **real execution**.

---

**Let's build the OS.** 🚀
