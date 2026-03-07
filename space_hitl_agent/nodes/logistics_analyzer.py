"""
Logistics Analyzer Node
Analyzes supply, inventory, and logistics telemetry for commercial space stations.
"""

def logistics_analyze(state: dict) -> dict:
    telemetry = state.get("telemetry", {})
    inventory = telemetry.get("inventory_status", "nominal")
    crew_count = telemetry.get("crew_count", 0)
    logistics_result = {
        "logistics_anomaly": False,
        "logistics_action": "none",
        "logistics_severity": "nominal",
        "logistics_rationale": "Inventory and logistics nominal."
    }
    if inventory != "nominal" or crew_count == 0:
        logistics_result.update({
            "logistics_anomaly": True,
            "logistics_action": "Schedule resupply, check inventory",
            "logistics_severity": "warning",
            "logistics_rationale": f"Inventory: {inventory}, Crew: {crew_count}"
        })
    return logistics_result
