"""
Real Telemetry Connectors
Provides connectors to real space telemetry data sources:
- ISS position (api.open-notify.org)
- NORAD/Space-Track orbital elements
- Starlink simulated telemetry
- Haven-1/Axiom simulated telemetry
"""

import random
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import math


# ============================================================================
# ISS Real-Time Data Connector
# ============================================================================

async def fetch_iss_position() -> Optional[Dict[str, Any]]:
    """
    Fetch real ISS position from Open-Notify API.
    API: http://api.open-notify.org/iss-now.json
    """
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get("http://api.open-notify.org/iss-now.json", timeout=5) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return {
                        "source": "ISS-Real",
                        "timestamp": data.get("timestamp"),
                        "latitude": float(data["iss_position"]["latitude"]),
                        "longitude": float(data["iss_position"]["longitude"]),
                        "message": data.get("message"),
                    }
    except Exception as e:
        print(f"⚠️ ISS API error: {e}")
    return None


def get_iss_pass_times(lat: float = 40.0, lon: float = -74.0) -> Optional[Dict[str, Any]]:
    """
    Get ISS pass times for a location.
    API: http://api.open-notify.org/iss-pass.json
    """
    try:
        import aiohttp
        import urllib.parse
        params = urllib.parse.urlencode({"lat": lat, "lon": lon})
        import requests
        resp = requests.get(f"http://api.open-notify.org/iss-pass.json?{params}", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "source": "ISS-Pass-Times",
                "request_timestamp": data.get("request"),
                "passes": data.get("response", [])
            }
    except Exception as e:
        print(f"⚠️ ISS pass times API error: {e}")
    return None


# ============================================================================
# NORAD/Space-Track Connector (Simulated for Demo)
# ============================================================================

def get_norad_elements(satellite_id: str = "25544") -> Optional[Dict[str, Any]]:
    """
    Get NORAD Two-Line Elements for a satellite.
    
    In production, this would connect to Space-Track.org API.
    For demo, returns simulated but realistic TLE data.
    
    Satellite IDs:
    - 25544: ISS (ZARYA)
    - 25544: Tiangong
    - Various Starlink satellites
    """
    # Simulated TLE for ISS (would come from Space-Track in production)
    simulated_tle = {
        "25544": {
            "name": "ISS (ZARYA)",
            "line1": "1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9993",
            "line2": "2 25544  51.6400 208.9163 0006703  35.0822 325.0281 15.49894738437397",
        },
        "48274": {
            "name": "TIANGONG SPACE STATION",
            "line1": "1 48274U 21035A   24001.50000000  .00020000  00000-0  20000-4 0  9991",
            "line2": "2 48274  41.4700 120.0000 0001000   0.0000  90.0000 15.60000000000000",
        }
    }
    
    tle = simulated_tle.get(satellite_id)
    if tle:
        return {
            "source": "NORAD-Simulated",
            "satellite_id": satellite_id,
            "satellite_name": tle["name"],
            "tle_line1": tle["line1"],
            "tle_line2": tle["line2"],
            "epoch": datetime.now().isoformat(),
        }
    return None


def calculate_orbital_position(tle_line1: str, tle_line2: str, timestamp: datetime) -> Dict[str, Any]:
    """
    Calculate orbital position from TLE elements.
    
    This is a simplified calculation - production would use proper
    SGP4 propagation from libraries like skyfield or pyorbital.
    """
    # Simplified orbital calculation
    # In production, use: from pyorbital.orbital import Orbital
    
    try:
        # Parse inclination from TLE line 2
        inclination = float(tle_line2[8:16])
        raan = float(tle_line2[17:25])  # Right Ascension of Ascending Node
        eccentricity = float("0." + tle_line2[26:33])
        argument_of_perigee = float(tle_line2[33:41])
        mean_anomaly = float(tle_line2[43:51])
        mean_motion = float(tle_line2[52:63])  # Revolutions per day
        
        # Calculate position (simplified)
        period_minutes = 1440 / mean_motion
        current_mean_anomaly = mean_anomaly + (2 * math.pi * (timestamp.minute / period_minutes))
        
        return {
            "inclination_deg": inclination,
            "raan_deg": raan,
            "period_minutes": period_minutes,
            "altitude_km": 400,  # Typical LEO
            "velocity_km_s": 7.66,  # Typical LEO velocity
        }
    except Exception as e:
        return {"error": str(e)}


# ============================================================================
# Starlink Telemetry Connector
# ============================================================================

def generate_starlink_telemetry(starlink_id: str = "starlink-1000") -> Dict[str, Any]:
    """
    Generate simulated Starlink satellite telemetry.
    
    In production, this would connect to actual Starlink APIs or
    aggregate data from various space situational awareness sources.
    """
    return {
        "source": "Starlink-Simulated",
        "satellite_id": starlink_id,
        "timestamp": datetime.now().isoformat(),
        "altitude_km": random.uniform(340, 360),
        "velocity_km_s": random.uniform(7.6, 7.7),
        "latitude": random.uniform(-60, 60),
        "longitude": random.uniform(-180, 180),
        "solar_panel_power_w": random.uniform(10000, 15000),
        "battery_charge_percent": random.uniform(70, 100),
        "thrust_status": random.choice(["nominal", "station_keeping", "collision_avoidance"]),
        "communication_status": random.choice(["connected", "handshake", "degraded"]),
    }


def generate_constellation_status() -> Dict[str, Any]:
    """
    Generate overview of Starlink constellation status.
    """
    total_active = random.randint(4000, 5500)
    return {
        "source": "Starlink-Constellation",
        "timestamp": datetime.now().isoformat(),
        "total_active_satellites": total_active,
        "deorbiting": random.randint(0, 50),
        "operational": total_active - random.randint(50, 200),
        "communicating": int(total_active * random.uniform(0.85, 0.95)),
    }


# ============================================================================
# Haven-1 / Axiom Simulated Telemetry
# ============================================================================

def generate_haven1_telemetry() -> Dict[str, Any]:
    """
    Generate Haven-1 (Vast) simulated telemetry.
    
    Haven-1 is planned as the first commercial space station module.
    This simulates expected telemetry based on station design.
    """
    return {
        "source": "Haven-1-Simulated",
        "station_type": "haven-1",
        "timestamp": datetime.now().isoformat(),
        
        # Power systems
        "power_kw": round(random.uniform(8.0, 12.0), 1),
        "solar_array_angle": random.randint(0, 360),
        "battery_charge_percent": random.randint(60, 100),
        
        # Thermal
        "temp_c": round(random.uniform(18, 26), 1),
        "radiator_temp_c": round(random.uniform(40, 55), 1),
        "thermal_control_status": "nominal",
        
        # Life support
        "pressure_kpa": round(random.uniform(99, 101), 1),
        "oxygen_percent": round(random.uniform(95, 100), 1),
        "co2_level_mmhg": round(random.uniform(1, 4), 1),
        "cabin_humidity_percent": round(random.uniform(30, 50), 1),
        
        # Attitude
        "attitude_error_deg": round(random.uniform(0, 1.5), 2),
        "angular_velocity_deg_s": round(random.uniform(-0.1, 0.1), 3),
        "altitude_km": round(random.uniform(395, 410), 1),
        
        # Communications
        "comm_status": random.choice(["nominal", "nominal", "nominal", "degraded"]),
        "downlink_rate_mbps": round(random.uniform(10, 100), 1),
        
        # Status
        "crew_count": random.randint(0, 4),
        "docking_ports_available": 2,
        "modules_connected": random.randint(1, 2),
    }


def generate_axiom_telemetry() -> Dict[str, Any]:
    """
    Generate Axiom Station simulated telemetry.
    
    Axiom Space is developing commercial space station modules
    that will attach to the ISS and eventually form a free-flying station.
    """
    return {
        "source": "Axiom-Simulated",
        "station_type": "axiom",
        "timestamp": datetime.now().isoformat(),
        
        # Power systems (Axiom modules have high power allocation)
        "power_kw": round(random.uniform(10.0, 15.0), 1),
        "solar_array_angle": random.randint(0, 360),
        "battery_charge_percent": random.randint(65, 100),
        
        # Thermal
        "temp_c": round(random.uniform(19, 27), 1),
        "radiator_temp_c": round(random.uniform(42, 58), 1),
        "thermal_control_status": "nominal",
        
        # Life support
        "pressure_kpa": round(random.uniform(99.5, 101.5), 1),
        "oxygen_percent": round(random.uniform(95, 100), 1),
        "co2_level_mmhg": round(random.uniform(0.5, 3.5), 1),
        "cabin_humidity_percent": round(random.uniform(28, 48), 1),
        
        # Attitude
        "attitude_error_deg": round(random.uniform(0, 1.2), 2),
        "angular_velocity_deg_s": round(random.uniform(-0.08, 0.08), 3),
        "altitude_km": round(random.uniform(400, 420), 1),
        
        # Communications
        "comm_status": random.choice(["nominal", "nominal", "nominal", "high_gain"]),
        "downlink_rate_mbps": round(random.uniform(25, 150), 1),
        
        # Status
        "crew_count": random.randint(0, 6),
        "docking_ports_available": 3,
        "modules_connected": random.randint(1, 4),
    }


# ============================================================================
# Unified Telemetry Aggregator
# ============================================================================

class TelemetryAggregator:
    """
    Aggregates telemetry from multiple sources.
    Supports both real APIs and simulated data.
    """
    
    def __init__(self):
        self.sources = {
            "iss": fetch_iss_position,
            "norad": get_norad_elements,
            "starlink": generate_starlink_telemetry,
            "starlink_constellation": generate_constellation_status,
            "haven-1": generate_haven1_telemetry,
            "axiom": generate_axiom_telemetry,
        }
    
    async def fetch_all(self, sources: list = None) -> Dict[str, Any]:
        """
        Fetch telemetry from multiple sources.
        
        Args:
            sources: List of source names to fetch. If None, fetches all.
            
        Returns:
            Combined telemetry data from all sources
        """
        import asyncio
        
        if sources is None:
            sources = list(self.sources.keys())
        
        results = {}
        
        for source in sources:
            if source == "iss":
                # ISS requires async fetch
                try:
                    iss_data = await fetch_iss_position()
                    if iss_data:
                        results["iss"] = iss_data
                except Exception as e:
                    results["iss"] = {"error": str(e)}
            elif source == "norad":
                try:
                    norad_data = get_norad_elements()
                    if norad_data:
                        results["norad"] = norad_data
                except Exception as e:
                    results["norad"] = {"error": str(e)}
            else:
                # Synchronous generators
                try:
                    results[source] = self.sources[source]()
                except Exception as e:
                    results[source] = {"error": str(e)}
        
        return results
    
    def get_source_status(self) -> Dict[str, str]:
        """Get status of all telemetry sources."""
        return {
            source: "available" for source in self.sources.keys()
        }


# ============================================================================
# Helper Functions
# ============================================================================

def generate_unified_telemetry(
    station_type: str = "generic",
    include_external: bool = True,
    anomaly_probability: float = 0.2
) -> Dict[str, Any]:
    """
    Generate unified telemetry combining station-specific and external data.
    
    Args:
        station_type: Type of station (haven-1, axiom, iss, starlab, generic)
        include_external: Whether to include external data (ISS position, etc.)
        anomaly_probability: Probability of injecting anomalies
        
    Returns:
        Complete telemetry data
    """
    # Generate base station telemetry
    if station_type == "haven-1":
        base_telemetry = generate_haven1_telemetry()
    elif station_type == "axiom":
        base_telemetry = generate_axiom_telemetry()
    elif station_type == "starlink":
        base_telemetry = generate_starlink_telemetry()
    else:
        # Use the existing telemetry generator from telemetry.py
        from telemetry import generate_telemetry
        base_telemetry = generate_telemetry(station_type, include_anomaly=(random.random() < anomaly_probability))
    
    # Add external data if requested
    if include_external:
        # Get ISS position (real data)
        try:
            import requests
            resp = requests.get("http://api.open-notify.org/iss-now.json", timeout=3)
            if resp.status_code == 200:
                iss_data = resp.json()
                base_telemetry["external_data"] = {
                    "iss_position": {
                        "latitude": float(iss_data["iss_position"]["latitude"]),
                        "longitude": float(iss_data["iss_position"]["longitude"]),
                    },
                    "timestamp": iss_data.get("timestamp"),
                }
        except Exception:
            pass  # Silently skip if external data unavailable
        
        # Add NORAD elements
        norad_data = get_norad_elements()
        if norad_data:
            base_telemetry["norad_elements"] = norad_data
    
    return base_telemetry

