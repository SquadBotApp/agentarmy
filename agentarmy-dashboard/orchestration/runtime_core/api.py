# 3CX and Claude endpoints
@app.post("/adapter/3cx/execute")
def execute_3cx(task: dict):
    agent = orchestrator.registry.get("3cx")
    if not agent:
        raise HTTPException(status_code=404, detail="3CX adapter not found")
    return agent.execute(task)

@app.post("/adapter/claude/execute")
def execute_claude(task: dict):
    agent = orchestrator.registry.get("claude")
    if not agent:
        raise HTTPException(status_code=404, detail="Claude adapter not found")
    return agent.execute(task)
from .security import SecurityManager
# AI Suggestion endpoints
@app.post("/ai_suggestion/tools")
def suggest_tools(description: str):
    return orchestrator.ai_suggestion.suggest_tools(description)

@app.post("/ai_suggestion/workflow")
def suggest_workflow(description: str):
    steps = orchestrator.ai_suggestion.suggest_workflow(description)
    return [{'name': s.name, 'agent_name': s.agent_name, 'action': s.action} for s in steps]

# Self-Healing endpoints
@app.get("/self_healing/diagnose")
def diagnose():
    return orchestrator.self_healing.diagnose()

@app.post("/self_healing/auto_fix")
def auto_fix():
    return orchestrator.self_healing.auto_fix()
# Tool Marketplace endpoints
@app.get("/tool_marketplace/discover")
def discover_tools():
    return orchestrator.tool_marketplace.discover_tools()

@app.post("/tool_marketplace/install")
def install_tool(tool: dict):
    return orchestrator.tool_marketplace.install_tool(tool)

@app.get("/tool_marketplace/installed")
def list_installed_tools():
    return orchestrator.tool_marketplace.list_installed_tools()
"""
AgentArmy Runtime API Layer
--------------------------
Exposes the runtime state and control to the dashboard via FastAPI.
"""

from fastapi import FastAPI, HTTPException

from .runtime_orchestrator import RuntimeOrchestrator
from .agent_registry import AgentRegistry
from .event_bus import Event
from .ws import router as ws_router
from .internal_cloud import InternalCloud


app = FastAPI()
app.include_router(ws_router)


# Singleton orchestrator and internal cloud for API access
# Singleton orchestrator and internal cloud for API access
orchestrator = RuntimeOrchestrator()
internal_cloud = InternalCloud(orchestrator.registry)
security_manager = SecurityManager()

# Internal Cloud endpoints
# Internal Cloud endpoints
@app.post("/internal_cloud/start")
def start_internal_cloud():
    return internal_cloud.start()
# Security endpoints
@app.post("/security/encrypt")
def encrypt_data(data: str):
    token = security_manager.encrypt(data.encode("utf-8"))
    return {"token": token.decode("utf-8")}

@app.post("/security/decrypt")
def decrypt_data(token: str):
    data = security_manager.decrypt(token.encode("utf-8"))
    return {"data": data.decode("utf-8")}

@app.post("/security/network_isolation/enable")
def enable_network_isolation():
    return security_manager.enable_network_isolation()

@app.post("/security/network_isolation/disable")
def disable_network_isolation():
    return security_manager.disable_network_isolation()

@app.post("/internal_cloud/stop")
def stop_internal_cloud():
    return internal_cloud.stop()

@app.get("/internal_cloud/status")
def internal_cloud_status():
    return {"active": internal_cloud.is_active()}

@app.post("/internal_cloud/fallback")
def internal_cloud_fallback():
    return internal_cloud.fallback_if_offline()

@app.on_event("startup")
def startup_event():
    # Optionally start orchestrator in background
    pass

@app.get("/agents")
def list_agents():
    return [agent.__class__.__name__ for agent in orchestrator.registry.all()]

@app.get("/subsystems")
def list_subsystems():
    return {
        "swarm": orchestrator.swarm.__class__.__name__,
        "defensive": orchestrator.defensive.__class__.__name__,
        "governance": orchestrator.governance.__class__.__name__,
        "economic": orchestrator.economic.__class__.__name__,
    }

@app.post("/event")
def broadcast_event(event_type: str, payload: dict = None):
    orchestrator.event_bus.publish(Event(event_type, payload))
    return {"status": "event broadcasted"}


@app.post("/kill_agent")
def kill_agent(name: str):
    agent = orchestrator.registry.get(name)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if hasattr(agent, "shutdown"):
        agent.shutdown()
    orchestrator.registry.unregister(name)
    return {"status": f"Agent {name} killed"}

@app.post("/override_agent")
def override_agent(name: str, action: str, params: dict = None):
    agent = orchestrator.registry.get(name)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    # For demo: call a generic method if it exists
    if hasattr(agent, action):
        getattr(agent, action)(**(params or {}))
        return {"status": f"Action {action} executed on {name}"}
    raise HTTPException(status_code=400, detail="Action not supported")

@app.post("/adjust_policy")
def adjust_policy(subsystem: str, policy: dict):
    sub = getattr(orchestrator, subsystem, None)
    if not sub:
        raise HTTPException(status_code=404, detail="Subsystem not found")
    # For demo: set a policy attribute if it exists
    for k, v in policy.items():
        if hasattr(sub, k):
            setattr(sub, k, v)
    return {"status": f"Policy updated for {subsystem}"}

@app.post("/shutdown")
def shutdown():
    orchestrator.stop()
    return {"status": "runtime stopped"}


# Workflow endpoints
from fastapi import Body
from typing import List

@app.post("/workflow/create")
def create_workflow(name: str, steps: List[dict] = Body(...)):
    wf_steps = [
        orchestrator.workflow_engine.__class__.__bases__[0].__init__.__globals__["WorkflowStep"](
            s["name"], s["agent_name"], s["action"], s.get("params", {})
        ) for s in steps
    ]
    orchestrator.workflow_engine.create_workflow(name, wf_steps)
    return {"status": f"Workflow '{name}' created"}

@app.post("/workflow/run")
def run_workflow(name: str):
    results = orchestrator.workflow_engine.run_workflow(name)
    return {"status": f"Workflow '{name}' executed", "results": results}

@app.get("/workflow/status")
def workflow_status(name: str):
    status = orchestrator.workflow_engine.get_workflow_status(name)
    return {"workflow": name, "status": status}

@app.get("/workflow/results")
def workflow_results(name: str):
    results = orchestrator.workflow_engine.get_workflow_results(name)
    return {"workflow": name, "results": results}
