"""
Thermal Agent
Monitors radiator control, heat loops, and thermal regulation systems.
"""

from typing import Dict, Any
from datetime import datetime


# Thermal thresholds based on NASA/ESA standards
THERMAL_THRESHOLDS = {
    "cabin_temp_critical_low": 15.0,
    "cabin_temp_warning_low": 18.0,
    "cabin_temp_warning_high": 28.0,
    "cabin_temp_critical_high": 35.0,
    "radiator_temp_warning": 60.0,
    "radiator_temp_critical": 80.0,
    "heat_loop_pressure_low": 1.5,  # bar
    "heat_loop_pressure_high": 2.5,  # bar
}


def thermal_analyze(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Analyze thermal systems for anomalies.
    
    This is the Thermal Agent - runs independently to monitor:
    - Cabin temperature
    - Radiator temperature
    - Heat loop pressure
    - Thermal control system status
    
    Args:
        state: Current agent state with telemetry data
        
    Returns:
        Thermal analysis results for the state
    """
    telemetry = state.get("telemetry", {})
    
    # Extract thermal parameters
    cabin_temp = telemetry.get("temp_c", 22.0)
    radiator_temp = telemetry.get("radiator_temp_c", 45.0)
    heat_loop_pressure = telemetry.get("heat_loop_pressure_bar", 2.0)
    thermal_status = telemetry.get("thermal_control_status", "nominal")
    
    # Initialize result
    thermal_result = {
        "thermal_anomaly": False,
        "thermal_action": "none",
        "thermal_severity": "nominal",
        "thermal_rationale": "Thermal systems nominal.",
        "thermal_cabin_temp": cabin_temp,
        "thermal_radiator_temp": radiator_temp,
        "thermal_heat_loop_pressure": heat_loop_pressure,
    }
    
    # Check cabin temperature
    if cabin_temp < THERMAL_THRESHOLDS["cabin_temp_critical_low"]:
        thermal_result.update({
            "thermal_anomaly": True,
            "thermal_action": "Activate emergency heating, alert crew",
            "thermal_severity": "critical",
            "thermal_rationale": f"Cabin temperature {cabin_temp}°C is critically low ({THERMAL_THRESHOLDS['cabin_temp_critical_low']}°C threshold)"
        })
    elif cabin_temp > THERMAL_THRESHOLDS["cabin_temp_critical_high"]:
        thermal_result.update({
            "thermal_anomaly": True,
            "thermal_action": "Activate emergency cooling, alert crew",
            "thermal_severity": "critical",
            "thermal_rationale": f"Cabin temperature {cabin_temp}°C is critically high ({THERMAL_THRESHOLDS['cabin_temp_critical_high']}°C threshold)"
        })
    elif cabin_temp < THERMAL_THRESHOLDS["cabin_temp_warning_low"]:
        thermal_result.update({
            "thermal_anomaly": True,
            "thermal_action": "Increase heating, monitor for leaks",
            "thermal_severity": "warning",
            "thermal_rationale": f"Cabin temperature {cabin_temp}°C below nominal ({THERMAL_THRESHOLDS['cabin_temp_warning_low']}°C threshold)"
        })
    elif cabin_temp > THERMAL_THRESHOLDS["cabin_temp_warning_high"]:
        thermal_result.update({
            "thermal_anomaly": True,
            "thermal_action": "Adjust thermal control system, increase cooling",
            "thermal_severity": "warning",
            "thermal_rationale": f"Cabin temperature {cabin_temp}°C above nominal ({THERMAL_THRESHOLDS['cabin_temp_warning_high']}°C threshold)"
        })
    
    # Check radiator temperature
    if radiator_temp > THERMAL_THRESHOLDS["radiator_temp_critical"]:
        thermal_result.update({
            "thermal_anomaly": True,
            "thermal_action": "Emergency radiator shutdown, activate backup cooling",
            "thermal_severity": "critical",
            "thermal_rationale": f"Radiator temperature {radiator_temp}°C critical"
        })
    elif radiator_temp > THERMAL_THRESHOLDS["radiator_temp_warning"]:
        if not thermal_result["thermal_anomaly"]:
            thermal_result.update({
                "thermal_anomaly": True,
                "thermal_action": "Monitor radiator, prepare for adjustment",
                "thermal_severity": "warning",
                "thermal_rationale": f"Radiator temperature {radiator_temp}°C elevated"
            })
    
    # Check heat loop pressure
    if heat_loop_pressure < THERMAL_THRESHOLDS["heat_loop_pressure_low"]:
        if not thermal_result["thermal_anomaly"]:
            thermal_result.update({
                "thermal_anomaly": True,
                "thermal_action": "Check for heat loop leak, pressurize system",
                "thermal_severity": "warning",
                "thermal_rationale": f"Heat loop pressure {heat_loop_pressure} bar low"
            })
    elif heat_loop_pressure > THERMAL_THRESHOLDS["heat_loop_pressure_high"]:
        if not thermal_result["thermal_anomaly"]:
            thermal_result.update({
                "thermal_anomaly": True,
                "thermal_action": "Relieve heat loop pressure, check for blockage",
                "thermal_severity": "warning",
                "thermal_rationale": f"Heat loop pressure {heat_loop_pressure} bar high"
            })
    
    # Check thermal control status
    if thermal_status != "nominal" and not thermal_result["thermal_anomaly"]:
        thermal_result.update({
            "thermal_anomaly": True,
            "thermal_action": f"Investigate thermal control status: {thermal_status}",
            "thermal_severity": "warning",
            "thermal_rationale": f"Thermal control system reports: {thermal_status}"
        })
    
    return thermal_result

