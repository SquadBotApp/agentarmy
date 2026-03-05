from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import asyncio
import threading

app = FastAPI(title="AgentArmyOS API")

# Global state
orchestrator = None
is_running = False

def get_orchestrator():
    global orchestrator
    if orchestrator is None:
        from core.orchestrator import Orchestrator
        orchestrator = Orchestrator()
    return orchestrator

def run_orchestrator_loop():
    """Background thread running the orchestrator loop"""
    global is_running
    orch = get_orchestrator()
    
    while is_running:
        try:
            # Run one cycle
            orch.run("background_cycle")
            import time
            time.sleep(5)  # Wait 5 seconds between cycles
        except Exception as e:
            print(f"Orchestrator error: {e}")
            break

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
    loop_running: bool

# --- Endpoints ---
@app.get("/status")
def status():
    return {"status": "ok"}

@app.get("/health", response_model=HealthResponse)
def health():
    global is_running
    return HealthResponse(
        status="healthy" if is_running else "starting",
        orchestrator="active",
        providers=["openai", "claude"],
        loop_running=is_running
    )

@app.get("/metrics")
def metrics():
    """Return system metrics"""
    return {
        "active_agents": 0,
        "total_jobs": 0,
        "total_cost_usd": 0.0,
        "universe_count": 0,
        "orchestrator_loop": is_running
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

@app.get("/api/job/{job_id}")
def get_job(job_id: str):
    """Get job status"""
    return {"job_id": job_id, "status": "completed"}

@app.post("/api/start")
def start_orchestrator():
    """Start the orchestrator background loop"""
    global is_running, orchestrator_thread
    
    if is_running:
        return {"status": "already_running"}
    
    is_running = True
    orchestrator_thread = threading.Thread(target=run_orchestrator_loop, daemon=True)
    orchestrator_thread.start()
    
    return {"status": "started"}

orchestrator_thread = None

@app.post("/api/stop")
def stop_orchestrator():
    """Stop the orchestrator background loop"""
    global is_running
    
    is_running = False
    return {"status": "stopped"}

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

@app.get("/api/providers")
def list_providers():
    """List provider stats"""
    return {"providers": [
        {"name": "openai", "latency_ms": 0, "cost_usd": 0.0},
        {"name": "claude", "latency_ms": 0, "cost_usd": 0.0}
    ]}

# --- Startup ---
@app.on_event("startup")
async def startup_event():
    """Auto-start orchestrator on API startup"""
    global is_running, orchestrator_thread
    
    is_running = True
    orchestrator_thread = threading.Thread(target=run_orchestrator_loop, daemon=True)
    orchestrator_thread.start()

@app.on_event("shutdown")
async def shutdown_event():
    """Stop orchestrator on API shutdown"""
    global is_running
    is_running = False

def start_api():
    """Start the API server on port 5000"""
    uvicorn.run("api.main:app", host="0.0.0.0", port=5000, reload=False)

if __name__ == "__main__":
    start_api()

