"""
Human Approval Node (HITL Interrupt)
Implements the true Human-in-the-Loop pattern using LangGraph interrupts.

This is the critical HITL component that pauses execution and waits for 
human approval before any action is taken. Uses langgraph.types.interrupt()
for proper pause/resume behavior.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# Constants
# ============================================================================

# Actions that always require human approval (cannot be auto-approved)
CRITICAL_ACTIONS = {
    "emergency",
    "critical",
    "life_support",
    "oxygen",
    "leak",
    "evacuation",
    "safe_mode",
    "thruster",
    "docking",
}

# Actions that are considered routine/safe for auto-approval
ROUTINE_ACTIONS = {
    "continue nominal operations",
    "continue monitoring",
    "routine check",
    "standard monitoring",
    "no action required",
    "monitor",
}


# ============================================================================
# Helper Functions
# ============================================================================

def _is_critical_action(action: str) -> bool:
    """
    Check if the proposed action is critical and requires human approval.
    """
    if not action:
        return False
    action_lower = action.lower()
    return any(critical in action_lower for critical in CRITICAL_ACTIONS)


def _is_routine_action(action: str) -> bool:
    """
    Check if the/pre-approved.
    proposed action is routine """
    if not action:
        return True
    action_lower = action.lower()
    return any(routine in action_lower for routine in ROUTINE_ACTIONS)


def _should_auto_approve(
    severity: str, 
    confidence: float, 
    Args:
        action: The proposed action string
        
    Returns:
        True if action is routine
    """
    if not action:
        return True
    
    action_lower = action.lower()
    return any(routine in action_lower for routine in ROUTINE_ACTIONS)


def _should_auto_approve(
    severity: str, 
    confidence: float, 
    action: str
) -> tuple[bool, str]:
    """
    Determine if an action should be auto-approved.
    
    Auto-approve conditions:
    1. Severity is nominal AND confidence > 0.8 AND action is routine
    2. No anomaly detected (severity = nominal)
    
    Args:
        severity: Current severity level (critical, warning, nominal)
        confidence: AI confidence score (0.0 - 1.0)
        action: Proposed action string
        
    Returns:
        Tuple of (should_auto_approve, reason)
    """
    # Never auto-approve critical actions
    if severity == "critical":
        return False, "Critical actions require human approval"
    
    # Check if action is routine
    if _is_routine_action(action):
        if confidence >= 0.8 and severity == "nominal":
            return True, "High confidence, nominal severity, routine action"
        elif confidence >= 0.9:
            return True, "Very high confidence"
    
    # Check for nominal severity with good confidence
    if severity == "nominal" and confidence >= 0.85:
        return True, "Nominal severity with high confidence"
    
    return False, "Requires human review"


# ============================================================================
# Main Human Approval Node
# ============================================================================

def request_human_approval(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Request human approval for proposed action.
    
    This implements the true HITL interrupt pattern:
    1. Evaluates if human approval is needed
    2. If needed, uses langgraph.types.interrupt() to pause execution
    3. Returns state with approval requirements
    
    Auto-approve logic:
    - Critical actions: ALWAYS require human approval
    - Warning actions: Require approval unless very high confidence
    
    # Check if approved (yes, approve, y, etc.)
    approved = response_lower.startswith("yes") or response_lower.startswith("y") or response_lower == "approve"
    
    # Check if rejected
    rejected = response_lower.startswith("no") or response_lower.startswith("n") or response_lower == "reject"
    
    # Extract modification if any
    modification = None
    if "modify:" in response_lower or "change:" in response_lower:
        parts = response_lower.split(":", 1)
        if len(parts) > 1:
            modification = parts[1].strip()
    
    if rejected:
        print(f"❌ HUMAN REJECTED: {state.get('proposed_action')}")
        return {
            "human_approval": False,
            "human_modification": None,
            "rejection_reason": modification or "No reason provided",
            "mission_phase": "rejected",
            "last_updated": datetime.now().isoformat()
        }
    
    if approved:
        if modification:
            print(f"✅ APPROVED WITH MODIFICATION: {modification}")
            return {
                "human_approval": True,
                "human_modification": modification,
                "mission_phase": "approved",
                "last_updated": datetime.now().isoformat()
            }
        else:
            print(f"✅ APPROVED: {state.get('proposed_action')}")
            return {
                "human_approval": True,
                "human_modification": None,
                "mission_phase": "approved",
                "last_updated": datetime.now().isoformat()
            }
    
    # Invalid response - keep waiting
    print(f"⚠️ Invalid response, keeping pending: {human_response}")
    return {
        "human_approval": None,
        "mission_phase": "awaiting_approval",
        "errors": state.get("errors", []) + [f"Invalid human response: {human_response}"]
    }
