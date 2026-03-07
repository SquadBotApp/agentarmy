"""
Communication Agent
Monitors communication systems, ground stations, and data links.
"""

from typing import Dict, Any
from datetime import datetime


COMMS_THRESHOLDS = {
    "signal_strength_warning": -120,  # dBm
    "signal_strength_critical": -130,
    "bandwidth_warning": 1.0,  # Mbps
    "latency_warning": 1000,  # ms
    "packet_loss_warning": 5.0,  # %
}


def communications_analyze(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node: Analyze communication systems."""
    telemetry = state.get("telemetry", {})
    
    signal_strength = telemetry.get("signal_strength_dbm", -100)
    bandwidth = telemetry.get("downlink_rate_mbps", 10)
    latency = telemetry.get("comm_latency_ms", 100)
    packet_loss = telemetry.get("packet_loss_percent", 0.5)
    
    result = {
        "comms_anomaly": False,
        "comms_action": "none",
        "comms_severity": "nominal",
        "comms_rationale": "Communications nominal.",
    }
    
    if signal_strength < COMMS_THRESHOLDS["signal_strength_critical"]:
        result.update({
            "comms_anomaly": True,
            "comms_action": "Switch to backup communication array, activate emergency beacon",
            "comms_severity": "critical",
            "comms_rationale": f"Signal strength {signal_strength} dBm critical"
        })
    elif signal_strength < COMMS_THRESHOLDS["signal_strength_warning"]:
        result.update({
            "comms_anomaly": True,
            "comms_action": "Increase antenna gain, switch to backup",
            "comms_severity": "warning",
            "comms_rationale": f"Signal strength {signal_strength} dBm degraded"
        })
    
    if bandwidth < COMMS_THRESHOLDS["bandwidth_warning"]:
        result.update({
            "comms_anomaly": True,
            "comms_action": "Prioritize critical data, reduce non-essential transmission",
            "comms_severity": "warning" if result["comms_severity"] != "critical" else "critical",
            "comms_rationale": f"Bandwidth {bandwidth} Mbps below nominal"
        })
    
    return result

