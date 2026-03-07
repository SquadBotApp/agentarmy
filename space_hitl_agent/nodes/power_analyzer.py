"""
Power Analyzer Node
Analyzes power and energy telemetry for commercial space stations.
"""

def power_analyze(state: dict) -> dict:
    telemetry = state.get("telemetry", {})
    power = telemetry.get("power_kw", 10)
    battery = telemetry.get("battery_charge_percent", 100)
    result = {
        "power_anomaly": False,
        "power_action": "none",
        "power_severity": "nominal",
        "power_rationale": "Power levels nominal."
    }
    if power < 5 or battery < 30:
        result.update({
            "power_anomaly": True,
            "power_action": "Activate power conservation mode, prepare for emergency",
            "power_severity": "critical",
            "power_rationale": f"Power {power}kW, battery {battery}%: critical."
        })
    elif power < 8 or battery < 50:
        result.update({
            "power_anomaly": True,
            "power_action": "Reduce non-essential loads",
            "power_severity": "warning",
            "power_rationale": f"Power {power}kW, battery {battery}%: warning."
        })
    return result
