"""
Action Executor Node
Executes approved actions on the space station or logs them for ground crew.
"""

import json
from typing import Dict, Any, List
from datetime import datetime


# Action types and their corresponding station APIs/commands
ACTION_MAPPINGS = {
    "thermal_control": {
        "adjust_cooling": "thermal_control.set_cooling_level",
        "activate_heating": "thermal_control.set_heating_level",
        "emergency_cooling": "thermal_control.emergency_cooling"
    },
    "power": {
        "power_conservation": "power.set_mode(conservation)",
        "activate_solar": "power.maximize_solar",
        "battery_backup": "power.enable_backup"
    },
    "attitude": {
        "reaction_wheel": "attitude.reaction_wheel_correction",
        "thruster_adjust": "attitude.thruster_correction",
        "safe_mode": "attitude.enter_safe_mode"
    },
    "life_support": {
        "oxygen_generation": "life_support.oxygen_generator_on",
        "co2_scrubber": "life_support.co2_scrubber_on",
        "ventilation": "life_support.adjust_ventilation"
    },
    "communication": {
        "switch_array": "comm.switch_array(backup)",
        "increase_gain": "comm.increase_gain",
        "emergency_beacon": "comm.emergency_beacon_on"
    },
    "general": {
        "continue_nominal": None,  # No action needed
        "monitor": None,  # Continue monitoring
        "alert_crew": "crew.alert()"
    }
}


def execute_action(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Execute the approved action.
    
    If human approval is granted (or auto-approved), this node:
    1. Logs the action to the execution history
    2. Executes via station APIs (simulated or real)
    3. Updates mission state
    
    Args:
        state: Current agent state with human_approval and proposed_action
        
    Returns:
        Updated state with execution results
    """
    human_approval = state.get("human_approval")
    proposed_action = state.get("proposed_action")
    modification = state.get("human_modification")
    auto_approved = state.get("auto_approved", False)
    
    # If not approved, skip execution
    if not human_approved:
        print("⏭️ Action not approved - skipping execution")
        return {
            "mission_phase": "skipped",
            "last_updated": datetime.now().isoformat()
        }
    
    # Determine the final action (original or modified)
    final_action = modification if modification else proposed_action
    
    if not final_action or final_action == "none":
        print("✅ No action to execute - continuing nominal operations")
        return {
            "mission_phase": "completed",
            "execution_log": state.get("execution_log", []) + [{
                "timestamp": datetime.now().isoformat(),
                "action": "none",
                "status": "completed",
                "result": "No action required"
            }],
            "last_updated": datetime.now().isoformat()
        }
    
    # Log the action
    execution_entry = {
        "timestamp": datetime.now().isoformat(),
        "original_action": proposed_action,
        "final_action": final_action,
        "auto_approved": auto_approved,
        "human_modification": modification is not None,
        "status": "executing",
        "result": None
    }
    
    print(f"⚡ EXECUTING: {final_action}")
    
    # Execute the action (simulated - replace with real API calls)
    result = _execute_station_command(final_action)
    
    execution_entry["status"] = "completed" if result["success"] else "failed"
    execution_entry["result"] = result
    
    # Update execution log
    execution_log = state.get("execution_log", [])
    execution_log.append(execution_entry)
    
    return {
        "mission_phase": "completed",
        "execution_log": execution_log,
        "last_updated": datetime.now().isoformat()
    }


def _execute_station_command(action: str) -> Dict[str, Any]:
    """
    Execute a command on the space station.
    
    In production, this would call real station APIs.
    For now, it simulates the execution.
    
    Args:
        action: The action string to execute
        
    Returns:
        Result dictionary with success status and details
    """
    # Simulate API call delay
    import time
    time.sleep(0.1)
    
    # Parse action type and map to station command
    action_lower = action.lower()
    
    # Check for each category
    for category, commands in ACTION_MAPPINGS.items():
        for key, command in commands.items():
            if key in action_lower:
                return {
                    "success": True,
                    "command": command,
                    "category": category,
                    "message": f"Command '{command}' executed successfully",
                    "simulated": True
                }
    
    # Default: log as general action
    return {
        "success": True,
        "command": action,
        "category": "general",
        "message": f"Action '{action}' logged for ground crew review",
        "simulated": True
    }


def create_execution_report(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a summary report of the execution cycle.
    
    Args:
        state: Current agent state
        
    Returns:
        Report dictionary
    """
    execution_log = state.get("execution_log", [])
    last_execution = execution_log[-1] if execution_log else None
    
    return {
        "mission_id": state.get("mission_id", "unknown"),
        "station_type": state.get("station_type", "generic"),
        "cycle_summary": {
            "telemetry_ingested": bool(state.get("telemetry")),
            "anomaly_detected": state.get("anomaly") != "none",
            "action_proposed": state.get("proposed_action") != "none",
            "human_approved": state.get("human_approval", False),
            "action_executed": state.get("mission_phase") == "completed"
        },
        "last_execution": last_execution,
        "total_executions": len(execution_log),
        "timestamp": datetime.now().isoformat()
    }
