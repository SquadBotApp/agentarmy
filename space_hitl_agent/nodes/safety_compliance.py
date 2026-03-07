"""
Safety & Compliance Layer
Implements mission-grade safety features:
- No-go zones (hard limits that cannot be overridden)
- Action cooldowns (prevent rapid repeated actions)
- Two-person approval for life-support actions
- Action whitelisting
- Enhanced audit logs
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum
import json


# ============================================================================
# No-Go Zones (Hard Limits - Cannot Be Overridden)
# ============================================================================

class NoGoZoneType(Enum):
    """Types of no-go zones."""
    HARD_LIMIT = "hard_limit"  # Absolute limits, cannot be bypassed
    CRITICAL_SYSTEM = "critical_system"  # Critical system protection
    EMERGENCY = "emergency"  # Emergency protocols


# No-go zones define absolute limits that cannot be bypassed
NO_GO_ZONES = {
    # Life Support - Absolute limits
    "oxygen_critical": {
        "type": NoGoZoneType.HARD_LIMIT,
        "threshold": 80.0,  # % - below this is immediate emergency
        "action_blocked": "Any non-emergency action",
        "required_action": "Emergency O2 protocol",
    },
    "pressure_critical": {
        "type": NoGoZoneType.HARD_LIMIT,
        "threshold": 93.0,  # kPa - below this is immediate danger
        "action_blocked": "Any non-emergency action",
        "required_action": "Emergency pressure restoration",
    },
    "co2_critical": {
        "type": NoGoZoneType.HARD_LIMIT,
        "threshold": 10.0,  # mmHg - above this is immediate danger
        "action_blocked": "Any non-emergency action",
        "required_action": "Emergency CO2 scrubber activation",
    },
    
    # Power - Absolute limits
    "power_critical": {
        "type": NoGoZoneType.HARD_LIMIT,
        "threshold": 2.0,  # kW - below this is survival mode
        "action_blocked": "Any non-essential action",
        "required_action": "Emergency power conservation",
    },
    "battery_critical": {
        "type": NoGoZoneType.HARD_LIMIT,
        "threshold": 15.0,  # % - below this is battery failure imminent
        "action_blocked": "Any non-essential action",
        "required_action": "Emergency power management",
    },
    
    # Thermal - Absolute limits
    "temp_critical_low": {
        "type": NoGoZoneType.HARD_LIMIT,
        "threshold": 10.0,  # °C - hypothermia danger
        "action_blocked": "Any non-emergency action",
        "required_action": "Emergency heating",
    },
    "temp_critical_high": {
        "type": NoGoZoneType.HARD_LIMIT,
        "threshold": 40.0,  # °C - heat stroke danger
        "action_blocked": "Any non-emergency action",
        "required_action": "Emergency cooling",
    },
    
    # Altitude - Absolute limits (re-entry danger)
    "altitude_critical": {
        "type": NoGoZoneType.HARD_LIMIT,
        "threshold": 280.0,  # km - below this is re-entry
        "action_blocked": "Any non-reboost action",
        "required_action": "Immediate re-boost",
    },
}


# ============================================================================
# Action Whitelist (Approved Actions Only)
# ============================================================================

# Whitelisted actions that can be executed
ACTION_WHITELIST = {
    # Thermal control
    "adjust_thermal": ["thermal_control.set_temperature", "thermal_control.adjust_radiator"],
    "emergency_cooling": ["thermal_control.emergency_cooling", "thermal_control.max_cooling"],
    "emergency_heating": ["thermal_control.emergency_heating", "thermal_control.max_heating"],
    
    # Power
    "power_conservation": ["power.set_mode(conservation)", "power.reduce_load"],
    "power_restore": ["power.enable_backup", "power.maximize_solar"],
    
    # Life support
    "oxygen_control": ["life_support.oxygen_generator_on", "life_support.emergency_o2"],
    "co2_control": ["life_support.co2_scrubber_on", "life_support.emergency_ventilation"],
    "pressure_control": ["life_support.pressure_regulation", "life_support.module_seal"],
    
    # Attitude
    "attitude_control": ["attitude.reaction_wheel_correction", "attitude.thruster_correction"],
    "safe_mode": ["attitude.enter_safe_mode", "attitude.emergency_stop"],
    
    # Communication
    "comm_control": ["comm.switch_array", "comm.increase_gain", "comm.emergency_beacon"],
    
    # Docking
    "docking_approach": ["docking.initiate_approach", "docking.abort_approach"],
    "docking_final": ["docking.initiate_docking", "docking.release"],
}


# ============================================================================
# Critical Action Cooldowns
# ============================================================================

ACTION_COOLDOWNS = {
    # Seconds between critical actions
    "thruster_fire": 30,  # Reaction wheel adjustments
    "thermal_mode_change": 60,  # Thermal system changes
    "power_mode_change": 120,  # Power system changes
    "life_support_change": 300,  # Life support changes (5 min)
    "docking_maneuver": 600,  # Docking operations (10 min)
    "safe_mode_entry": 1800,  # Safe mode (30 min)
    "emergency_protocol": 0,  # No cooldown for emergencies
}


# ============================================================================
# Two-Person Approval Requirements
# ============================================================================

# Actions requiring two-person approval
TWO_PERSON_APPROVAL_ACTIONS = {
    # Life support critical
    "life_support.emergency_o2": True,
    "life_support.emergency_ventilation": True,
    "life_support.module_seal": True,
    
    # Emergency protocols
    "emergency.protocol": True,
    "emergency.evacuation": True,
    "emergency.abort": True,
    
    # Docking
    "docking.initiate_docking": True,
    "docking.release": True,
    
    # Safe mode
    "attitude.enter_safe_mode": True,
    
    # Power
    "power.emergency_shutdown": True,
}


# ============================================================================
# Audit Log Management
# ============================================================================

class AuditLog:
    """
    Comprehensive audit logging for all decisions and actions.
    Required for insurance and regulatory compliance.
    """
    
    def __init__(self):
        self.logs: List[Dict[str, Any]] = []
    
    def log_decision(
        self,
        decision_type: str,
        details: Dict[str, Any],
        agent_id: str = "system",
        severity: str = "info"
    ):
        """Log a decision made by the system."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "decision",
            "decision_type": decision_type,
            "agent_id": agent_id,
            "severity": severity,
            "details": details,
            "trace_id": self._generate_trace_id(),
        }
        self.logs.append(entry)
        return entry
    
    def log_approval(
        self,
        action: str,
        approver: str,
        approved: bool,
        reason: str = "",
        second_approver: str = None
    ):
        """Log a human approval action."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "approval",
            "action": action,
            "approver": approver,
            "second_approver": second_approver,
            "approved": approved,
            "reason": reason,
            "trace_id": self._generate_trace_id(),
        }
        self.logs.append(entry)
        return entry
    
    def log_action_execution(
        self,
        action: str,
        result: str,
        details: Dict[str, Any]
    ):
        """Log action execution."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "execution",
            "action": action,
            "result": result,
            "details": details,
            "trace_id": self._generate_trace_id(),
        }
        self.logs.append(entry)
        return entry
    
    def log_anomaly(
        self,
        anomaly_type: str,
        severity: str,
        details: Dict[str, Any]
    ):
        """Log anomaly detection."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "anomaly",
            "anomaly_type": anomaly_type,
            "severity": severity,
            "details": details,
            "trace_id": self._generate_trace_id(),
        }
        self.logs.append(entry)
        return entry
    
    def log_safety_intervention(
        self,
        intervention_type: str,
        reason: str,
        blocked_action: str = None
    ):
        """Log safety system interventions."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "safety_intervention",
            "intervention_type": intervention_type,
            "reason": reason,
            "blocked_action": blocked_action,
            "trace_id": self._generate_trace_id(),
        }
        self.logs.append(entry)
        return entry
    
    def _generate_trace_id(self) -> str:
        """Generate unique trace ID for tracking."""
        return f"trace-{datetime.now().strftime('%Y%m%d%H%M%S')}-{len(self.logs):06d}"
    
    def get_logs(
        self,
        log_type: str = None,
        start_time: datetime = None,
        end_time: datetime = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Query logs with filters."""
        filtered = self.logs
        
        if log_type:
            filtered = [l for l in filtered if l.get("type") == log_type]
        
        if start_time:
            filtered = [l for l in filtered if datetime.fromisoformat(l["timestamp"]) >= start_time]
        
        if end_time:
            filtered = [l for l in filtered if datetime.fromisoformat(l["timestamp"]) <= end_time]
        
        return filtered[-limit:]
    
    def export_logs(self, filepath: str):
        """Export logs to file."""
        with open(filepath, 'w') as f:
            json.dump(self.logs, f, indent=2)


# Global audit log instance
_audit_log = AuditLog()


def get_audit_log() -> AuditLog:
    """Get the global audit log instance."""
    return _audit_log


# ============================================================================
# Safety Compliance Node
# ============================================================================

class SafetyComplianceState:
    """Tracks safety compliance state across cycles."""
    
    def __init__(self):
        self.last_action_times: Dict[str, datetime] = {}
        self.pending_two_person_approvals: Dict[str, Dict[str, Any]] = {}
        self.no_go_zone_triggers: List[str] = []
    
    def check_cooldown(self, action_category: str) -> bool:
        """Check if action is still in cooldown period."""
        if action_category not in ACTION_COOLDOWNS:
            return True
        
        cooldown_seconds = ACTION_COOLDOWNS[action_category]
        if cooldown_seconds == 0:
            return True  # No cooldown (e.g., emergencies)
        
        last_time = self.last_action_times.get(action_category)
        if not last_time:
            return True
        
        elapsed = (datetime.now() - last_time).total_seconds()
        return elapsed >= cooldown_seconds
    
    def record_action(self, action_category: str):
        """Record that an action was executed."""
        self.last_action_times[action_category] = datetime.now()
    
    def requires_two_person_approval(self, action: str) -> bool:
        """Check if action requires two-person approval."""
        return action in TWO_PERSON_APPROVAL_ACTIONS


# Global safety state
_safety_state = SafetyComplianceState()


def get_safety_state() -> SafetyComplianceState:
    """Get the global safety state instance."""
    return _safety_state


# ============================================================================
# Main Safety Compliance Functions
# ============================================================================

def check_no_go_zones(telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check if any telemetry values are in no-go zones.
    
    Returns:
        Dict with no-go zone status and required actions
    """
    triggered_zones = []
    blocked = False
    required_action = None
    
    # Check each no-go zone
    for zone_name, zone_config in NO_GO_ZONES.items():
        threshold = zone_config["threshold"]
        value = None
        
        # Get the appropriate telemetry value
        if zone_name == "oxygen_critical":
            value = telemetry.get("oxygen_percent", 100)
        elif zone_name == "pressure_critical":
            value = telemetry.get("pressure_kpa", 101)
        elif zone_name == "co2_critical":
            value = telemetry.get("co2_level_mmhg", 0)
        elif zone_name == "power_critical":
            value = telemetry.get("power_kw", 10)
        elif zone_name == "battery_critical":
            value = telemetry.get("battery_charge_percent", 100)
        elif zone_name == "temp_critical_low":
            value = telemetry.get("temp_c", 22)
        elif zone_name == "temp_critical_high":
            value = telemetry.get("temp_c", 22)
        elif zone_name == "altitude_critical":
            value = telemetry.get("altitude_km", 400)
        
        if value is not None:
            # Check if in no-go zone (for limits, lower is worse for most)
            in_zone = False
            if zone_name in ["oxygen_critical", "pressure_critical", "power_critical", "battery_critical", "temp_critical_low"]:
                in_zone = value < threshold
            else:
                in_zone = value > threshold
            
            if in_zone:
                triggered_zones.append({
                    "zone": zone_name,
                    "value": value,
                    "threshold": threshold,
                    "required_action": zone_config["required_action"],
                    "action_blocked": zone_config["action_blocked"],
                })
                blocked = True
                required_action = zone_config["required_action"]
    
    return {
        "no_go_zones_triggered": triggered_zones,
        "actions_blocked": blocked,
        "required_action": required_action,
    }


def validate_action(action: str, telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate if an action can be executed.
    
    Checks:
    1. No-go zones
    2. Action whitelist
    3. Cooldowns
    
    Returns:
        Validation result with status and reason
    """
    audit_log = get_audit_log()
    safety_state = get_safety_state()
    
    # Check no-go zones first
    no_go_result = check_no_go_zones(telemetry)
    if no_go_result["actions_blocked"]:
        audit_log.log_safety_intervention(
            intervention_type="no_go_zone",
            reason=f"No-go zone triggered: {no_go_result['required_action']}",
            blocked_action=action
        )
        return {
            "approved": False,
            "reason": f"NO-GO: {no_go_result['required_action']}",
            "requires_emergency_protocol": True,
        }
    
    # Check action whitelist
    action_allowed = False
    for category, allowed_actions in ACTION_WHITELIST.items():
        if any(allowed in action.lower() for allowed in allowed_actions):
            action_allowed = True
            break
    
    if not action_allowed:
        # Check if it's a generic/nominal action (always allowed)
        if action.lower() in ["continue nominal operations", "continue monitoring", "none"]:
            action_allowed = True
        else:
            audit_log.log_safety_intervention(
                intervention_type="whitelist",
                reason="Action not in whitelist",
                blocked_action=action
            )
            return {
                "approved": False,
                "reason": "Action not whitelisted",
            }
    
    # Check cooldowns
    action_category = _categorize_action(action)
    if not safety_state.check_cooldown(action_category):
        audit_log.log_safety_intervention(
            intervention_type="cooldown",
            reason=f"Action {action} in cooldown period",
            blocked_action=action
        )
        return {
            "approved": False,
            "reason": f"Action in cooldown - wait before retrying",
            "cooldown_category": action_category,
        }
    
    # Check two-person approval requirement
    requires_two_person = safety_state.requires_two_person_approval(action)
    
    return {
        "approved": True,
        "requires_two_person_approval": requires_two_person,
        "action_category": action_category,
    }


def _categorize_action(action: str) -> str:
    """Categorize action for cooldown checking."""
    action_lower = action.lower()
    
    if "thruster" in action_lower or "attitude" in action_lower:
        return "thruster_fire"
    elif "thermal" in action_lower:
        return "thermal_mode_change"
    elif "power" in action_lower:
        return "power_mode_change"
    elif "oxygen" in action_lower or "co2" in action_lower or "life support" in action_lower:
        return "life_support_change"
    elif "dock" in action_lower:
        return "docking_maneuver"
    elif "safe mode" in action_lower:
        return "safe_mode_entry"
    elif "emergency" in action_lower:
        return "emergency_protocol"
    
    return "general"


def request_two_person_approval(action: str) -> Dict[str, Any]:
    """
    Request two-person approval for critical action.
    
    Returns:
        Approval request details
    """
    safety_state = get_safety_state()
    approval_id = f"approval-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    safety_state.pending_two_person_approvals[approval_id] = {
        "action": action,
        "requested_at": datetime.now(),
        "first_approver": None,
        "second_approver": None,
        "status": "pending",
    }
    
    return {
        "approval_id": approval_id,
        "action": action,
        "status": "pending",
        "message": f"Two-person approval required for: {action}",
    }

