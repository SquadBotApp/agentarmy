"""
Human Approval Node (HITL Interrupt)
This is the critical Human-in-the-Loop component that pauses execution
and waits for human approval before any action is taken.
"""

from typing import Dict, Any, Optional
from datetime import datetime


def request_human_approval(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Request human approval for proposed action.
    
    This is the core HITL interrupt. If there's a proposed action:
    1. The graph PAUSES here
    2. A human reviews the telemetry and AI's recommendation
    3. Human can approve, reject, or modify the action
    4. Execution continues based on human decision
    
    For HIGH CONFIDENCE + LOW RISK actions, this can auto-approve.
    For CRITICAL actions, human approval is ALWAYS required.
    
    Args:
        state: Current agent state with proposed_action and analysis
        
    Returns:
        Updated state with human_approval status
    """
    proposed_action = state.get("proposed_action", "none")
    anomaly = state.get("anomaly", "none")
    severity = state.get("severity", "nominal")
    confidence = state.get("confidence_score", 0.5)
    
    # If no action proposed, skip approval
    if proposed_action == "none" or not proposed_action:
        print("✅ No action required - continuing nominal operations")
        return {
            "human_approval": True,
            "human_modification": None,
            "mission_phase": "approved",
            "last_updated": datetime.now().isoformat()
        }
    
    # Auto-approve only if:
    # 1. Severity is nominal (not critical/warning)
    # 2. Confidence is high (> 0.8)
    # 3. Action is routine/pre-approved
    auto_approve_conditions = (
        severity == "nominal" and 
        confidence > 0.8 and
        _is_routine_action(proposed_action)
    )
    
    if auto_approve_conditions:
        print(f"✅ AUTO-APPROVED (high confidence, routine action): {proposed_action}")
        return {
            "human_approval": True,
            "human_modification": None,
            "auto_approved": True,
            "mission_phase": "approved",
            "last_updated": datetime.now().isoformat()
        }
    
    # For critical actions, ALWAYS require human approval
    if severity == "critical":
        print(f"🚨 CRITICAL ACTION REQUIRES HUMAN APPROVAL:")
        print(f"   Anomaly: {anomaly}")
        print(f"   Proposed: {proposed_action}")
        print(f"   Confidence: {confidence}")
        
        # In production, this would use langgraph.types.interrupt()
        # For now, we'll set up the state for external approval
        return {
            "human_approval": None,  # Pending - waiting for human
            "human_modification": None,
            "approval_required": True,
            "mission_phase": "awaiting_approval",
            "last_updated": datetime.now().isoformat()
        }
    
    # For warnings, recommend human review but don't block
    if severity == "warning":
        print(f"⚠️ WARNING - Human review recommended:")
        print(f"   Anomaly: {anomaly}")
        print(f"   Proposed: {proposed_action}")
        
        return {
            "human_approval": None,
            "human_modification": None,
            "approval_required": True,
            "mission_phase": "awaiting_approval",
            "last_updated": datetime.now().isoformat()
        }
    
    # Default: require approval
    return {
        "human_approval": None,
        "human_modification": None,
        "approval_required": True,
        "mission_phase": "awaiting_approval",
        "last_updated": datetime.now().isoformat()
    }


def _is_routine_action(action: str) -> bool:
    """
    Check if the proposed action is routine/pre-approved.
    
    These actions are considered safe to auto-approve when confidence is high.
    """
    routine_actions = [
        "continue nominal operations",
        "continue monitoring",
        "routine check",
        "standard monitoring",
        "no action required"
    ]
    
    action_lower = action.lower()
    return any(routine in action_lower for routine in routine_actions)


def process_human_response(state: Dict[str, Any], human_response: str) -> Dict[str, Any]:
    """
    Process a human's response to an approval request.
    
    This is called when the human provides their decision via:
    - Gradio dashboard
    - API endpoint
    - Command line
    
    Args:
        state: Current agent state
        human_response: Human's response (yes/no/modification)
        
    Returns:
        Updated state with human's decision
    """
    response_lower = human_response.lower().strip()
    
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
