"""
AgentArmy Orchestration Service
Multi-agent coordination using CrewAI
Exposes REST API for Node.js backend to trigger orchestration jobs
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

# OpenTelemetry tracing
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

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

from crews.core_brain_crew import AgentArmyCoreCrew
from adapters.llm_config import get_llm_config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AgentArmy Orchestration Service",
    description="Multi-agent coordination and task orchestration",
    version="0.1.0"
)

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
    """Input for orchestration job"""
    task: str
    priority: str = "normal"  # normal, high, critical
    context: Optional[Dict[str, Any]] = None
    model_preferences: Optional[Dict[str, str]] = None  # e.g., {planner: anthropic, router: groq}

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
    task_input: TaskInput,
    authorization: Optional[str] = Header(None)
):
    """
    Trigger orchestration job
    Accepts task and returns job ID (polling-based)
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    
    # TODO: Validate JWT token from Node.js backend
    
    job_id = create_job_id()
    created_at = datetime.now().isoformat()
    
    # Create result entry
    jobs[job_id] = JobResult(
        job_id=job_id,
        status="pending",
        task=task_input.task,
        created_at=created_at
    )
    
    # TODO: Async execution via Celery/RabbitMQ
    # For now, synchronous (simple)
    try:
        logger.info(f"[Orchestration] Starting job {job_id}: {task_input.task}")

        # build legacy-compatible payload for the new orchestrator
        payload: Dict[str, Any] = {
            "job": {
                "goal": task_input.task,
                "constraints": {},
                "deadline_hours": None,
                "budget": None,
                "risk_tolerance": 0.5,
            },
            # allow callers to pass more detailed state via context
            "state": (task_input.context or {}).get("state", {"tasks": [], "history": []}),
            "previous_zpe": (task_input.context or {}).get("previous_zpe", 0.5),
        }

        # call the orchestration logic (new structure) rather than the CrewAI crew directly
        from orchestrator import orchestrate as run_orchestrator
        decision = run_orchestrator(payload)

        # update job result with the orchestration decision
        jobs[job_id].status = "completed"
        jobs[job_id].result = {
            "decision": decision,
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
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    return jobs[job_id]

@app.get("/jobs", response_model=List[JobResult])
async def list_jobs(
    status: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """List all jobs (with optional status filter)"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    
    if status:
        return [j for j in jobs.values() if j.status == status]
    return list(jobs.values())

# ============================================
# Startup
# ============================================

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 AgentArmy Orchestration Service starting...")
    logger.info(f"   Backend: CrewAI v0.27+")
    logger.info(f"   Job storage: In-memory (TODO: Redis/Postgres)")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ORCHESTRATION_PORT", 5000))
    uvicorn.run(app, host="0.0.0.0", port=port)
