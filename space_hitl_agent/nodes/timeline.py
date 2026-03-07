"""
Mission Timeline Awareness Module
Provides temporal reasoning for space station operations:
- Orbital day/night cycle calculation
- Communications windows
- Docking windows
- Crew scheduling integration
"""

import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta


# ============================================================================
# Orbital Day/Night Cycle
# ============================================================================

class OrbitalCalculator:
    """
    Calculates orbital parameters for LEO stations.
    """
    
    # Earth constants
    EARTH_RADIUS_KM = 6371.0
    STANDARD_GRAVITATIONAL_PARAMETER = 398600.4418  # km³/s²
    
    def __init__(self, altitude_km: float = 400.0, inclination_deg: float = 51.6):
        """
        Initialize orbital calculator.
        
        Args:
            altitude_km: Orbital altitude in km
            inclination_deg: Orbital inclination in degrees
        """
        self.altitude_km = altitude_km
        self.inclination_deg = inclination_deg
    
    def orbital_period_minutes(self) -> float:
        """Calculate orbital period in minutes."""
        orbital_radius = self.EARTH_RADIUS_KM + self.altitude_km
        period_seconds = 2 * math.pi * math.sqrt(
            (orbital_radius ** 3) / self.STANDARD_GRAVITATIONAL_PARAMETER
        )
        return period_seconds / 60.0
    
    def orbital_velocity_km_s(self) -> float:
        """Calculate orbital velocity in km/s."""
        orbital_radius = self.EARTH_RADIUS_KM + self.altitude_km
        return math.sqrt(self.STANDARD_GRAVITATIONAL_PARAMETER / orbital_radius)
    
    def eclipse_duration_minutes(self) -> float:
        """
        Calculate maximum eclipse duration (time in Earth's shadow).
        
        Approximation for circular orbit.
        """
        # Earth's shadow angular size from LEO
        earth_angle = 2 * math.asin(self.EARTH_RADIUS_KM / (self.EARTH_RADIUS_KM + self.altitude_km))
        
        # Time to traverse shadow (simplified)
        eclipse_fraction = earth_angle / (2 * math.pi)
        return self.orbital_period_minutes() * eclipse_fraction
    
    def calculate_day_night_cycle(
        self,
        current_time: datetime,
        longitude: float = 0.0
    ) -> Dict[str, Any]:
        """
        Calculate day/night status for current time and position.
        
        Args:
            current_time: Current UTC time
            longitude: Current longitude in degrees
            
        Returns:
            Day/night cycle information
        """
        # Simplified day/night calculation
        # In production, would use proper solar angle calculations
        
        # Hour angle (0 at noon, 180 at midnight)
        hour_angle = ((current_time.hour + current_time.minute / 60.0) - 12.0) * 15.0
        hour_angle += longitude  # Adjust for longitude
        
        # Sun elevation angle (simplified)
        # At noon (hour_angle = 0), sun is at maximum
        sun_elevation = 90.0 - abs(hour_angle)
        
        # Determine day/night/twilight
        if sun_elevation > 6.0:
            status = "day"
        elif sun_elevation > -6.0:
            status = "twilight"
        else:
            status = "night"
        
        # Time until next sunrise/sunset
        if status == "day":
            hours_to_sunset = (90.0 - hour_angle) / 15.0 if hour_angle < 90 else 0
            hours_to_sunrise = 24.0  # Already in day
        else:
            hours_to_sunrise = (90.0 + hour_angle) / 15.0 if hour_angle > -90 else 0
            hours_to_sunset = 24.0  # Already in night
        
        return {
            "status": status,
            "sun_elevation_deg": round(sun_elevation, 1),
            "hours_until_sunrise": round(hours_to_sunrise, 1),
            "hours_until_sunset": round(hours_to_sunset, 1),
            "orbital_period_minutes": round(self.orbital_period_minutes(), 1),
            "eclipse_duration_minutes": round(self.eclipse_duration_minutes(), 1),
        }


# ============================================================================
# Communications Windows
# ============================================================================

class CommsWindowCalculator:
    """
    Calculates communication windows with ground stations.
    """
    
    # Major ground stations
    GROUND_STATIONS = {
        "houston": {"lat": 29.7604, "lon": -95.3698, "name": "Johnson Space Center"},
        "moscow": {"lat": 55.7558, "lon": 37.6173, "name": "Moscow Mission Control"},
        "ESA": {"lat": 48.8584, "lon": 2.2945, "name": "ESA Darmstadt"},
        "japan": {"lat": 34.6525, "lon": 135.1583, "name": "JAXA Tsukuba"},
    }
    
    def __init__(self, altitude_km: float = 400.0):
        self.altitude_km = altitude_km
        self.orbital_calc = OrbitalCalculator(altitude_km)
    
    def calculate_visibility_window(
        self,
        station_name: str,
        current_time: datetime,
        station_lat: float,
        station_lon: float,
        elevation_min_deg: float = 5.0
    ) -> Dict[str, Any]:
        """
        Calculate next visibility window for a ground station.
        
        Args:
            station_name: Name of the ground station
            current_time: Current UTC time
            station_lat: Station latitude
            station_lon: Station longitude
            elevation_min_deg: Minimum elevation angle for contact
            
        Returns:
            Visibility window information
        """
        orbital_period = self.orbital_calc.orbital_period_minutes()
        
        # Simplified: estimate window based on orbital period and coverage
        # In production, would use proper visibility calculations
        
        # ISS typically has ~10 min visibility per pass
        avg_pass_duration = 10  # minutes
        
        # Calculate approximate time until next pass
        # This is a simplified estimation
        time_to_next_pass = orbital_period / 2  # Simplified
        
        next_pass_start = current_time + timedelta(minutes=time_to_next_pass)
        next_pass_end = next_pass_start + timedelta(minutes=avg_pass_duration)
        
        return {
            "station": station_name,
            "window_start": next_pass_start.isoformat(),
            "window_end": next_pass_end.isoformat(),
            "duration_minutes": avg_pass_duration,
            "max_elevation_deg": 45,  # Simplified
            "elevation_min_used": elevation_min_deg,
        }
    
    def calculate_all_windows(
        self,
        current_time: datetime,
        stations: List[str] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Calculate communication windows for all stations.
        
        Args:
            current_time: Current UTC time
            stations: List of station names (None = all)
            
        Returns:
            Dictionary of windows per station
        """
        if stations is None:
            stations = list(self.GROUND_STATIONS.keys())
        
        windows = {}
        for station_name in stations:
            if station_name in self.GROUND_STATIONS:
                station = self.GROUND_STATIONS[station_name]
                windows[station_name] = self.calculate_visibility_window(
                    station_name,
                    current_time,
                    station["lat"],
                    station["lon"]
                )
        
        return windows


# ============================================================================
# Docking Windows
# ============================================================================

class DockingWindowCalculator:
    """
    Calculates optimal docking windows.
    """
    
    def __init__(self):
        pass
    
    def calculate_docking_window(
        self,
        current_time: datetime,
        target_altitude_km: float = 400.0,
        inclination_diff_deg: float = 0.0,
        phasing_orbits: int = None
    ) -> Dict[str, Any]:
        """
        Calculate next docking opportunity.
        
        Args:
            current_time: Current UTC time
            target_altitude_km: Target orbital altitude
            inclination_diff_deg: Inclination difference
            phasing_orbits: Number of phasing orbits (optional)
            
        Returns:
            Docking window information
        """
        # Simplified docking window calculation
        # In production, would use full orbital mechanics
        
        orbital_period = OrbitalCalculator(target_altitude_km).orbital_period_minutes()
        
        if phasing_orbits:
            # Time to complete phasing orbits
            window_time = current_time + timedelta(minutes=orbital_period * phasing_orbits)
        else:
            # Next ascending node crossing
            window_time = current_time + timedelta(minutes=orbital_period / 2)
        
        return {
            "window_open": window_time.isoformat(),
            "duration_minutes": round(orbital_period * 0.3, 1),  # ~30% of orbit
            "target_altitude_km": target_altitude_km,
            "inclination_diff_deg": inclination_diff_deg,
            "type": "phased" if phasing_orbits else "plane_change",
        }
    
    def calculate_approach_phases(
        self,
        docking_time: datetime
    ) -> List[Dict[str, str]]:
        """
        Calculate phases leading up to docking.
        
        Args:
            docking_time: Planned docking time
            
        Returns:
            List of approach phases with times
        """
        phases = [
            {"phase": "far_field_approach", "distance": "100km", "time_before": "4 hours"},
            {"phase": "near_field_approach", "distance": "1km", "time_before": "30 minutes"},
            {"phase": "final_approach_initiation", "distance": "200m", "time_before": "10 minutes"},
            {"phase": "final_approach", "distance": "20m", "time_before": "5 minutes"},
            {"phase": "slow_approach", "distance": "5m", "time_before": "2 minutes"},
            {"phase": "capture", "distance": "0m", "time_before": "0 minutes"},
        ]
        
        # Calculate actual times
        result = []
        for phase in phases:
            time_before = phase["time_before"]
            if "hours" in time_before:
                hours = int(time_before.split()[0])
                phase_time = docking_time - timedelta(hours=hours)
            elif "minutes" in time_before:
                minutes = int(time_before.split()[0])
                phase_time = docking_time - timedelta(minutes=minutes)
            else:
                phase_time = docking_time
            
            result.append({
                "phase": phase["phase"],
                "distance": phase["distance"],
                "start_time": phase_time.isoformat(),
            })
        
        return result


# ============================================================================
# Mission Timeline
# ============================================================================

class MissionTimeline:
    """
    Manages mission timeline with events and schedules.
    """
    
    def __init__(self, mission_start: datetime):
        self.mission_start = mission_start
        self.events: List[Dict[str, Any]] = []
    
    def add_event(
        self,
        event_type: str,
        scheduled_time: datetime,
        duration_minutes: float = 0,
        priority: str = "normal",
        description: str = ""
    ):
        """Add an event to the timeline."""
        self.events.append({
            "type": event_type,
            "scheduled_time": scheduled_time,
            "duration_minutes": duration_minutes,
            "priority": priority,
            "description": description,
        })
    
    def get_upcoming_events(
        self,
        current_time: datetime,
        hours_ahead: float = 24.0
    ) -> List[Dict[str, Any]]:
        """Get upcoming events within time window."""
        end_time = current_time + timedelta(hours=hours_ahead)
        
        upcoming = [
            e for e in self.events
            if current_time <= e["scheduled_time"] <= end_time
        ]
        
        return sorted(upcoming, key=lambda x: x["scheduled_time"])
    
    def get_current_phase(self, current_time: datetime) -> str:
        """Determine current mission phase based on time and events."""
        # Find any active event
        for event in self.events:
            start = event["scheduled_time"]
            end = start + timedelta(minutes=event.get("duration_minutes", 0))
            
            if start <= current_time <= end:
                return f"{event['type']}: {event.get('description', '')}"
        
        # Default phases based on mission elapsed time
        mission_elapsed = current_time - self.mission_start
        hours_elapsed = mission_elapsed.total_seconds() / 3600
        
        if hours_elapsed < 1:
            return "initialization"
        elif hours_elapsed < 24:
            return "early_orbit"
        elif hours_elapsed < 168:  # ~7 days
            return "nominal_operations"
        else:
            return "extended_operations"


# ============================================================================
# Timeline Integration Node
# ============================================================================

def calculate_mission_timeline(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Calculate mission timeline information.
    
    Args:
        state: Current agent state
        
    Returns:
        Timeline information for the state
    """
    telemetry = state.get("telemetry", {})
    
    # Get current time
    current_time = datetime.now()
    
    # Get altitude (default to 400km if not available)
    altitude = telemetry.get("altitude_km", 400.0)
    
    # Get position
    longitude = telemetry.get("longitude", 0.0)
    latitude = telemetry.get("latitude", 0.0)
    
    # Calculate orbital parameters
    orbital = OrbitalCalculator(altitude)
    
    # Day/night cycle
    day_night = orbital.calculate_day_night_cycle(current_time, longitude)
    
    # Communication windows
    comms_calc = CommsWindowCalculator(altitude)
    comms_windows = comms_calc.calculate_all_windows(current_time)
    
    # Docking windows (if in docking mode)
    docking_info = {}
    if telemetry.get("docking_range_m") is not None:
        docking_calc = DockingWindowCalculator()
        docking_info = docking_calc.calculate_docking_window(current_time, altitude)
    
    # Mission timeline
    mission_start = state.get("mission_start_time", current_time - timedelta(hours=12))
    timeline = MissionTimeline(mission_start)
    current_phase = timeline.get_current_phase(current_time)
    
    return {
        "timeline": {
            "current_time": current_time.isoformat(),
            "mission_elapsed_hours": round((current_time - mission_start).total_seconds() / 3600, 1),
            "mission_phase": current_phase,
        },
        "orbital": {
            "altitude_km": altitude,
            "orbital_period_minutes": round(orbital.orbital_period_minutes(), 1),
            "eclipse_duration_minutes": round(orbital.eclipse_duration_minutes(), 1),
        },
        "day_night_cycle": day_night,
        "comms_windows": comms_windows,
        "docking_windows": docking_info,
    }

