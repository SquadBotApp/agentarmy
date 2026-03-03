"""
WebSocket endpoint for AgentArmy OS live updates
------------------------------------------------
Provides real-time agent/subsystem state and event streaming to the dashboard.
"""

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from .runtime_orchestrator import RuntimeOrchestrator

router = APIRouter()

orchestrator = RuntimeOrchestrator()  # Singleton for demo; use DI in production


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    event_log = []
    defensive_log = []
    economic_log = []
    try:
        while True:
            # Gather agent and subsystem details
            agents = [
                {
                    "name": getattr(agent, "name", agent.__class__.__name__),
                    "type": agent.__class__.__name__,
                    # Add more agent state fields as needed
                }
                for agent in orchestrator.registry.all()
            ]
            subsystems = {
                "swarm": orchestrator.swarm.__class__.__name__,
                "defensive": orchestrator.defensive.__class__.__name__,
                "governance": orchestrator.governance.__class__.__name__,
                "economic": orchestrator.economic.__class__.__name__,
            }
            # For demo, append a fake event/defensive/economic log entry every cycle
            event_log.append({"event": "heartbeat", "ts": asyncio.get_event_loop().time()})
            defensive_log.append({"action": "noop", "ts": asyncio.get_event_loop().time()})
            economic_log.append({"reward": 0, "penalty": 0, "ts": asyncio.get_event_loop().time()})
            # Limit log size
            event_log = event_log[-20:]
            defensive_log = defensive_log[-20:]
            economic_log = economic_log[-20:]
            await websocket.send_json({
                "type": "state_update",
                "agents": agents,
                "subsystems": subsystems,
                "event_log": event_log,
                "defensive_log": defensive_log,
                "economic_log": economic_log,
            })
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
