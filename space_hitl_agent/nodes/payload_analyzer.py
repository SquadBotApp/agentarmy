"""
Payload Agent
Monitors and orchestrates science experiments and payloads.
"""

from typing import Dict, Any, List
from datetime import datetime
import random


# Payload thresholds
PAYLOAD_THRESHOLDS = {
    # Experiment status
    "experiment_warning_states": ["paused", "degraded", "error"],
    "experiment_critical_states": ["failed", "emergency", "aborted"],
    
    # Data collection
    "data_storage_warning": 80.0,  # % full
    "data_storage_critical": 95.0,  # % full
    
    # Power for payloads
    "payload_power_min": 0.5,  # kW
    "payload_power_warning": 1.0,  # kW
    
    # Temperature for sensitive payloads
    "payload_temp_min": 15.0,  # Celsius
    "payload_temp_max": 30.0,  # Celsius
    
    # Data transmission
    "downlink_rate_min": 1.0,  # Mbps
}


def generate_experiment_status() -> Dict[str, Any]:
    """
    Generate simulated experiment data for demonstration.
    
    In production, this would come from actual payload systems.
    """
    experiments = [
        {
            "id": "exp-001",
            "name": "Fluid Physics Experiment",
            "status": random.choice(["running", "running", "running", "paused"]),
            "priority": "high",
            "data_collected_mb": random.randint(100, 5000),
        },
        {
            "id": "exp-002", 
            "name": "Biological Growth Chamber",
            "status": random.choice(["running", "running", "monitoring"]),
            "priority": "critical",
            "data_collected_mb": random.randint(50, 2000),
        },
        {
            "id": "exp-003",
            "name": "Materials Science Furnace",
            "status": random.choice(["idle", "heating", "cooling", "running"]),
            "priority": "medium",
            "data_collected_mb": random.randint(10, 500),
        },
    ]
    
    return {
        "active_experiments": experiments,
        "total_experiments": len(experiments),
        "data_storage_percent": random.uniform(30, 85),
        "downlink_rate_mbps": random.uniform(2, 25),
    }


def payload_analyze(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Analyze payload systems for anomalies.
    
    This is the Payload Agent - runs independently to monitor:
    - Active experiments
    - Data storage
    - Downlink capacity
    - Power allocation
    - Experiment scheduling
    
    Args:
        state: Current agent state with telemetry data
        
    Returns:
        Payload analysis results for the state
    """
    telemetry = state.get("telemetry", {})
    
    # Get payload data from telemetry or generate demo data
    payload_data = telemetry.get("payload_data")
    if not payload_data:
        # Generate demo payload data
        payload_data = generate_experiment_status()
    
    # Extract payload parameters
    active_experiments = payload_data.get("active_experiments", [])
    data_storage_percent = payload_data.get("data_storage_percent", 50.0)
    downlink_rate = payload_data.get("downlink_rate_mbps", 10.0)
    payload_power = telemetry.get("payload_power_kw", 2.0)
    
    # Initialize result
    payload_result = {
        "payload_anomaly": False,
        "payload_action": "none",
        "payload_severity": "nominal",
        "payload_rationale": "All payloads nominal.",
        "payload_active_experiments": len(active_experiments),
        "payload_data_storage_percent": data_storage_percent,
        "payload_downlink_rate": downlink_rate,
    }
    
    # Check experiment statuses
    critical_experiments = []
    warning_experiments = []
    
    for exp in active_experiments:
        status = exp.get("status", "").lower()
        exp_id = exp.get("id", "unknown")
        exp_name = exp.get("name", "Unknown")
        
        if status in PAYLOAD_THRESHOLDS["experiment_critical_states"]:
            critical_experiments.append(f"{exp_name} ({exp_id}): {status}")
        elif status in PAYLOAD_THRESHOLDS["experiment_warning_states"]:
            warning_experiments.append(f"{exp_name} ({exp_id}): {status}")
    
    if critical_experiments:
        payload_result.update({
            "payload_anomaly": True,
            "payload_action": f"EMERGENCY: Address failed experiments: {', '.join(critical_experiments)}",
            "payload_severity": "critical",
            "payload_rationale": f"Critical experiment failures: {', '.join(critical_experiments)}"
        })
    elif warning_experiments:
        payload_result.update({
            "payload_anomaly": True,
            "payload_action": f"Review degraded experiments: {', '.join(warning_experiments)}",
            "payload_severity": "warning",
            "payload_rationale": f"Experiment warnings: {', '.join(warning_experiments)}"
        })
    
    # Check data storage
    if data_storage_percent > PAYLOAD_THRESHOLDS["data_storage_critical"]:
        payload_result.update({
            "payload_anomaly": True,
            "payload_action": "EMERGENCY: Prioritize data downlink, suspend new data collection",
            "payload_severity": "critical",
            "payload_rationale": f"Data storage {data_storage_percent}% full - risk of data loss"
        })
    elif data_storage_percent > PAYLOAD_THRESHOLDS["data_storage_warning"]:
        payload_result.update({
            "payload_anomaly": True,
            "payload_action": "Increase data downlink rate, consider pausing low-priority experiments",
            "payload_severity": "warning",
            "payload_rationale": f"Data storage {data_storage_percent}% full"
        })
    
    # Check downlink rate
    if downlink_rate < PAYLOAD_THRESHOLDS["downlink_rate_min"]:
        payload_result.update({
            "payload_anomaly": True,
            "payload_action": "Investigate downlink degradation, switch to backup comm",
            "payload_severity": "warning",
            "payload_rationale": f"Downlink rate {downlink_rate} Mbps below minimum"
        })
    
    # Check payload power
    if payload_power < PAYLOAD_THRESHOLDS["payload_power_min"]:
        payload_result.update({
            "payload_anomaly": True,
            "payload_action": "Reduce payload power consumption, prioritize critical experiments",
            "payload_severity": "warning",
            "payload_rationale": f"Payload power {payload_power} kW below minimum"
        })
    
    # Add experiment details to result
    payload_result["payload_experiments"] = active_experiments
    
    return payload_result

