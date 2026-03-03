"""
AgentArmy Orchestration Service
Multi-agent coordination using CrewAI
Exposes REST API for Node.js backend to trigger orchestration jobs
"""

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware

# OpenTelemetry tracing
from opentelemetry import trace  # type: ignore[import]
from opentelemetry.sdk.resources import Resource  # type: ignore[import]
from opentelemetry.sdk.trace import TracerProvider  # type: ignore[import]
from opentelemetry.sdk.trace.export import BatchSpanProcessor  # type: ignore[import]
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter  # type: ignore[import]
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor  # type: ignore[import]

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import logging
from datetime import datetime
import json

# initialize tracing
if os.getenv('ENABLE_TRACING', 'false').lower() == 'true':
    resource = Resource.create({"service.name": "agentarmy-orchestration"})
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=os.getenv('OTLP_ENDPOINT', 'http://localhost:4318/v1/traces'))
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    print(f"[Tracing] initialized, exporting to {exporter._endpoint}")
else:
    print("[Tracing] disabled (set ENABLE_TRACING=true)")

from orchestrator import orchestrate as run_orchestrator
from executor import RegistryAgentExecutor
from job_runner import JobRunner
from agents import PlannerAgent, ExecutorAgent, CriticAgent, GovernorAgent
from frameworks import SUPPORTED_FRAMEWORKS
from integrations import (
    SUPPORTED_PLATFORMS,
    MOBILE_VENDOR_TARGETS,
    SOCIAL_PROFILE_TEMPLATES,
    SSH_PROFILE_TEMPLATES,
    COMMS_ALIAS_TARGETS,
    build_efficiency_plan,
    build_social_intel,
    build_ssh_plan,
    broadcast_comms,
)
from lifecycle_manager import LifecycleManager, SafetyPosture, AgentVersion, RiskLevel
from deployment_orchestrator import DeploymentOrchestrator
from competition_arena import CompetitionArena
from evolution_strategist import EvolutionStrategist
cd "C:\Users\gregr\OneDrive\Documents\AgentArmy\agentarmy-dashboard"
..\.venv\Scripts\python.exe -m uvicorn orchestration.runtime_core.api:app --host 0.0.0.0 --port 8000 --log-level info

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AgentArmy Orchestration Service",
    description="Multi-agent coordination and task orchestration",
    version="0.1.0"
)

AUTH_SCHEME = "Bearer "
AUTH_ERROR = "Missing authorization token"

# attach tracing instrumentation to FastAPI if enabled
if os.getenv('ENABLE_TRACING', 'false').lower() == 'true':
    FastAPIInstrumentor().instrument_app(app)

# CORS for Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Models
# ============================================

class TaskInput(BaseModel):
    """Input for orchestration job (legacy format)"""
    task: str
    priority: str = "normal"  # normal, high, critical
    context: Optional[Dict[str, Any]] = None
    model_preferences: Optional[Dict[str, str]] = None  # e.g., {planner: anthropic, router: groq}

class AdvancedTaskModel(BaseModel):
    """Task definition in advanced format"""
    id: str
    name: str
    description: str
    duration: float
    depends_on: List[str] = []

class AdvancedJobModel(BaseModel):
    """Job definition in advanced format"""
    goal: str
    constraints: Optional[Dict[str, Any]] = None
    deadline_hours: Optional[float] = None
    risk_tolerance: float = 0.5

class AdvancedStateModel(BaseModel):
    """State definition in advanced format"""
    tasks: List[AdvancedTaskModel] = []
    history: List[Dict[str, Any]] = []

class AdvancedInput(BaseModel):
    """Input for orchestration job (advanced format)"""
    job: AdvancedJobModel
    state: AdvancedStateModel
    previous_zpe: float = 0.5

class EducationSessionInput(BaseModel):
    """Input for starting an education session"""
    learner_id: str
    topic: str

class JobResult(BaseModel):
    """Result of orchestration job"""
    job_id: str
    status: str  # pending, running, completed, failed
    task: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    enabled_providers: List[str]

# ============================================
# In-Memory Job Store (TODO: move to Redis/DB)
# ============================================

jobs: Dict[str, JobResult] = {}
job_counter = 0

agent_registry = {
    "planner": PlannerAgent(),
    "executor": ExecutorAgent(),
    "critic": CriticAgent(),
    "governor": GovernorAgent(),
}
job_runner = JobRunner(
    orchestrate_fn=run_orchestrator,
    executor=RegistryAgentExecutor(agent_registry),
)

def create_job_id() -> str:
    global job_counter
    job_counter += 1
    return f"job-{datetime.now().strftime('%Y%m%d%H%M%S')}-{job_counter}"

# ============================================
# Auth & Status Check
# ============================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    enabled = []
    if os.getenv("OPENAI_API_KEY"):
        enabled.append("openai")
    if os.getenv("ANTHROPIC_API_KEY"):
        enabled.append("anthropic")
    if os.getenv("GROQ_API_KEY"):
        enabled.append("groq")
    if os.getenv("XAI_API_KEY"):
        enabled.append("xai")
    if os.getenv("GEMINI_API_KEY"):
        enabled.append("gemini")
    
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        enabled_providers=enabled or ["mock"]
    )


@app.get("/capabilities")
async def capabilities(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    return {
        "frameworks": sorted(SUPPORTED_FRAMEWORKS),
        "platforms": SUPPORTED_PLATFORMS,
        "mobile_vendors": MOBILE_VENDOR_TARGETS,
        "social_profiles": sorted(SOCIAL_PROFILE_TEMPLATES.keys()),
        "ssh_profiles": sorted(SSH_PROFILE_TEMPLATES.keys()),
        "comms_aliases": COMMS_ALIAS_TARGETS,
    }


@app.post("/efficiency/plan")
async def efficiency_plan(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    return build_efficiency_plan(body if isinstance(body, dict) else {})


@app.post("/social/intel/analyze")
async def social_intel_analysis(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    return build_social_intel(body if isinstance(body, dict) else {})


@app.post("/ssh/plan")
async def ssh_plan(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    return build_ssh_plan(body if isinstance(body, dict) else {})


@app.post("/comms/broadcast")
async def comms_broadcast(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    payload = body if isinstance(body, dict) else {}
    result = broadcast_comms(payload)
    if result.get("status") == "failed":
        raise HTTPException(status_code=400, detail=result.get("error", "comms broadcast failed"))
    return result

# ============================================
# Orchestration API
# ============================================

@app.post("/orchestrate", response_model=JobResult)
async def orchestrate_task(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Trigger orchestration job
    Accepts both legacy format (task, priority, context) 
    and advanced format (job, state, previous_zpe)
    """
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    
    body = await request.json()
    
    job_id = create_job_id()
    created_at = datetime.now().isoformat()
    
    # Detect payload format and normalize
    if "job" in body and "state" in body:
        # Advanced format: {job, state, previous_zpe}
        task_name = body["job"].get("goal", "Advanced orchestration task")
        payload: Dict[str, Any] = {
            "job": body["job"],
            "state": body["state"],
            "previous_zpe": body.get("previous_zpe", 0.5),
            "integrations": body.get("integrations", {}),
            "framework": body.get("framework", "native"),
        }
    elif "task" in body:
        # Legacy format: {task, priority, context}
        task_name = body["task"]
        context = body.get("context") or {}
        payload = {
            "job": {
                "goal": task_name,
                "constraints": {},
                "deadline_hours": None,
                "budget": None,
                "risk_tolerance": 0.5,
            },
            "state": context.get("state", {"tasks": [], "history": []}),
            "previous_zpe": context.get("previous_zpe", 0.5),
            "integrations": body.get("integrations", context.get("integrations", {})),
            "framework": body.get("framework", context.get("framework", "native")),
        }
    else:
        raise HTTPException(status_code=422, detail="Invalid payload: expected 'task' or 'job'+'state'")
    
    # Create result entry
    jobs[job_id] = JobResult(
        job_id=job_id,
        status="pending",
        task=task_name,
        created_at=created_at
    )
    
    # Executed inline for now; can be externalized to a queue worker later.
    try:
        logger.info(f"[Orchestration] Starting job {job_id}: {task_name}")

        workflow_result = await job_runner.run_workflow(payload)
        decision = workflow_result.get("decision", {})

        # update job result with the orchestration decision
        jobs[job_id].status = "completed"
        jobs[job_id].result = {
            "decision": decision,
            "execution": workflow_result.get("execution"),
            "evaluation": workflow_result.get("evaluation"),
            "integrations": workflow_result.get("integrations"),
            "metrics": workflow_result.get("metrics"),
        }
        jobs[job_id].completed_at = datetime.now().isoformat()

        logger.info(f"[Orchestration] Job {job_id} completed successfully")

    except Exception as e:
        logger.error(f"[Orchestration] Job {job_id} failed: {str(e)}")
        jobs[job_id].status = "failed"
        jobs[job_id].error = str(e)
        jobs[job_id].completed_at = datetime.now().isoformat()
    
    return jobs[job_id]

@app.get("/jobs/{job_id}", response_model=JobResult)
async def get_job_status(
    job_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get status of a job"""
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    return jobs[job_id]

@app.get("/jobs", response_model=List[JobResult])
async def list_jobs(
    status: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """List all jobs (with optional status filter)"""
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    
    if status:
        return [j for j in jobs.values() if j.status == status]
    return list(jobs.values())

# ============================================
# Lifecycle & Deployment singletons
# ============================================

lifecycle_mgr = LifecycleManager()
deployment_orch = DeploymentOrchestrator(lifecycle_mgr)

competition_arena = CompetitionArena()

# The EducationCenter is needed by the strategist. It's initialized inside LifecycleManager.
education_center = lifecycle_mgr.domains.get("education")

# Connect performance to lifecycle
if education_center:
    try:
        evolution_strategist = EvolutionStrategist(
            competition_arena=competition_arena,
            lifecycle_manager=lifecycle_mgr,
            education_center=education_center,
        )
        evolution_strategist.register_hooks()
    except ImportError:
        logger.error("[App] evolution_strategist.py not found. Performance-based evolution is disabled.")
    except Exception as e:
        logger.error(f"[App] Failed to initialize EvolutionStrategist: {e}")
else:
    logger.warning("[App] EducationCenter not found, EvolutionStrategist disabled.")

# Seed a few default agents so the UI has something to display
for _role in ("planner", "executor", "critic", "governor"):
    lifecycle_mgr.create_agent(
        name=f"Default {_role.capitalize()}",
        role=_role,
        tools=["llm", "search"] if _role in ("planner", "critic") else ["llm", "codegen"],
        actor="system",
    )

# ============================================
# Lifecycle API
# ============================================

@app.get("/lifecycle")
async def lifecycle_state(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    return lifecycle_mgr.to_dict()


@app.post("/lifecycle/create")
async def lifecycle_create(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    posture = SafetyPosture(body.get("safety_posture", "standard"))
    agent, event = lifecycle_mgr.create_agent(
        name=body["name"],
        role=body["role"],
        tools=body.get("tools"),
        safety_posture=posture,
        actor="user",
    )
    return {"agent_id": agent.agent_id, "event_id": event.event_id}


@app.post("/lifecycle/deploy")
async def lifecycle_deploy(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    try:
        agent, event = lifecycle_mgr.deploy_agent(body["agent_id"], actor="user")
        return {"stage": agent.stage.value, "event_id": event.event_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/lifecycle/freeze")
async def lifecycle_freeze(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    event = lifecycle_mgr.freeze_agent(body["agent_id"], actor="user")
    return {"event_id": event.event_id}


@app.post("/lifecycle/unfreeze")
async def lifecycle_unfreeze(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    event = lifecycle_mgr.unfreeze_agent(body["agent_id"], actor="user")
    return {"event_id": event.event_id}


@app.post("/lifecycle/retire")
async def lifecycle_retire(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    try:
        agent, event = lifecycle_mgr.retire_agent(body["agent_id"], actor="user")
        return {"stage": agent.stage.value, "event_id": event.event_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/lifecycle/lock-tools")
async def lifecycle_lock_tools(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    event = lifecycle_mgr.lock_tools(body["agent_id"], actor="user")
    return {"event_id": event.event_id}


@app.post("/lifecycle/unlock-tools")
async def lifecycle_unlock_tools(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    event = lifecycle_mgr.unlock_tools(body["agent_id"], actor="user")
    return {"event_id": event.event_id}


@app.post("/lifecycle/promote")
async def lifecycle_promote(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    posture = SafetyPosture(body["posture"])
    event = lifecycle_mgr.promote_agent(body["agent_id"], posture, actor="user")
    return {"event_id": event.event_id}


@app.post("/lifecycle/demote")
async def lifecycle_demote(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    posture = SafetyPosture(body["posture"])
    event = lifecycle_mgr.demote_agent(body["agent_id"], posture, actor="user")
    return {"event_id": event.event_id}


@app.post("/lifecycle/rollback")
async def lifecycle_rollback(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    try:
        agent, event = lifecycle_mgr.rollback_agent(
            body["agent_id"],
            target_version=body.get("target_version"),
            actor="user",
        )
        return {"version": agent.current_version.version_number if agent.current_version else 0, "event_id": event.event_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/lifecycle/fork")
async def lifecycle_fork(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    forked, event = lifecycle_mgr.fork_agent(body["agent_id"], body["new_name"], actor="user")
    return {"agent_id": forked.agent_id, "event_id": event.event_id}


@app.post("/lifecycle/merge")
async def lifecycle_merge(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    try:
        target, event = lifecycle_mgr.merge_agents(body["source_id"], body["target_id"], actor="user")
        return {"target_id": target.agent_id, "event_id": event.event_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/lifecycle/champion")
async def lifecycle_promote_to_champion(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    try:
        # Promotion to champion is a privileged action, so actor must be e.g. "user:root"
        event = lifecycle_mgr.promote_to_champion(body["agent_id"], actor="user:root")
        return {"event_id": event.event_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Agent '{body.get('agent_id')}' not found.")


@app.post("/lifecycle/demote-champion")
async def lifecycle_demote_from_champion(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    try:
        # Demotion from champion is also a privileged action
        event = lifecycle_mgr.demote_from_champion(body["agent_id"], actor="user:root")
        return {"event_id": event.event_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Agent '{body.get('agent_id')}' not found.")


# ============================================
# Competition Arena API
# ============================================

class CompetitionLaunchInput(BaseModel):
    name: str
    agent_names: List[str]
    task_description: str
    rounds: int = 1

class Competitor:
    """Wrapper to link a ManagedAgent record to an executable agent for competitions."""
    def __init__(self, managed_agent: Any, executable_agent: Any):
        self.managed_agent = managed_agent
        self.executable_agent = executable_agent
        self.name = managed_agent.name  # For the arena leaderboard
        self.role = managed_agent.role  # For finding the executable

    async def act(self, task_description: str):
        # The executable agents have an `execute` method.
        if hasattr(self.executable_agent, "execute"):
            return await self.executable_agent.execute({"description": task_description})
        return {"status": "failed", "error": "Agent has no execute method"}

@app.post("/competitions/launch")
async def launch_competition_endpoint(
    input: CompetitionLaunchInput,
    authorization: Optional[str] = Header(None)
):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)

    competitors = []
    all_managed_agents = lifecycle_mgr.list_agents()

    for name in input.agent_names:
        managed_agent = next((a for a in all_managed_agents if a.name == name), None)
        if not managed_agent:
            raise HTTPException(status_code=404, detail=f"Agent '{name}' not found in lifecycle manager.")

        executable_agent = agent_registry.get(managed_agent.role)
        if not executable_agent:
            raise HTTPException(status_code=404, detail=f"No executable agent found for role '{managed_agent.role}'.")

        competitors.append(Competitor(managed_agent, executable_agent))

    if not competitors:
        raise HTTPException(status_code=400, detail="No valid agents specified for competition.")

    async def competition_task(agent: Competitor):
        return await agent.act(input.task_description)

    results = await competition_arena.launch_competition(
        name=input.name,
        agents=competitors,
        task=competition_task,
        rounds=input.rounds,
    )
    return {"status": "completed", "results": results, "leaderboard": competition_arena.get_leaderboard(input.name)}

@app.get("/competitions/{name}")
async def get_competition_results(name: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    return competition_arena.get_competition(name)

@app.get("/competitions/{name}/leaderboard")
async def get_competition_leaderboard(name: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    return competition_arena.get_leaderboard(name)


# ============================================
# Education Center API
# ============================================

@app.get("/education/progress/{agent_name}")
async def get_education_progress(agent_name: str, authorization: Optional[str] = Header(None)):
    """Get the training progress for a specific agent."""
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)

    if not education_center:
        raise HTTPException(status_code=503, detail="EducationCenter is not available.")

    # The learner_id in EducationCenter corresponds to the agent's name.
    learner_profile = education_center.state["learners"].get(agent_name)
    if not learner_profile:
        raise HTTPException(status_code=404, detail=f"No training progress found for agent '{agent_name}'.")

    # The ProgressAgent is responsible for tracking and reporting progress.
    progress_data = education_center.progress_agent.track(learner_profile)

    return {
        "agent_name": agent_name,
        "profile": learner_profile,
        "progress": progress_data,
    }

@app.post("/education/session/start")
async def start_education_session(
    input: EducationSessionInput,
    authorization: Optional[str] = Header(None)
):
    """Start a specific training session for an agent."""
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)

    if not education_center:
        raise HTTPException(status_code=503, detail="EducationCenter is not available.")

    try:
        # The EducationCenter.start_session method expects a dict
        result = education_center.start_session(input.dict())
        return {"status": "started", "result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================
# Deployment Orchestrator API
# ============================================

@app.get("/deployment")
async def deployment_state(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    return deployment_orch.to_dict()


@app.post("/deployment/deploy")
async def deploy_mission(request: Request, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith(AUTH_SCHEME):
        raise HTTPException(status_code=401, detail=AUTH_ERROR)
    body = await request.json()
    try:
        result = deployment_orch.deploy_mission(
            goal=body["goal"],
            domain=body.get("domain", ""),
            risk_tolerance=body.get("risk_tolerance", 0.5),
            budget_qb=body.get("budget_qb", 100),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Startup
# ============================================

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 AgentArmy Orchestration Service starting...")
    logger.info("   Backend: CrewAI v0.27+")
    logger.info("   Job storage: In-memory (Redis/Postgres planned)")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ORCHESTRATION_PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
