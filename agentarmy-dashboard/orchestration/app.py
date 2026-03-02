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
