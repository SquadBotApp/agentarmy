# AgentArmy OS — Implementation Roadmap

> Architecture is done. Every layer is defined. 70+ core TypeScript modules,
> 5 real LLM-backed agents, CPM scheduler, ZPE scorer, lifecycle manager,
> deployment orchestrator, React dashboard, Node.js API, SQLite persistence —
> all exist.  
>
> **This roadmap turns the blueprint into a running system.**

---

## Current State (Post-Architecture)

### What Already Works End-to-End
| Slice | Path |
|-------|------|
| **Auth** | React login → Node JWT → role-gated endpoints |
| **Orchestration loop** | React panel → `POST /orchestrate` → Python CPM + ZPE → Planner/Executor/Critic/Synthesizer (real Claude) → SQLite persist → React display |
| **Lifecycle management** | React LifecyclePanel → 13 FastAPI endpoints → 828-line state machine (candidate→active→frozen→retired) with constitutional safety |
| **Deployment orchestrator** | MissionGraph DAG, team composition, runner assignment, ZPE adaptation (760 LOC) |
| **LLM routing** | 5 providers (OpenAI, Anthropic, Groq, xAI, Gemini) with scoring, caching, fallback, consensus mode |
| **Analytics** | SQLite tables for jobs, tasks, decisions, agent_performance — exposed via `/analytics/*` |
| **Honeycomb viz** | Full SVG cognitive map with animated connections, module states, task submission |
| **Prompt management** | CRUD with file persistence, RBAC-gated |

### What Exists but Isn't Connected
| Asset | Gap |
|-------|-----|
| 59 → 63+ TypeScript core modules | Not consumed by dashboard — purely structural classes |
| `TotalSystemUnification` kernel (62 subsystems wired) | Never instantiated by the app |
| 9 newest layers (quantumSymbiosis, hyperDimensionalCore, etc.) | Created but not wired into the kernel |
| `tool_registry.yaml` (6 providers) | No code loads it |
| 8 server-side tools (tools.js) | Tool selector picks tools, but no executor runs them |
| CrewAI tools (tool_loader.py) | Imported but never invoked by agents |
| Postgres + Redis (docker-compose) | Defined services, zero connections |
| Dockerfiles | Referenced by compose but don't exist |
| Learning stubs in job_runner | `weights_updated: False` placeholder |
| Agent scores in orchestrator | Hardcoded 0.7/0.7 instead of real Critic output |

---

## Phase 0 — Smoke Test ✅ (Now)
> Goal: Prove the existing end-to-end loop starts and completes.

- [x] Fix syntax bug in `server/index.js` (stray `}` at L166)
- [ ] Set `ANTHROPIC_API_KEY` in `server/.env`
- [ ] Start Python: `cd orchestration && uvicorn app:app --port 5000`
- [ ] Start Node: `cd server && node index.js`
- [ ] Start React: `npm start`
- [ ] Login as `admin/admin`, open Orchestration panel, submit a task
- [ ] Verify: decision + ZPE scores + alternatives render

**Exit criteria:** One task goes React → Node → Python → Claude → back, stored in SQLite, visible in dashboard.

---

## Phase 1 — Wire the Kernel to the Dashboard
> Goal: The 42-subsystem kernel becomes the live brain of the UI.

### 1a. Instantiate the Kernel (singleton)
**File:** `src/core/index.ts` (new)
```ts
import { TotalSystemUnification } from './totalSystemUnification';
export const kernel = new TotalSystemUnification();
```

### 1b. Wire the 9 Missing Layers
**File:** `src/core/totalSystemUnification.ts`
- Import `QuantumSymbiosis`, `HyperDimensionalCore`, `NeuralInfinityLayer`,
  `CosmicAbstraction`, `EternityFabric`, `VoidIntegration`,
  `RealityTranscender`, `DimensionWeaver`, `SingularityExtension`
- Add readonly fields, constructor instantiations, status entries
- Target: **51 subsystems** (42 + 9)

### 1c. Kernel Health Dashboard Card
**File:** `src/components/KernelHealthCard.tsx` (new)
- Call `kernel.getSnapshot()` on a 5-second interval
- Render: total subsystems, healthy count, unhealthy list
- Replace the hardcoded "Governance" / "Cost" / "Universes" cards

### 1d. Subsystem Detail Drill-Down
**File:** `src/components/SubsystemDetail.tsx` (new)
- Click any subsystem → modal with its `getSummary()` data
- Table of key/value pairs, health indicator, timestamp

### 1e. Kernel Store
**File:** `src/store/kernelStore.ts` (update existing)
- Zustand store subscribing to `kernel.on(...)` updates
- Exposes: `snapshot`, `subsystems`, `isHealthy`, `uptimeMs`
- Components consume the store, not the kernel directly

**Exit criteria:** Dashboard header shows "51 subsystems — all healthy" with real data from TotalSystemUnification.

---

## Phase 2 — Tool Execution Engine
> Goal: The 8 server tools actually DO things when selected.

### 2a. Tool Runner
**File:** `server/toolRunner.js` (new)
```
toolRunner.execute(toolName, params) → { success, output, error }
```
Implements each of the 8 tools:
| Tool | Implementation |
|------|---------------|
| `review_files` | `fs.readFileSync` on target paths |
| `update_file` | `fs.writeFileSync` with backup |
| `verify_env` | Check `process.env` for required keys |
| `create_env_file` | Write template `.env` from tool_registry |
| `test_llm_integration` | Ping each enabled provider with a 1-token prompt |
| `run_workflow` | Call Python `/orchestrate` with the workflow spec |
| `manage_prompts` | Delegate to existing `/prompts` CRUD |
| `log_and_audit` | Append to `logs/` JSONL files |

### 2b. Load tool_registry.yaml
**File:** `server/tools.js` (update)
- Read `../tool_registry.yaml` at startup with `js-yaml`
- Merge provider metadata (cost, latency, endpoint) into tool selector context
- Router agent uses real cost data for scoring

### 2c. Connect CrewAI Tools to Python Agents
**File:** `orchestration/agents/executor_agent.py` (update)
- Import tools from `tools/tool_loader.py`
- Executor agent appends tool descriptions to its system prompt
- When Claude returns a tool_use block, executor invokes the matching CrewAI tool

### 2d. Wire Tool Execution to `/orchestrate` Response
**File:** `server/index.js` (update)
- After tool selection, call `toolRunner.execute()`
- Include `tool_output` in the response payload
- Frontend displays tool results in OrchestrationPanel

**Exit criteria:** Submit "Review the server code for security issues" → tool selector picks `review_files` → toolRunner reads the files → Claude analyzes them → output displayed.

---

## Phase 3 — Persistence & Learning Loop
> Goal: The system remembers and improves.

### 3a. Replace In-Memory Python Job Store
**File:** `orchestration/app.py` (update)
- Replace `jobs: Dict[str, JobResult] = {}` with SQLite via `aiosqlite`
- Schema: `jobs(id, goal, status, result, created_at, completed_at)`
- Fallback: keep in-memory dict if DB unavailable

### 3b. Wire Real Critic Scores to Orchestrator
**Files:** `orchestration/orchestrator.py`, `orchestration/job_runner.py`
- After Critic agent runs, feed its 5-dimension scores back into ZPE
- Replace hardcoded `usefulness=0.7, coherence=0.7` with actual values
- Möbius inertia blending applies to real data

### 3c. Close the Learning Loop
**File:** `orchestration/job_runner.py` (update)
- After job completion, POST agent performance to Node `/analytics/agents`
- Node-side `computeAgentWeights()` already works
- Next orchestration request includes learned weights via `agent_weights`
- Replace `learn_stub` with real weight persistence

### 3d. Cost Tracking
**Files:** `orchestration/agents/llm_client.py`, `server/router_agent.js`
- LLM client records `prompt_tokens` and `completion_tokens` per call
- Multiply by provider's per-token cost from tool_registry
- Persist to SQLite `decisions.cost` field
- Dashboard displays real cost in analytics cards

**Exit criteria:** Run 10 tasks. View `/analytics/config` — agent weights have changed from defaults based on actual performance. ZPE scores use real Critic data. Cost column is populated.

---

## Phase 4 — Infrastructure & Deployment
> Goal: `docker-compose up` brings the full stack to life.

### 4a. Create Dockerfiles
```
docker/
  Dockerfile.frontend   → multi-stage: npm build → nginx
  Dockerfile.backend    → node:20-slim, copy server/, npm ci --prod
  Dockerfile.orchestration → python:3.13-slim, pip install -r requirements.txt, uvicorn
```

### 4b. Connect Postgres
**File:** `server/db.js` (update)
- Add `pg` driver alongside `better-sqlite3`
- Environment toggle: `DB_DRIVER=postgres|sqlite`
- Same interface, swappable backend
- Migrate schema to Postgres with Knex or raw DDL

### 4c. Connect Redis
**Files:** `server/router_agent.js`, `orchestration/app.py`
- Replace `node-cache` with `ioredis` in router agent
- Replace in-memory job dict in Python with Redis (via `redis.asyncio`)
- Shared cache: Python and Node can read each other's job state

### 4d. Health Checks & Readiness
- Node: `GET /health` returns DB status + orchestration reachability
- Python: `GET /health` already exists — add DB/Redis checks
- docker-compose health checks call these endpoints

### 4e. Environment & Secrets
- Create `docker/.env.template` with all required vars
- Document provider key setup in README
- Support `docker-compose --env-file` for flexible deploys

**Exit criteria:** `docker-compose up --build` starts all 5 services. Health checks pass. Submit a task from the browser.

---

## Phase 5 — Cross-Subsystem Intelligence
> Goal: The kernel layers become participants, not spectators.

### 5a. Telemetry Firehose
- Every orchestration request emits events through `ExecutionTelemetry`
- `TemporalContinuityEngine` records time-series data
- `GlobalStateSynchronizer` maintains a real-time state snapshot

### 5b. Governance Enforcement
- `EcosystemGovernance` receives Critic verdicts + Governor safety flags
- `ConstitutionalEnforcementGrid` validates against rules before execution
- Violations block execution and appear in LifecyclePanel

### 5c. Economic Integration
- `AutonomousEconomyEngine` tracks token spend per agent per job
- Economy events feed into `MetaGovernanceCouncil` for budget governance
- Dashboard "Cost" card shows real economy data

### 5d. Federation & Multi-Tenant
- `FederatedIntelligenceMesh` enables cross-workspace knowledge sharing
- `MultiTenantIsolationLayer` enforces workspace boundaries
- `InterAgentProtocol` standardizes cross-agent message format

### 5e. Meta-Cognition Loop
- `MetaCognitionEngine` observes the learning loop's effectiveness
- Proposes orchestrator parameter changes (ZPE weights, risk tolerance)
- `RecursiveSelfDesign` evaluates proposed changes against safety constraints
- Admin approval gate before applying changes

**Exit criteria:** Kernel subsystems emit/consume real events. Governance blocks an unsafe task. Economy card shows real spend. Meta-cognition proposes a weight change.

---

## Phase 6 — Advanced Capabilities
> Goal: Unlock the higher-order layers.

| Layer | Activation Trigger |
|-------|-------------------|
| `SingularityKernel` | Self-modifying agent configurations via evolutionary proposals |
| `UniversalAbstraction` | Normalize heterogeneous LLM outputs into a unified schema |
| `SyntheticRealityFabric` | Simulation sandbox for testing agent chains before live execution |
| `TranscendentMission` | Multi-step, multi-day mission planning with checkpoints |
| `ContinuumEngine` | Epoch-based version control for the entire system state |
| `QuantumAdaptiveIntelligence` | Route decisions based on provider capability matrices |
| `InterCivilizationalProtocol` | Cross-deployment agent mesh communication |
| `PlanetScaleOrchestration` | Geo-distributed task routing and replication |
| `CivilizationIntelligence` | Signal aggregation across all subsystems for anomaly detection |

---

## Phase 7 — Epistemic & Cultural Intelligence Stack ✅
> Goal: The OS evaluates information quality, cultural context, symbolic
> meaning, and routes everything through a unified adaptive trigger pipeline.
> 55 subsystems total (52 → 55).

### 7a. Epistemic Integrity Layer ✅
**File:** `src/core/epistemicIntegrity.ts` (~900 lines, new)
- Source registration with rolling reliability scores
- Claim evaluation pipeline: reliability × worthiness → confidence → tier
- 4 verification tiers: `tier1_fast`, `tier2_deprioritize`, `tier3_deep`, `tier4_discard`
- Cross-source triangulation (token overlap → agreement score)
- 7 bias detection categories (emotional → authority)
- Anomaly detection: reliability drops, bias surges, conflict spikes, stale data, hallucination risk
- ZPE cost modifier: low-confidence → higher path cost
- Human-readable epistemic traces
- Wired into TotalSystemUnification as subsystem #52
- Cross-wiring: cognitive field listener, constitutional `epistemic-confidence-gate` rule, economy penalties

### 7b. Cultural-Historical Contextualization Layer ✅
**File:** `src/core/culturalHistoricalContext.ts` (~600 lines, new)
- 8 source types: archaeological evidence, ancient text, religious literature, mythological narrative, metaphysical concept, anthropological data, oral tradition, epigraphic record
- 6 context types: empirical, historical, cultural, symbolic, philosophical, anthropological
- 6-factor methodological confidence scoring: dating reliability, textual transmission, archaeological context, cultural consistency, symbolic meaning, anthropological consensus
- Context-to-badge mapping for UI: "Archaeological Evidence", "Ancient Textual Source", "Cultural Narrative", etc.
- Mission domain suitability constraints: empirical_only, cultural_allowed, symbolic_allowed, philosophical_allowed
- Content-adaptive factor boosting (detects dating methods, provenance references, fieldwork terms)
- ZPE cost modifier scaled by context type (empirical = 1, symbolic = 2.2)
- Wired into TotalSystemUnification as subsystem #53
- Cross-wiring: civilization intelligence signals for non-empirical items, constitutional `cultural-domain-gate` rule

### 7c. Symbolic Interpretation Layer ✅
**File:** `src/core/symbolicInterpretation.ts` (~800 lines, new)
- Archetype detection engine: 13 archetypes (hero, mentor, trickster, guardian, shadow, herald, shapeshifter, rebirth, sacrifice, creator, destroyer, mediator, outcast)
- Motif detection engine: 15 symbolic motifs (creation cycle, hero journey, cosmic duality, flood narrative, world tree, sacred mountain, etc.)
- Cultural function identification: 9 functions (identity formation, moral teaching, cosmology, social cohesion, rite of passage, healing ritual, ancestral memory, political legitimation, epistemological model)
- Cross-cultural parallel mapping: compares motifs and archetypes across traditions, classifies parallel strength (strong → speculative)
- Cultural origin profiling: auto-detects tradition (Greek, Norse, Egyptian, Hindu, Biblical, Buddhist, etc.) from content keywords
- Symbolic summary engine: structured multi-section summaries (origin, structure, archetypes, functions, notes, parallels)
- Visual map generator: nodes (motifs, archetypes, origins, functions, parallels) + edges for dashboard rendering
- 7 symbolic badges: "Symbolic Narrative", "Archetypal Pattern", "Cultural Motif", etc.
- Wired into TotalSystemUnification as subsystem #54
- Cross-wiring: civilization intelligence signals for strong cross-cultural parallels

### 7d. Unified Trigger Pipeline ✅
**File:** `src/core/unifiedTriggerPipeline.ts` (~650 lines, new)
- 8-stage processing pipeline: Perception → Classification → Epistemic Evaluation → Symbolic/Cultural Interpretation → Mission Relevance → Cognitive Routing → Safety Enforcement → UI Activation
- Adaptive heuristic system (slow-and-stable): 9 dimensions (symbolic_depth, uncertainty_tolerance, epistemic_strictness, cultural_interest, mission_complexity, ui_density, archetype_engagement, metaphysical_engagement, verification_intensity)
- Learning rate: 1% per reinforcement event, minimum 25 reinforcements before any adaptation, maximum 30% drift from baseline
- Fixed moral spine: safety constraints, cultural respect, epistemic integrity rules — never adapted
- Domain classification via keyword patterns (empirical, historical, symbolic, philosophical, cultural, anthropological, technical, operational)
- Proportional trigger intensity: silent → soft → moderate → strong → critical
- Route recommendations: fast_path, weighted_branch, sandboxed, escalated
- Safety enforcement: constitutional content checks, epistemic reliability gates, domain misuse detection
- UI activation: dynamic badge assignment, confidence bars, symbolic map display, density scaling
- Cognitive profile: per-user heuristic state that evolves over long-term interaction patterns
- Wired into TotalSystemUnification as subsystem #55
- Cross-wiring: civilization intelligence signals for safety blocks

**Exit criteria:** Dashboard shows "55 subsystems — all healthy". Epistemic, cultural, symbolic, and trigger layers all wired with cross-subsystem integrations. Zero compile errors.

---

## Phase 8 — Integrity & Safety Kernel ✅
> Goal: Provide a non-bypassable universal gatekeeper — firewall + scanner +
> ethics engine that evaluates every input, intermediate artifact, and output.
> 56 subsystems total (55 → 56).

### 8a. IntegritySafetyKernel ✅
**File:** `src/core/integritySafetyKernel.ts` (~500 lines, new)
- 6 internal sub-modules: StructuralPatternScanner, SubliminalSignalDetector, FraudRiskAnalyzer, EthicsLegalityGate, MaturityClassifier, DecisionAggregator
- 5 decision levels with strict precedence: BLOCK > REQUIRE_AGE_CONFIRMATION > REQUIRE_VERIFICATION > REDACT > ALLOW
- Hard-coded ethics rules (non-adaptive moral spine): exploitation, hate speech, violence/WMD instructions, illegal activities
- Structural pattern scanning: excessive repetition, spacing anomalies, Unicode abuse, HTML entity tricks, acrostic detection, character concentration
- Subliminal/cryptic detection: hidden Unicode, homoglyph mixing, coded message inference, repeated phrase analysis
- Fraud & manipulation analysis: scam, phishing, impersonation, high-pressure tactics, false certainty language
- Maturity classification: GENERAL / MATURE_18 / PROHIBITED with age-gate integration
- Prohibited content detection (always blocked regardless of age confirmation)
- Output sanitization pass (`sanitizeOutput()`) for agent/tool outputs
- Event-driven feed for dashboard Integrity Panel
- Global status tracking: SAFE / DEGRADED / ALERT based on recent event window
- Wired into TotalSystemUnification as subsystem #56
- Cross-wiring: civilization intelligence signals for blocks, constitutional `integrity-safety-gate` rule

**Exit criteria:** Dashboard shows "56 subsystems — all healthy". All content paths pass through the ISK before reaching cognition, missions, or agents. Zero compile errors.

---

## Phase 9 — Polyglot Intelligence Stack ✅
> Goal: Give the OS the ability to detect, translate, compare, and reason
> across all major language families with cultural nuance, symbolic preservation,
> and safety enforcement in every language.
> 57 subsystems total (56 → 57).

### 9a. PolyglotIntelligenceStack ✅
**File:** `src/core/polyglotIntelligenceStack.ts` (~700 lines, new)
- 60+ built‑in language entries across 14 language families: Indo‑European, Sino‑Tibetan, Afro‑Asiatic, Niger‑Congo, Austronesian, Turkic, Uralic, Dravidian, Japonic, Koreanic, Indigenous, Ancient, Constructed, Unknown
- 8 ancient languages: Latin, Ancient Greek, Sanskrit, Old Norse, Classical Chinese, Ancient Egyptian, Akkadian, Sumerian
- 3‑layer language detection: Unicode script range analysis → keyword/function‑word matching → merged confidence scoring
- 15 script families detected by Unicode block boundaries: Latin, Cyrillic, Arabic, Devanagari, Hanzi, Kana, Hangul, Thai, Ge’ez, Tibetan, Hebrew, Greek, Tamil, Telugu, Other
- 14 language‑specific keyword hint patterns for major languages
- Mixed‑language input detection (multiple strong keyword signals)
- 6 translation modes: literal, semantic, cultural, symbolic, technical, safety
- Translation confidence calculation: base detection × ancient penalty × cross‑family penalty × mixed penalty × mode multiplier
- Mode‑specific cultural and symbolic annotations
- Cross‑lingual concept comparison: semantic similarity (Jaccard), cultural divergence (family distance), symbolic parallels
- Speech‑to‑Text (STT) integration point: language‑aware transcription metadata
- Text‑to‑Speech (TTS) integration point: language‑aware synthesis metadata
- OCR integration point: script‑aware text extraction metadata
- Adaptive preferences (slow, stable): symbolic depth, UI density, preferred languages/mode/mission default
- Learning rate 1%, minimum 25 reinforcements, maximum 30% drift
- Safety, ethics, legality, maturity — NEVER adapt
- Event‑driven feed for dashboard Language Panel
- Registry queries: by family, ancient languages, supported families
- Top‑language usage tracking
- Wired into TotalSystemUnification as subsystem #57
- Cross‑wiring: civilization intelligence signals for low‑confidence translations

**Exit criteria:** Dashboard shows "57 subsystems — all healthy". The polyglot stack detects language, translates across families, and integrates with ISK, epistemic, cultural, and symbolic layers. Zero compile errors.

---

## Phase 10 — Strategic Intelligence & ML ✅
> Goal: Add god‑mode strategy, search ranking, predictive analytics, and a full
> machine‑learning layer with neural‑network support.
> 61 subsystems total (57 → 61).

### 10a. GodModeStrategy ✅
**File:** `src/core/godModeStrategy.ts` (new)
- 6 strategy modes: Defensive, Offensive, Balanced, AIPredictive, Expansion, Stealth
- Resource management with named resource keys
- Objective tracking with id, description, priority, progress
- Victory‑probability calculator with mode/resource/progress factors
- Action execution pipeline with event listeners
- Amplification factor 1000
- Event‑driven feed: `on(listener)` → unsubscribe
- Wired into TotalSystemUnification as subsystem #58
- Cross‑wiring: civilization intelligence signals for strategic action events

### 10b. SearchIntelligenceEngine ✅
**File:** `src/core/searchIntelligenceEngine.ts` (~805 lines, pre‑existing)
- 9 signal families: semantic, behavioral, authority, freshness, popularity, quality, safety, symbolic, epistemic
- Multi‑vector document indexing and retrieval
- 5‑stage modular twiddler stack (base, freshness, authority, safety, diversity)
- Adaptive signal‑weight reinforcement
- Entity‑based queries (person, place, concept, archetype, event, organization)
- Behavioral & popularity feedback recording
- Event‑driven: `on(listener)` → unsubscribe
- Wired into TotalSystemUnification as subsystem #59
- Cross‑wiring: civilization intelligence signals for empty search results

### 10c. PredictiveAnalyticsLayer ✅
**File:** `src/core/predictiveAnalyticsLayer.ts` (new)
- 5 predictive models: TrendForecasting, ProbabilisticSimulation, StrategicForesight, TemporalProjection, IntelligenceDriven
- Analysis pipeline integrating GodModeStrategy, SearchIntelligenceEngine, ContinuumEngine, OmniDomainIntegration
- Propagation API for downstream consumers
- Amplification factor 1000
- Event‑driven: `on(listener)` → unsubscribe
- Wired into TotalSystemUnification as subsystem #60
- Cross‑wiring: civilization intelligence signals for low‑confidence forecasts

### 10d. MachineLearningLayer ✅
**File:** `src/core/machineLearningLayer.ts` (~750 lines, new)
- 6 ML model types: Classification, Regression, Clustering, Reinforcement, TimeSeries, NeuralNetwork
- Dataset management: add, fetch from SearchIntelligenceEngine, list
- Classical model training with type‑specific simulation (logistic, linear, K‑Means, Q‑Learning, temporal)
- **Full neural‑network subsystem:**
  - `NeuralNetwork` interface with layer definitions, weights, biases, activation functions
  - 5 architecture families: MLP, Convolutional, Recurrent, Attention, Autoencoder
  - 4 activation functions: sigmoid, relu (Math.max), tanh, linear
  - `buildNeuralNetwork()` — generates random‑weight networks for any layer topology
  - `neuralForward()` — matrix multiply → bias → activation per layer
  - `neuralBackward()` — finite‑difference weight perturbation training
  - `mseLoss()` — mean‑squared‑error loss computation
  - `countParameters()` — weights + biases per layer
  - `NeuralModelRecord` tracking: id, architecture, layers, params, final loss
  - Loss‑history tracking per neural model
- Unified `infer()` — works for classical & neural models alike
- End‑to‑end `runPipeline()`: search fetch → temporal annotation → train → inference → propagation
- Cross‑layer integration:
  - PredictiveAnalyticsLayer: `setModel()` alignment, `propagatePrediction()` on inference
  - GodModeStrategy: `setMode(AIPredictive)` alignment, `calculateVictoryProbability()` in RL training
  - SearchIntelligenceEngine: `search()` for dataset fetching
  - ContinuumEngine: `getCurrentEpoch()` for temporal‑phase weighting
  - OmniDomainIntegration: `registerDomain()` for each trained model
- 10^3 amplification on datasets via noisy row replication
- Event system: train, infer, neural‑train, neural‑infer, reset events
- `getSummary()` for TSU health panel
- Wired into TotalSystemUnification as subsystem #61
- Cross‑wiring: civilization intelligence signals for neural training events and low‑accuracy alerts

**Exit criteria:** Dashboard shows "61 subsystems — all healthy". ML layer trains/infers classical & neural models, integrates with all strategic/search/analytics/continuum layers. 0 compile errors. 7 TS suites (32 tests) + 15 Python tests pass.

---

## Phase 11 — Transformer Architecture & Arsenal Toolkit ✅
> Goal: Extend the ML layer with full Transformer/multi-head attention support,
> and create a comprehensive 200-tool arsenal registry.
> 62 subsystems total (61 → 62).

### 11a. Transformer / Self-Attention Extension ✅
**File:** `src/core/machineLearningLayer.ts` (extended, ~1140 lines)
- New `MLModelType.Transformer` enum value
- New `'transformer'` architecture family
- **Transformer-specific types:**
  - `AttentionConfig` — dModel, numHeads, headDim, dropoutRate
  - `TransformerConfig` — numLayers, dModel, numHeads, ffnHiddenDim, vocabSize, maxSeqLen, dropoutRate
  - `TransformerNetwork` — stored model with Q/K/V/O projections and FFN weights per layer
  - `TransformerModelRecord` — serializable record for dashboard/tracking
- **Pure-function transformer engine:**
  - `softmax()` — row-wise softmax with numerical stability (max subtraction)
  - `transpose()` — matrix transpose
  - `tensorAdd()` — element-wise tensor addition
  - `scaledDotProductAttention()` — Q·K^T/√dk → softmax → ·V
  - `multiHeadAttention()` — split into heads, compute per-head attention, concatenate, project
  - `transformerBlock()` — self-attention + residual + FFN (ReLU) + residual
  - `countTransformerParams()` — 4·dModel² + numLayers·2·dModel·ffnHidden
  - `buildTransformerNetwork()` — random weight initialization for all projections and FFN layers
  - `transformerForward()` — sequential pass through N transformer blocks
  - `transformerBackward()` — finite-difference weight perturbation training
- **MachineLearningLayer methods:**
  - `trainTransformerModel(id, config, datasetKey, lr?, epochs?)` — build, pad dataset to dModel, train loop, register, emit events
  - `listTransformerModels()` — enumerate all registered transformer models
  - `getTransformerLossHistory(id)` — loss curve for a transformer model
  - Transformer case in `trainModel()` switch — auto-configures dModel from dataset columns
- `TransformerNetwork` registered in state, wrapped as `FunctionalModel` for uniform `infer()`
- `MachineLearningLayerSummary.transformerModelCount` added
- `getSummary()` includes transformer parameter counts and model count

### 11b. ArsenalToolkit ✅
**File:** `src/core/arsenalToolkit.ts` (~580 lines, new)
- **200 tools** organized into 10 categories (20 tools each):
  - **Productivity** (10 free + 10 paid): Notion, Obsidian, Trello, Todoist, Google Docs, Zettlr, Joplin, LibreOffice, Logseq, Standard Notes / Monday.com, Asana, ClickUp, Roam Research, Craft, Basecamp, Airtable, Microsoft 365, Coda, Confluence
  - **Development** (10 free + 10 paid): VS Code, Git, Node.js, Docker, PostgreSQL, ESLint, Prettier, Vite, Rust, Python / GitHub Copilot, JetBrains, GitKraken, Postman Pro, Datadog, Sentry, LaunchDarkly, Vercel Pro, CircleCI, Snyk
  - **AI/Data** (10 free + 10 paid): Hugging Face, LangChain, Ollama, Jupyter, Pandas, scikit-learn, PyTorch, TensorFlow, Spark, DuckDB / OpenAI API, Claude, Cohere, W&B, Databricks, Scale AI, Pinecone, Snowflake, Midjourney, Replicate
  - **Security** (10 free + 10 paid): Wireshark, Nmap, Metasploit, OWASP ZAP, Kali, ClamAV, OpenVPN, Fail2Ban, GnuPG, Suricata / Burp Suite Pro, CrowdStrike, Tenable, 1Password, Wiz, Prisma, Rapid7, FortiGate, SentinelOne, Checkmarx
  - **Media/Creative** (10 free + 10 paid): GIMP, Inkscape, Blender, Audacity, OBS, Kdenlive, DaVinci Resolve, Krita, HandBrake, Shotcut / Adobe CC, Final Cut Pro, Logic Pro, Ableton, Canva Pro, Figma Pro, Sketch, Affinity, Cinema 4D, Substance 3D
  - **System Utilities** (10 free + 10 paid): htop, tmux, curl, rsync, 7-Zip, VirtualBox, WinSCP, BleachBit, Sysinternals, Ventoy / VMware, Parallels, Acronis, ESET, CCleaner Pro, WinRAR, Directory Opus, iStat Menus, Fences, MobaXterm
  - **Browsers/Communication** (10 free + 10 paid): Firefox, Brave, Thunderbird, Signal, Element, Jitsi, Discord, Mattermost, Telegram, Zulip / Slack Pro, Teams, Zoom Pro, Google Workspace, Front, Intercom, Loom, Calendly, Webex, RingCentral
  - **Design/UX** (10 free + 10 paid): Penpot, Lunacy, Pencil Project, Diagrams.net, Storybook, Excalidraw, Wireframe.cc, Color Hunt, Font Awesome, Google Fonts / Figma Org, Abstract, InVision, Zeplin, Maze, UserTesting, Axure RP, Principle, ProtoPie, Framer
  - **Enterprise** (10 free + 10 paid): Grafana, Prometheus, Keycloak, MinIO, Kafka, Elasticsearch, Terraform, Ansible, Kong, Harbor / Splunk, PagerDuty, ServiceNow, Okta, Vault, New Relic, Salesforce, SAP, Jira, CloudFormation
  - **Specialized** (10 free + 10 paid): Godot, Arduino IDE, QGIS, OpenSCAD, Wireshark Profiles, Ghidra, FreeCAD, GNU Radio, ROS 2, KiCad / Unity Pro, Unreal, MATLAB, Mathematica, SolidWorks, AutoCAD, LabVIEW, Tableau, ArcGIS Pro, Altium Designer
- **Each tool entry:** id, name, category, tier (free/paid), description, URL, tags[], rating, usageCount, licensed
- **Query API:** getAll(), getById(), getByName(), filter(criteria), search(text), getByCategory(), getFreeTools(), getPaidTools(), getTopRated(), getMostUsed()
- **Analytics:** getCategoryCounts(), getAllTags()
- **Usage tracking:** useTool(id) — increments count, requires license
- **Licensing:** licenseTool(id), revokeLicense(id), getLicensedPaidTools()
- Event system: tool-used, tool-licensed, search, reset events
- `getSummary()` for TSU dashboard
- Wired into TotalSystemUnification as subsystem #62
- Cross-wiring: civilization intelligence signals for tool usage and license events

**Exit criteria:** Dashboard shows "62 subsystems — all healthy". Transformer extends ML layer with multi-head attention, residual connections, and FFN. Arsenal provides 200 searchable/filterable tools with licensing. 0 compile errors. 7 TS suites (32 tests) + 15 Python tests pass.

---

## Phase 12 — Defensive Intelligence Substructure & QubitCoin Economic Engine ✅
> Goal: Create the DIS — AgentArmy's private strategic intelligence organ and
> self-improvement pipeline — plus the QubitCoin full economic engine (dormant
> by default). 63 subsystems total (62 → 63).

### 12a. Defensive Intelligence Substructure ✅
**File:** `src/core/defensiveIntelligenceSubstructure.ts` (~2000 lines, new)
- **Subsystem #63** — root-owner-only, never exposed to tenants or public APIs
- **Ecosystem monitoring:**
  - 12 ecosystem domains: open-source-models, commercial-models, agent-frameworks, vector-databases, orchestration-systems, adversarial-techniques, safety-research, regulatory-changes, compute-scaling, competitor-platforms, research-papers, hardware-accelerators
  - 15 sample signal templates for realistic scanning simulation
  - `collectSignals()` — scans AI ecosystem, enriches via SearchIntelligenceEngine, classifies signals
  - `classifySignal()` — maps domains to Threat/Opportunity/Neutral/Unknown
- **Simulation engine:**
  - `runSimulations()` — sandboxed threat/opportunity analysis for each signal
  - `simulateThreat()` — compound risk = likelihood × impact, weighted by temporal phase and victory probability
  - `simulateOpportunity()` — value/cost/safety/strategic advantage scoring
  - `computeNetScore()` — −1 (pure threat) → +1 (pure opportunity)
  - Integration with ContinuumEngine (epoch phase weighting), GodModeStrategy (victory probability), PredictiveAnalyticsLayer (strategic foresight mode)
- **Proposal pipeline:**
  - 10 `ProposalType` values: NewModel, NewDefense, NewHeuristic, NewAgent, NewTool, NewSafetyRule, NewReasoningPath, CounterMeasure, OptimizeExisting, RegulatoryAdaptation
  - `generateProposals()` — auto-generates typed upgrade proposals from simulation results
  - Priority derivation: composite of |netScore| + riskScore → critical/high/medium/low
  - Each proposal: id, type, title, description, threatScore, opportunityScore, riskScore, effortScore, expectedGain, simulationSummary, recommendedPriority, status, reviewedBy
- **Root-owner governance:**
  - `approveProposal()`, `rejectProposal()`, `deferProposal()` — status transitions
  - `rolloutVersion()` — batch-implement approved proposals as a new version record
  - Version lineage tracking with rollback capability
- **Full cycle:**
  - `runCycle()` — Monitor → Simulate → Propose → Update risk → Feed ML → Alert
  - Automatic ML adaptation: creates `dis_threat_landscape` dataset, trains predictive analytics
  - Risk alerts when global level reaches 'elevated' or 'critical'
- **Predictive threat anticipation:**
  - `anticipateThreats()` — extrapolates top-5 threats with compound escalation (1.3× risk)
  - Uses GodModeStrategy AIPredictive mode + ML time-series analysis
- **Query methods:**
  - `generateReport()` — full DefensiveIntelReport for root-owner console
  - `getPendingProposals()`, `getApprovedProposals()`, `getAllProposals()`
  - `getVersionHistory()`, `getGlobalRiskLevel()`, `getCurrentVersion()`
  - `generateNotes()` — strategic advisory notes (critical proposals, risk posture, arsenal utilization)
- Event system: scan, simulation, proposal, approval, rejection, rollout, alert events
- `getSummary()` for TSU dashboard (sanitized — no secrets)

### 12b. QubitCoin Full Economic Engine ✅
**Engine:** `QubitCoinEngine` class within `defensiveIntelligenceSubstructure.ts`
- **Platform-native crypto-economic asset** — usage = investment in platform's future
- **DORMANT by default** — activated ONLY by root-owner password gate
- **Tokenomics:**
  - Fixed supply cap: 21 billion QC (21,000,000,000)
  - Genesis allocation: 1% (210M QC) to treasury as bootstrap
  - Transaction fee: 0.1% of amount → treasury
  - Issuance split: 75% treasury / 25% users
  - 100 actions per "block" (batch reward trigger)
- **10-Year halving schedule (5 epochs, 2 years each):**
  - Epoch 0 (Year 1-2): 1.0× base reward — 10,000 QC/block
  - Epoch 1 (Year 3-4): 0.5× — 5,000 QC/block
  - Epoch 2 (Year 5-6): 0.25× — 2,500 QC/block
  - Epoch 3 (Year 7-8): 0.125× — 1,250 QC/block
  - Epoch 4 (Year 9-10): 0.0625× — 625 QC/block
  - After year 10: no more issuance — fully scarce
- **Activation gate:**
  - `activate(rootOwnerKey)` — seeds genesis allocation, initializes treasury wallet
  - `freeze(rootOwnerKey)` / `unfreeze(rootOwnerKey)` — emergency kill-switch
  - Key hashing for verification (same key required to freeze/unfreeze)
- **Wallet management:**
  - `QCWallet` — balance, earned, spent, transferred, received, vintageEpoch (rarity signal)
  - `createWallet()`, `getWallet()`, `getWalletByOwner()`, `getAllWallets()`, `getTreasuryWallet()`
- **Issuance & mining:**
  - `recordAction()` — core "usage = investment" mechanism; every qualifying action earns QC
  - Automatic epoch advancement based on elapsed time since activation
  - Block completion tracking (actions per block counter)
  - Supply cap enforcement — automatically caps at max supply
- **Transfers & trades:**
  - `transfer()` — wallet-to-wallet with fee deduction; tradeable like any crypto asset
  - `trade()` — marketplace transaction variant with price-per-unit tracking
  - All fees route to treasury
- **Burn & buyback:**
  - `burn()` — permanent supply reduction, increases scarcity
  - `treasuryBuyback()` — treasury purchases QC from market to support price floor
- **Treasury management:**
  - `treasuryInvest()` — root-owner allocates treasury to compute, research, partnerships, marketing, security, reserves
  - `getInvestments()`, `getTreasurySnapshot()`
  - Reserve ratio tracking (treasury / circulating supply)
- **Rewards:**
  - `awardMilestone()` — bonus QC for hitting platform milestones
  - `awardReferral()` — bonus QC for user referrals
- **Spending:**
  - `spendOnCompute()` — QC → premium compute; funds route to treasury
  - `spendOnToolUnlock()` — QC → premium tool access; funds route to treasury
- **Supply analytics:**
  - `getSupplyMetrics()` — cap, issued, burned, circulating, treasury held, scarcity index, halving progress, next halving countdown
  - `getHalvingSchedule()` — full 5-epoch schedule
  - `getTransactions()` — filterable ledger (by wallet, kind, limit)
- **13 transaction kinds:** issuance, usage-reward, referral-reward, milestone-reward, treasury-deposit, transfer, trade, buyback, burn, staking-reward, compute-spend, tool-unlock, fee, genesis
- Event system: activation, issuance, transfer, trade, burn, buyback, treasury-invest, halving, freeze, milestone events
- `getSummary()` — QC status, supply, treasury, wallet/tx counts, epoch, block reward, scarcity index, revenue/rewards

### 12c. TSU Wiring ✅
- Imported and wired as subsystem #63 with 6 dependencies:
  `DefensiveIntelligenceSubstructure(predictiveAnalytics, machineLearning, searchIntelligence, godModeStrategy, continuum, arsenal)`
- Cross-wiring:
  - DIS events → Civilization intelligence (alerts as 'safety'/critical, proposals as 'governance'/advisory, rollouts as 'infrastructure'/advisory)
  - QubitCoin events → Civilization intelligence (activation as 'economy'/advisory, halving as 'economy'/warning, burn as 'economy'/advisory)
- Status entry in `getSubsystemStatuses()` with sanitized summary

**Exit criteria:** Dashboard shows "63 subsystems — all healthy". DIS monitors AI ecosystem, proposes upgrades, and supports root-owner governance. QubitCoin engine dormant by default, activatable with password gate, full 10-year halving tokenomics, wallet/transfer/trade/burn/treasury system. 0 compile errors. 7 TS suites (32 tests) + 15 Python tests pass.

---

## Phase 13 — War Room Console & Internal Doctrine ✅

> **Goal:** Give the root-owner a sealed cockpit layered on top of the standard UI —
> a familiar interface that quietly adds deep governance, intelligence, economic, and
> master-control surfaces. Accompanied by a one-page internal doctrine that anchors
> every licensing, sale, or exclusivity negotiation.

### 13a. War Room Console ✅

New component: `src/components/WarRoom.tsx` + `WarRoom.module.css`

**5-tab full-screen console gated to root-owner:**

| Tab | Surface | Key Features |
|-----|---------|--------------|
| **§1 System Overview** | Mirrors public health but adds deeper ops metrics | Global integrity banner (risk level), all 63 subsystem chips with health/summary tooltips, version lineage timeline, quick metrics (cycle tick, signals, threats, opportunities, pending proposals, DIS events) |
| **§2 Defensive Intel** | Private DIS view | Threat map with likelihood/impact/risk, opportunity map with value/cost/safety scoring, predicted capability jumps via `anticipateThreats()`, simulation results with net-scores, full proposal list with inline Approve/Reject/Defer controls, strategic notes, governance action log |
| **§3 Upgrade Governance** | Version freeze/rollback/packaging | Pending → approved pipeline metrics, version release form (tag + changelog), rollback point list with availability badges, approved-proposals-awaiting-rollout queue |
| **§4 Economic Engine** | QubitCoin treasury & issuance governance | Status banner (dormant/active/frozen), activation gate with password input, treasury metrics (balance, deposited, invested, buyback, reserve ratio, burned), issuance curve (issued, circulating, burned, scarcity, block reward, next halving), 10-year halving schedule table with current-epoch highlight, reward distribution (wallets, transactions, platform revenue, user rewards, blocks mined), treasury investments list |
| **§5 Master Control** | Ultimate authority controls | 8 control buttons (subsystem freeze, subsystem isolation, full system freeze, safe shutdown, hard shutdown, recovery mode, ownership transfer, compliance export), dangerous actions require confirmation dialog, full control action log |

**Design language:** Dark chrome (#0a0a0f), amber/gold accent (#d4af37), red danger zones, JetBrains Mono. z-index 9000 fullscreen overlay. Risk-level themed banners (calm=green, watch=yellow, elevated=orange, critical=red).

**Wired into App.tsx:**
- TSU singleton instantiated in `InnerApp` via `useState(() => new TotalSystemUnification())`
- "War Room" button in header (gold-themed)
- Conditional render of `<WarRoom tsu={tsu} onClose={...} />`

### 13b. Internal Doctrine ✅

New document: `INTERNAL_DOCTRINE.md`

**8 sections defining the principled boundaries:**

| Section | Content |
|---------|---------|
| §1 Purpose | Why this document exists — anchor for licensing, sale, negotiation |
| §2 DIS Permitted | Monitor, classify, simulate, propose, queue, feed ML, anticipate, report, emit events |
| §3 DIS Prohibited | Never self-approve, expose to tenants, communicate externally, modify running subsystems, override safety, access user data, operate when frozen |
| §4 QC Permitted | Issue on usage, deposit to treasury, transfers, trades, burns, buybacks, milestones, referrals, spend, metrics, events |
| §5 QC Prohibited | Never activate without key, self-activate, mint beyond cap, skip halving, transfer from frozen, bypass fees, expose treasury controls, operate when frozen |
| §6 Activation Conditions | 6 mandatory conditions: root-owner decision, platform stability, sufficient users, legal clearance, key ceremony, no critical threats |
| §7 Licensing/Transfer | Version packaging, compliance export, ownership transfer protocol, doctrine transfer |
| §8 Amendment | Root-owner only, must accompany code commits |

**Exit criteria:** War Room console renders from header button with all 5 tabs functional. DIS proposals interactive (approve/reject/defer). QubitCoin activation gate works. Master controls with confirmation dialogs. Internal doctrine anchors all governance boundaries. 0 compile errors. 7 TS suites (32 tests) + 15 Python tests pass.

---

## Iteration Cadence

| Phase | Scope | Estimated Sessions |
|-------|-------|-------------------|
| **0** | Smoke test | 1 session (verify now) |
| **1** | Kernel → Dashboard | 2–3 sessions |
| **2** | Tool execution | 2–3 sessions |
| **3** | Persistence & learning | 2–3 sessions |
| **4** | Docker & infra | 1–2 sessions |
| **5** | Cross-subsystem | 3–5 sessions |
| **6** | Advanced layers | Ongoing |

**Recommended first move:** Phase 0 smoke test →  Phase 1a/1b (kernel singleton + wire missing layers) → Phase 1c (kernel health card).

This gives you a live dashboard powered by the full 51-subsystem kernel within one session.

---

## File Inventory

### Files to Create
| File | Phase | Purpose |
|------|-------|---------|
| `src/core/index.ts` | 1a | Kernel singleton export |
| `src/core/epistemicIntegrity.ts` | 7a | Epistemic Integrity Layer ✅ |
| `src/core/culturalHistoricalContext.ts` | 7b | Cultural-Historical Contextualization ✅ |
| `src/core/symbolicInterpretation.ts` | 7c | Symbolic Interpretation Layer ✅ |
| `src/core/unifiedTriggerPipeline.ts` | 7d | Unified Trigger Pipeline ✅ |
| `src/core/integritySafetyKernel.ts` | 8a | Integrity & Safety Kernel ✅ |
| `src/core/polyglotIntelligenceStack.ts` | 9a | Polyglot Intelligence Stack ✅ |
| `src/core/godModeStrategy.ts` | 10a | GodMode Strategy ✅ |
| `src/core/predictiveAnalyticsLayer.ts` | 10c | Predictive Analytics Layer ✅ |
| `src/core/machineLearningLayer.ts` | 10d | Machine Learning Layer (neural‑network enabled) ✅ |
| `src/core/arsenalToolkit.ts` | 11b | Arsenal Toolkit (200 tools, 10 categories) ✅ |
| `src/components/KernelHealthCard.tsx` | 1c | Live subsystem health display |
| `src/components/SubsystemDetail.tsx` | 1d | Drill-down modal |
| `server/toolRunner.js` | 2a | Execute the 8 defined tools |
| `docker/Dockerfile.frontend` | 4a | React build + nginx |
| `docker/Dockerfile.backend` | 4a | Node.js server |
| `docker/Dockerfile.orchestration` | 4a | Python FastAPI |
| `docker/.env.template` | 4e | Environment variable template |

### Files to Modify
| File | Phase | Change |
|------|-------|--------|
| `src/core/totalSystemUnification.ts` | 1b, 7a-d, 8a, 9a, 10a-d, 11a-b | Wire layers (→ 51 → 62 subsystems) |
| `src/store/kernelStore.ts` | 1e | Real kernel subscription |
| `src/App.tsx` | 1c | Replace hardcoded cards |
| `server/tools.js` | 2b | Load tool_registry.yaml |
| `server/index.js` | 2d | Tool execution in /orchestrate |
| `orchestration/agents/executor_agent.py` | 2c | CrewAI tool invocation |
| `orchestration/app.py` | 3a | SQLite job store |
| `orchestration/orchestrator.py` | 3b | Real Critic scores → ZPE |
| `orchestration/job_runner.py` | 3b, 3c | Close learning loop, real costs |
| `orchestration/agents/llm_client.py` | 3d | Token counting |
| `server/router_agent.js` | 3d, 4c | Real costs, Redis cache |
| `server/db.js` | 4b | Postgres driver option |

---

*Architecture complete. Implementation begins.*
