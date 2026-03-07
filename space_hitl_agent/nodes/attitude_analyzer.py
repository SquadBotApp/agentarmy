"""
Attitude & Orbit Agent
Monitors station-keeping, attitude control, and docking preparation.
"""

from typing import Dict, Any
from datetime import datetime
import math


# Attitude and orbit thresholds
ORBIT_THRESHOLDS = {
    # Attitude error (degrees)
    "attitude_error_critical": 10.0,
    "attitude_error_warning": 5.0,
    "attitude_error_caution": 2.5,
    
    # Angular velocity (deg/s)
    "angular_velocity_critical": 3.0,
    "angular_velocity_warning": 1.5,
    
    # Altitude (km for LEO stations)
    "altitude_min": 300.0,
    "altitude_warning_low": 350.0,
    "altitude_nominal": 400.0,
    "altitude_warning_high": 450.0,
    
    # Docking approach (meters)
    "docking_range_nominal": 1000.0,  # m
    "docking_range_warning": 100.0,  # m
    "docking_range_critical": 10.0,  # m
    
    # Velocity relative to target (m/s)
    "docking_velocity_safe": 0.1,  # m/s
    "docking_velocity_warning": 0.3,  # m/s
    "docking_velocity_critical": 0.5,  # m/s
}


def calculate_orbital_period(altitude_km: float) -> float:
    """
    Calculate orbital period in minutes for a circular orbit.
    
    Using: T = 2*pi*sqrt((R+h)^3 / GM)
    where R = 6371 km (Earth radius), GM = 398600 km^3/s^2
    """
    R = 6371.0  # Earth radius in km
    GM = 398600.0  # Standard gravitational parameter
    
    try:
        orbital_radius = (R + altitude_km)
        period_seconds = 2 * math.pi * math.sqrt((orbital_radius ** 3) / GM)
        return period_seconds / 60.0  # Convert to minutes
    except:
        return 90.0  # Default to ~90 min for typical LEO


def attitude_analyze(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Analyze attitude and orbit systems for anomalies.
    
    This is the Attitude & Orbit Agent - runs independently to monitor:
    - Attitude error
    - Angular velocity
    - Orbital altitude
    - Docking approach (if applicable)
    - Reaction wheel status
    
    Args:
        state: Current agent state with telemetry data
        
    Returns:
        Attitude/orbit analysis results for the state
    """
    telemetry = state.get("telemetry", {})
    
    # Extract attitude/orbit parameters
    attitude_error = telemetry.get("attitude_error_deg", 0.0)
    angular_velocity = telemetry.get("angular_velocity_deg_s", 0.0)
    altitude = telemetry.get("altitude_km", 400.0)
    reaction_wheel_speed = telemetry.get("reaction_wheel_rpm", 0.0)
    thruster_status = telemetry.get("thruster_status", "nominal")
    
    # Docking parameters (if in docking mode)
    docking_range = telemetry.get("docking_range_m", None)
    docking_velocity = telemetry.get("docking_velocity_m_s", None)
    
    # Initialize result
    attitude_result = {
        "attitude_anomaly": False,
        "attitude_action": "none",
        "attitude_severity": "nominal",
        "attitude_rationale": "Attitude and orbit nominal.",
        "attitude_error": attitude_error,
        "attitude_angular_velocity": angular_velocity,
        "attitude_altitude": altitude,
    }
    
    # Check attitude error
    if attitude_error > ORBIT_THRESHOLDS["attitude_error_critical"]:
        attitude_result.update({
            "attitude_anomaly": True,
            "attitude_action": "EMERGENCY: Initiate safe mode, activate reaction wheels, prepare thrusters",
            "attitude_severity": "critical",
            "attitude_rationale": f"Attitude error {attitude_error}° exceeds critical threshold"
        })
    elif attitude_error > ORBIT_THRESHOLDS["attitude_error_warning"]:
        attitude_result.update({
            "attitude_anomaly": True,
            "attitude_action": "Activate reaction wheel correction, increase attitude control",
            "attitude_severity": "warning",
            "attitude_rationale": f"Attitude error {attitude_error}° exceeds warning threshold"
        })
    elif attitude_error > ORBIT_THRESHOLDS["attitude_error_caution"]:
        attitude_result.update({
            "attitude_anomaly": True,
            "attitude_action": "Monitor attitude control, prepare for adjustment",
            "attitude_severity": "caution",
            "attitude_rationale": f"Attitude error {attitude_error}° elevated"
        })
    
    # Check angular velocity
    if abs(angular_velocity) > ORBIT_THRESHOLDS["angular_velocity_critical"]:
        attitude_result.update({
            "attitude_anomaly": True,
            "attitude_action": "EMERGENCY: Angular velocity critical, initiate despin",
            "attitude_severity": "critical",
            "attitude_rationale": f"Angular velocity {angular_velocity}°/s critical"
        })
    elif abs(angular_velocity) > ORBIT_THRESHOLDS["angular_velocity_warning"]:
        attitude_result.update({
            "attitude_anomaly": True,
            "attitude_action": "Activate reaction control system, reduce angular velocity",
            "attitude_severity": "warning",
            "attitude_rationale": f"Angular velocity {angular_velocity}°/s elevated"
        })
    
    # Check altitude
    if altitude < ORBIT_THRESHOLDS["altitude_min"]:
        attitude_result.update({
            "attitude_anomaly": True,
            "attitude_action": "EMERGENCY: Re-entry imminent, initiate re-boost",
            "attitude_severity": "critical",
            "attitude_rationale": f"Altitude {altitude} km below minimum safe orbit"
        })
    elif altitude < ORBIT_THRESHOLDS["altitude_warning_low"]:
        attitude_result.update({
            "attitude_anomaly": True,
            "attitude_action": "Initiate re-boost maneuver, schedule station-keeping",
            "attitude_severity": "warning",
            "attitude_rationale": f"Altitude {altitude} km below nominal - orbital decay"
        })
    elif altitude > ORBIT_THRESHOLDS["altitude_warning_high"]:
        attitude_result.update({
            "attitude_anomaly": True,
            "attitude_action": "Monitor altitude, may require de-boost",
            "attitude_severity": "caution",
            "attitude_rationale": f"Altitude {altitude} km above nominal"
        })
    
    # Check thruster status
    if thruster_status != "nominal" and thruster_status != "off":
        if not attitude_result["attitude_anomaly"]:
            attitude_result.update({
                "attitude_anomaly": True,
                "attitude_action": f"Investigate thruster anomaly: {thruster_status}",
                "attitude_severity": "warning",
                "attitude_rationale": f"Thruster status: {thruster_status}"
            })
    
    # Check docking parameters if available
    if docking_range is not None:
        attitude_result["docking_range"] = docking_range
        
        if docking_range < ORBIT_THRESHOLDS["docking_range_critical"]:
            attitude_result.update({
                "attitude_anomaly": True,
                "attitude_action": "EMERGENCY: Abort docking approach",
                "attitude_severity": "critical",
                "attitude_rationale": f"Docking range {docking_range}m critical"
            })
        elif docking_range < ORBIT_THRESHOLDS["docking_range_warning"]:
            attitude_result.update({
                "attitude_anomaly": True,
                "attitude_action": "Slow approach, verify alignment",
                "attitude_severity": "warning",
                "attitude_rationale": f"Docking range {docking_range}m - final approach"
            })
        
        # Check docking velocity
        if docking_velocity is not None:
            attitude_result["docking_velocity"] = docking_velocity
            
            if docking_velocity > ORBIT_THRESHOLDS["docking_velocity_critical"]:
                attitude_result.update({
                    "attitude_anomaly": True,
                    "attitude_action": "EMERGENCY: Abort - approach velocity too high",
                    "attitude_severity": "critical",
                    "attitude_rationale": f"Docking velocity {docking_velocity}m/s critical"
                })
            elif docking_velocity > ORBIT_THRESHOLDS["docking_velocity_warning"]:
                attitude_result.update({
                    "attitude_anomaly": True,
                    "attitude_action": "Reduce approach velocity",
                    "attitude_severity": "warning",
                    "attitude_rationale": f"Docking velocity {docking_velocity}m/s elevated"
                })
    
    # Calculate orbital period if altitude is available
    if altitude:
        orbital_period = calculate_orbital_period(altitude)
        attitude_result["orbital_period_minutes"] = round(orbital_period, 2)
    
    return attitude_result

