from fastapi import status

# Error message constants
AGENT_NOT_FOUND = "Agent not found"
SUBSYSTEM_NOT_FOUND = "Subsystem not found"
ADAPTER_3CX_NOT_FOUND = "3CX adapter not found"
ADAPTER_CLAUDE_NOT_FOUND = "Claude adapter not found"
ACTION_NOT_SUPPORTED = "Action not supported"

# ...existing code...

# 3CX and Claude endpoints

from fastapi import FastAPI, HTTPException, Body
from .security import SecurityManager
from .runtime_orchestrator import RuntimeOrchestrator
from .agent_registry import AgentRegistry
from .event_bus import Event
from .ws import router as ws_router
from .internal_cloud import InternalCloud

# Singleton orchestrator and internal cloud for API access
orchestrator = RuntimeOrchestrator()
internal_cloud = InternalCloud(orchestrator.registry)
security_manager = SecurityManager()

app = FastAPI()
app.include_router(ws_router)

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

@app.post("/internal_cloud/start")
def start_internal_cloud():
    return internal_cloud.start()

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

@app.post("/kill_agent", responses={404: {"description": AGENT_NOT_FOUND}})
def kill_agent(name: str):
    agent = orchestrator.registry.get(name)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=AGENT_NOT_FOUND)
    if hasattr(agent, "shutdown"):
        agent.shutdown()
    orchestrator.registry.unregister(name)
    return {"status": f"Agent {name} killed"}

@app.post("/override_agent", responses={404: {"description": AGENT_NOT_FOUND}, 400: {"description": ACTION_NOT_SUPPORTED}})
def override_agent(name: str, action: str, params: dict = None):
    agent = orchestrator.registry.get(name)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=AGENT_NOT_FOUND)
    # For demo: call a generic method if it exists
    if hasattr(agent, action):
        getattr(agent, action)(**(params or {}))
        return {"status": f"Action {action} executed on {name}"}
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=ACTION_NOT_SUPPORTED)

@app.post("/adjust_policy", responses={404: {"description": SUBSYSTEM_NOT_FOUND}})
def adjust_policy(subsystem: str, policy: dict):
    sub = getattr(orchestrator, subsystem, None)
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=SUBSYSTEM_NOT_FOUND)
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
from typing import List, Annotated
from ..education_center import build_action_stubs, build_domain_cards

@app.post("/workflow/create")
def create_workflow(name: str, steps: Annotated[List[dict], Body(...)]):
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

@app.get("/education/domain/status")
def education_domain_status():
    domain = getattr(orchestrator, "domains", {}).get("education_center")
    if not domain:
        return {"status": "missing", "domain": "education_center"}
    state = domain.get_state()
    return {
        "status": "ok",
        "domain": "education_center",
        "summary": {
            "learners": len(state.get("learners", [])),
            "sessions": len(state.get("sessions", [])),
            "events": len(state.get("events", [])),
        },
    }

@app.get("/education/domain/dashboard-stubs")
def education_dashboard_stubs():
    domain = getattr(orchestrator, "domains", {}).get("education_center")
    state = domain.get_state() if domain else {"learners": [], "sessions": []}
    return {
        "cards": build_domain_cards(state),
        "actions": build_action_stubs(),
    }

from .security import SecurityManager

# ...existing code...


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

from fastapi import FastAPI, HTTPException, Body

from .runtime_orchestrator import RuntimeOrchestrator
from .agent_registry import AgentRegistry
from .event_bus import Event
from .ws import router as ws_router
from .internal_cloud import InternalCloud



app = FastAPI()
app.include_router(ws_router)

# Singleton orchestrator and internal cloud for API access
orchestrator = RuntimeOrchestrator()
internal_cloud = InternalCloud(orchestrator.registry)
security_manager = SecurityManager()

# 3CX and Claude endpoints
@app.post("/adapter/3cx/execute", responses={404: {"description": ADAPTER_3CX_NOT_FOUND}})
def execute_3cx(task: dict):
    if (agent := orchestrator.registry.get("3cx")) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ADAPTER_3CX_NOT_FOUND)
    return agent.execute(task)

@app.post("/adapter/claude/execute", responses={404: {"description": ADAPTER_CLAUDE_NOT_FOUND}})
def execute_claude(task: dict):
    if (agent := orchestrator.registry.get("claude")) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=ADAPTER_CLAUDE_NOT_FOUND)
    return agent.execute(task)

# AI Suggestion endpoints
@app.post("/ai_suggestion/tools")
def suggest_tools(description: str):
    return orchestrator.ai_suggestion.suggest_tools(description)

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


@app.post("/kill_agent", responses={404: {"description": AGENT_NOT_FOUND}})
def kill_agent(name: str):
    agent = orchestrator.registry.get(name)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=AGENT_NOT_FOUND)
    if hasattr(agent, "shutdown"):
        agent.shutdown()
    orchestrator.registry.unregister(name)
    return {"status": f"Agent {name} killed"}

@app.post("/override_agent", responses={404: {"description": AGENT_NOT_FOUND}, 400: {"description": ACTION_NOT_SUPPORTED}})
def override_agent(name: str, action: str, params: dict = None):
    agent = orchestrator.registry.get(name)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=AGENT_NOT_FOUND)
    # For demo: call a generic method if it exists
    if hasattr(agent, action):
        getattr(agent, action)(**(params or {}))
        return {"status": f"Action {action} executed on {name}"}
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=ACTION_NOT_SUPPORTED)

@app.post("/adjust_policy", responses={404: {"description": SUBSYSTEM_NOT_FOUND}})
def adjust_policy(subsystem: str, policy: dict):
    sub = getattr(orchestrator, subsystem, None)
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=SUBSYSTEM_NOT_FOUND)
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
from ..education_center import build_action_stubs, build_domain_cards

@app.post("/workflow/create")
def create_workflow(name: str, steps: Annotated[List[dict], Body(...)]):
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


@app.get("/education/domain/status")
def education_domain_status():
    domain = getattr(orchestrator, "domains", {}).get("education_center")
    if not domain:
        return {"status": "missing", "domain": "education_center"}
    state = domain.get_state()
    return {
        "status": "ok",
        "domain": "education_center",
        "summary": {
            "learners": len(state.get("learners", [])),
            "sessions": len(state.get("sessions", [])),
            "events": len(state.get("events", [])),
        },
    }


@app.get("/education/domain/dashboard-stubs")
def education_dashboard_stubs():
    domain = getattr(orchestrator, "domains", {}).get("education_center")
    state = domain.get_state() if domain else {"learners": [], "sessions": []}
    return {
        "cards": build_domain_cards(state),
        "actions": build_action_stubs(),
    }
