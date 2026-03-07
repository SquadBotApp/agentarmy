"""
Navigation Agent
Monitors GPS, star trackers, and orbital navigation systems.
"""

from typing import Dict, Any


def navigation_analyze(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node: Analyze navigation systems."""
    telemetry = state.get("telemetry", {})
    
    gps_status = telemetry.get("gps_status", "nominal")
    star_tracker_status = telemetry.get("star_tracker_status", "nominal")
    position_accuracy = telemetry.get("position_accuracy_m", 10)
    
    result = {
        "nav_anomaly": False,
        "nav_action": "none",
        "nav_severity": "nominal",
        "nav_rationale": "Navigation nominal.",
    }
    
    if gps_status != "nominal" and position_accuracy > 50:
        result.update({
            "nav_anomaly": True,
            "nav_action": "Switch to star tracker navigation",
            "nav_severity": "warning",
            "nav_rationale": f"GPS: {gps_status}, Accuracy: {position_accuracy}m"
        })
    
    return result

