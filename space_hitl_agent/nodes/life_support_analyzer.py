"""
Life Support Agent
Monitors pressure, O₂, CO₂, humidity, and other life-critical systems.
"""

from typing import Dict, Any
from datetime import datetime


# Life support thresholds based on NASA/ESA standards
LIFE_SUPPORT_THRESHOLDS = {
    # Pressure (kPa) - ISS nominal is ~101.3 kPa
    "pressure_critical_low": 95.0,
    "pressure_warning_low": 98.0,
    "pressure_warning_high": 103.0,
    "pressure_critical_high": 105.0,
    
    # Oxygen (%)
    "oxygen_critical_low": 85.0,
    "oxygen_warning_low": 90.0,
    "oxygen_nominal": 95.0,
    
    # CO2 (mmHg) - ISS keeps below 4 mmHg typically
    "co2_critical_high": 8.0,
    "co2_warning_high": 5.0,
    
    # Humidity (%)
    "humidity_low": 20.0,
    "humidity_warning_low": 25.0,
    "humidity_warning_high": 65.0,
    "humidity_high": 70.0,
    
    # Trace contaminants (ppm)
    "total_contaminant_warning": 1.0,
    "total_contaminant_critical": 5.0,
}


def life_support_analyze(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Analyze life support systems for anomalies.
    
    This is the Life Support Agent - runs independently to monitor:
    - Cabin pressure
    - Oxygen levels
    - CO2 levels
    - Humidity
    - Trace contaminants
    
    Args:
        state: Current agent state with telemetry data
        
    Returns:
        Life support analysis results for the state
    """
    telemetry = state.get("telemetry", {})
    
    # Extract life support parameters
    pressure = telemetry.get("pressure_kpa", 101.3)
    oxygen = telemetry.get("oxygen_percent", 95.0)
    co2 = telemetry.get("co2_level_mmhg", 2.0)
    humidity = telemetry.get("cabin_humidity_percent", 45.0)
    total_contaminants = telemetry.get("total_contaminants_ppm", 0.1)
    
    # Initialize result
    life_support_result = {
        "life_support_anomaly": False,
        "life_support_action": "none",
        "life_support_severity": "nominal",
        "life_support_rationale": "Life support systems nominal.",
        "life_support_pressure": pressure,
        "life_support_oxygen": oxygen,
        "life_support_co2": co2,
        "life_support_humidity": humidity,
    }
    
    # Check pressure
    if pressure < LIFE_SUPPORT_THRESHOLDS["pressure_critical_low"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "EMERGENCY: Initiate pressure leak protocol, seal modules, don emergency O2",
            "life_support_severity": "critical",
            "life_support_rationale": f"Cabin pressure {pressure} kPa CRITICAL - imminent loss of consciousness risk"
        })
    elif pressure < LIFE_SUPPORT_THRESHOLDS["pressure_warning_low"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "Initiate leak detection, prepare for module sealing",
            "life_support_severity": "warning",
            "life_support_rationale": f"Cabin pressure {pressure} kPa below nominal"
        })
    elif pressure > LIFE_SUPPORT_THRESHOLDS["pressure_critical_high"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "Vent cabin pressure, check pressure regulation system",
            "life_support_severity": "warning",
            "life_support_rationale": f"Cabin pressure {pressure} kPa above nominal"
        })
    
    # Check oxygen
    if oxygen < LIFE_SUPPORT_THRESHOLDS["oxygen_critical_low"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "EMERGENCY: Activate O2 generators, don emergency masks, initiate evacuation protocol",
            "life_support_severity": "critical",
            "life_support_rationale": f"Oxygen level {oxygen}% CRITICAL - life threatening"
        })
    elif oxygen < LIFE_SUPPORT_THRESHOLDS["oxygen_warning_low"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "Activate oxygen generation, verify O2 supply status",
            "life_support_severity": "warning",
            "life_support_rationale": f"Oxygen level {oxygen}% below nominal"
        })
    
    # Check CO2
    if co2 > LIFE_SUPPORT_THRESHOLDS["co2_critical_high"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "EMERGENCY: Activate all CO2 scrubbers, increase ventilation, alert crew",
            "life_support_severity": "critical",
            "life_support_rationale": f"CO2 level {co2} mmHg CRITICAL - hypercapnia risk"
        })
    elif co2 > LIFE_SUPPORT_THRESHOLDS["co2_warning_high"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "Activate CO2 scrubbers, verify scrubber operation",
            "life_support_severity": "warning",
            "life_support_rationalCO2 level {co2} mme": f"Hg elevated"
        })
    
    # Check humidity
    if humidity < LIFE_SUPPORT_THRESHOLDS["humidity_low"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "Increase humidity generation, check water reclamation",
            "life_support_severity": "warning",
            "life_support_rationale": f"Humidity {humidity}% very low - crew discomfort"
        })
    elif humidity > LIFE_SUPPORT_THRESHOLDS["humidity_high"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "Activate dehumidification, check for water leaks",
            "life_support_severity": "warning",
            "life_support_rationale": f"Humidity {humidity}% too high"
        })
    
    # Check contaminants
    if total_contaminants > LIFE_SUPPORT_THRESHOLDS["total_contaminant_critical"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "Emergency ventilation, trace contaminant removal",
            "life_support_severity": "critical",
            "life_support_rationale": f"Total contaminants {total_contaminants} ppm critical"
        })
    elif total_contaminants > LIFE_SUPPORT_THRESHOLDS["total_contaminant_warning"]:
        life_support_result.update({
            "life_support_anomaly": True,
            "life_support_action": "Activate trace contaminant removal, increase ventilation",
            "life_support_severity": "warning",
            "life_support_rationale": f"Total contaminants {total_contaminants} ppm elevated"
        })
    
    return life_support_result

