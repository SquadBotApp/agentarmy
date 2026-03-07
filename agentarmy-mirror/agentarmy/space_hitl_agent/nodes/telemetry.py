"""
Telemetry Ingestion Node
Simulates or connects to real-time telemetry data from commercial space stations.
Currently supports: Haven-1, Axiom Station, Starlab, generic LEO stations.
"""

import random
import json
from typing import Dict, Any, Optional
from datetime import datetime


# Station-specific telemetry configurations
STATION_CONFIGS = {
    "haven-1": {
        "power_kw_range": (8.0, 12.0),
        "temp_c_range": (18, 26),
        "pressure_range": (99, 101),
        "attitude_error_range": (0.0, 2.5),
        "oxygen_level_range": (95, 100),
        "co2_level_range": (0, 5),
    },
    "axiom": {
        "power_kw_range": (10.0, 15.0),
        "temp_c_range": (20, 28),
        "pressure_range": (100, 102),
        "attitude_error_range": (0.0, 1.5),
        "oxygen_level_range": (96, 100),
        "co2_level_range": (0, 4),
    },
    "starlab": {
        "power_kw_range": (12.0, 18.0),
        "temp_c_range": (19, 27),
        "pressure_range": (99, 101),
        "attitude_error_range": (0.0, 2.0),
        "oxygen_level_range": (95, 100),
        "co2_level_range": (0, 5),
    },
    "generic": {
        "power_kw_range": (5.0, 20.0),
        "temp_c_range": (15, 30),
        "pressure_range": (98, 103),
        "attitude_error_range": (0.0, 5.0),
        "oxygen_level_range": (90, 100),
        "co2_level_range": (0, 8),
    }
}


def generate_telemetry(station_type: str = "generic", include_anomaly: bool = False) -> Dict[str, Any]:
    """
    Generate realistic telemetry data for a commercial space station.
    
    Args:
        station_type: Type of station (haven-1, axiom, starlab, generic)
        include_anomaly: If True, inject anomalous values for testing
    
    Returns:
        Dictionary containing all telemetry parameters
    """
    config = STATION_CONFIGS.get(station_type, STATION_CONFIGS["generic"])
    
    # Generate base telemetry values
    telemetry = {
        "station_type": station_type,
        "timestamp": datetime.now().isoformat(),
        "power_kw": round(random.uniform(*config["power_kw_range"]), 1),
        "temp_c": round(random.uniform(*config["temp_c_range"]), 1),
        "pressure_kpa": round(random.uniform(*config["pressure_range"]), 1),
        "attitude_error_deg": round(random.uniform(*config["attitude_error_range"]), 2),
        "oxygen_percent": round(random.uniform(*config["oxygen_level_range"]), 1),
        "co2_level_mmhg": round(random.uniform(*config["co2_level_range"]), 1),
        "solar_array_angle": random.randint(0, 360),
        "battery_charge_percent": random.randint(60, 100),
        "comm_status": "nominal" if random.random() > 0.05 else "degraded",
        "thermal_control_status": "nominal",
        "cabin_humidity_percent": round(random.uniform(30, 60), 1),
        "crew_count": random.randint(0, 4),
    }
    
    # Inject anomaly for testing if requested
    if include_anomaly:
        anomaly_type = random.choice([
            "thermal_anomaly",
            "power_drop",
            "pressure_leak",
            "attitude_error"
        ])
        
        if anomaly_type == "thermal_anomaly":
            telemetry["temp_c"] = round(random.uniform(30, 40), 1)
            telemetry["thermal_control_status"] = "warning"
        elif anomaly_type == "power_drop":
            telemetry["power_kw"] = round(random.uniform(2, 5), 1)
            telemetry["battery_charge_percent"] = random.randint(20, 40)
        elif anomaly_type == "pressure_leak":
            telemetry["pressure_kpa"] = round(random.uniform(95, 97), 1)
        elif anomaly_type == "attitude_error":
            telemetry["attitude_error_deg"] = round(random.uniform(3, 8), 2)
    
    return telemetry


def ingest_telemetry(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Ingest telemetry data from the space station.
    
    This is the first node in the HITL pipeline. It generates or retrieves
    telemetry data and stores it in the state.
    
    Args:
        state: Current agent state
        
    Returns:
        Updated state with new telemetry data
    """
    # Get station type from state or use default
    station_type = state.get("station_type", "generic")
    
    # Check if we should inject anomalies (for testing/simulation)
    simulation_mode = state.get("simulation_mode", True)
    include_anomaly = simulation_mode and random.random() < 0.2  # 20% chance of anomaly
    
    # Generate telemetry
    telemetry = generate_telemetry(station_type, include_anomaly)
    
    print(f"📡 Ingested telemetry from {station_type}: {json.dumps(telemetry, indent=2)}")
    
    return {
        "telemetry": telemetry,
        "mission_phase": "telemetry_ingested",
        "last_updated": datetime.now().isoformat()
    }


def ingest_real_telemetry(state: Dict[str, Any], api_url: Optional[str] = None) -> Dict[str, Any]:
    """
    LangGraph node: Ingest REAL telemetry data from NASA TReK or similar APIs.
    
    Args:
        state: Current agent state
        api_url: Optional URL for NASA TReK or other telemetry API
        
    Returns:
        Updated state with real telemetry data
    """
    # TODO: Implement real telemetry ingestion
    # Example API endpoints:
    # - NASA TReK: https://api.nasa.gov/insight_weather/
    # - ISS Real-time: http://api.open-notify.org/iss-now.json
    # - Starlink constellation tracking
    
    if api_url:
        # Placeholder for real API integration
        raise NotImplementedError("Real telemetry API integration coming soon")
    
    # Fall back to simulated data
    return ingest_telemetry(state)

