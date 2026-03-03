"""
Demo: Multi-Agent Negotiation, Policy Enforcement, Distributed Node, Incentives, and Immune System
"""
from orchestration.intelligence_kernel import IntelligenceKernel
from orchestration.cluster_manager import ClusterManager
from orchestration.defensive_immune_system import DefensiveImmuneSystem
from orchestration.qubitcoin_engine import QubitCoinEngine
from orchestration.universal_adapter_registry import UniversalAdapterRegistry
from orchestration.root_owner_console import RootOwnerConsole
import time

# Initialize kernel and modules
kernel = IntelligenceKernel()
kernel.set_root_owner("root")
cluster = ClusterManager()
immune = DefensiveImmuneSystem(kernel)
econ = QubitCoinEngine(kernel)
adapters = UniversalAdapterRegistry(kernel)
console = RootOwnerConsole(kernel)

# Register agents/tools
class DemoAgent: name = "Claude"
class DemoTool: name = "3CX"
kernel.register_agent(DemoAgent())
kernel.register_tool(DemoTool())

# Distributed node registration
node_id = cluster.register_node("llm", "127.0.0.1")
cluster.heartbeat(node_id)

# Economic incentive
econ.reward("Claude", 10, reason="completed workflow")

# Policy enforcement
kernel.enforce_policy({"rule": "No external calls in blackout mode"})

# Threat detection
immune.monitor_agent("Claude", {"action": "suspicious"})

# Root-owner override
console.override("kill", "Claude")

# Adapter auto-discovery (stub)
adapters.scan_and_register("./adapters")

# Print kernel state and audit log
def print_state():
    print("KERNEL STATE:", kernel.state)
    print("AUDIT LOG:", kernel.audit_log())

if __name__ == "__main__":
    print_state()
