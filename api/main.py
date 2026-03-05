from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import asyncio

app = FastAPI(title="AgentArmyOS API")

# Orchestrator instance
orchestrator = None

def get_orchestrator():
    global orchestrator
    if orchestrator is None:
        from core.orchestrator import Orchestrator
        orchestrator = Orchestrator()
    return orchestrator

# --- Models ---
class JobRequest(BaseModel):
    input_data: str
    max_cycles: Optional[int] = 3

class JobResponse(BaseModel):
    job_id: str
    status: str
    result: Optional[Any] = None

class HealthResponse(BaseModel):
    status: str
    orchestrator: str
    providers: List[str]

# --- Endpoints ---
@app.get("/status")
def status():
    return {"status": "ok"}

@app.get("/health", response_model=HealthResponse)
def health():
    orch = get_orchestrator()
    return HealthResponse(
        status="healthy",
        orchestrator="active",
        providers=["openai", "claude"]
    )

@app.get("/metrics")
def metrics():
    """Return system metrics"""
    return {
        "active_agents": 0,
        "total_jobs": 0,
        "total_cost_usd": 0.0,
        "universe_count": 0
    }

@app.post("/api/job", response_model=JobResponse)
async def submit_job(request: JobRequest):
    """Submit a job to the orchestrator"""
    import uuid
    job_id = str(uuid.uuid4())
    
    try:
        orch = get_orchestrator()
        result = orch.run(request.input_data)
        
        return JobResponse(
            job_id=job_id,
            status="completed",
            result=result
        )
    except Exception as e:
        return JobResponse(
            job_id=job_id,
            status="failed",
            result={"error": str(e)}
        )

@app.get("/api/agents")
def list_agents():
    """List all agents"""
    return {"agents": []}

@app.get("/api/tasks")
def list_tasks():
    """List all tasks"""
    return {"tasks": []}

@app.get("/api/universes")
def list_universes():
    """List all universes"""
    return {"universes": []}

# --- Startup ---
def start_api():
    """Start the API server on port 5000"""
    uvicorn.run("api.main:app", host="0.0.0.0", port=5000, reload=False)

if __name__ == "__main__":
    start_api()
