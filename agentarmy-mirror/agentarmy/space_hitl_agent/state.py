"""
Space State Management
Defines the state schema for the Commercial Space HITL AI Agent.
"""

from typing import TypedDict, Annotated, Optional, List, Dict, Any
from langgraph.graph.message import add_messages
from datetime import datetime


class SpaceState(TypedDict):
    """
    State schema for the Commercial Space HITL Agent.
    Tracks telemetry data, anomaly detection, human approvals, and execution history.
    """
    # Telemetry data from the space station
    telemetry: Dict[str, Any]
    
    # Anomaly detection results
    anomaly: Optional[str]
    
    # Proposed action from the AI analyzer
    proposed_action: Optional[str]
    
    # Human approval status (None = pending, True = approved, False = rejected)
    human_approval: Optional[bool]
    
    # Human's modification to the proposed action (if any)
    human_modification: Optional[str]
    
    # Conversation/message history
    messages: Annotated[List[Dict[str, Any]], add_messages]
    
    # Execution history for audit trail
    execution_log: List[Dict[str, Any]]
    
    # Confidence score of the AI's analysis (0.0 - 1.0)
    confidence_score: Optional[float]
    
    # Current mission phase
    mission_phase: str
    
    # Timestamp of last update
    last_updated: str
    
    # Error messages (if any)
    errors: List[str]


def create_initial_state() -> SpaceState:
    """Create the initial state for a new space mission."""
    return {
        "telemetry": {},
        "anomaly": None,
        "proposed_action": None,
        "human_approval": None,
        "human_modification": None,
        "messages": [],
        "execution_log": [],
        "confidence_score": None,
        "mission_phase": "initialization",
        "last_updated": datetime.now().isoformat(),
        "errors": []
    }

