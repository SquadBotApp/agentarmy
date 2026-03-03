import unittest
from orchestration.intelligence_kernel import IntelligenceKernel
from orchestration.cluster_manager import ClusterManager
from orchestration.defensive_immune_system import DefensiveImmuneSystem
from orchestration.qubitcoin_engine import QubitCoinEngine
from orchestration.universal_adapter_registry import UniversalAdapterRegistry
from orchestration.root_owner_console import RootOwnerConsole

class SovereignOSTest(unittest.TestCase):
    def setUp(self):
        self.kernel = IntelligenceKernel()
        self.kernel.set_root_owner("root")
        self.cluster = ClusterManager()
        self.immune = DefensiveImmuneSystem(self.kernel)
        self.econ = QubitCoinEngine(self.kernel)
        self.adapters = UniversalAdapterRegistry(self.kernel)
        self.console = RootOwnerConsole(self.kernel)
        class DemoAgent: name = "Claude"
        class DemoTool: name = "3CX"
        self.kernel.register_agent(DemoAgent())
        self.kernel.register_tool(DemoTool())

    def test_node_registration(self):
        node_id = self.cluster.register_node("llm", "127.0.0.1")
        self.assertIn(node_id, self.cluster.nodes)

    def test_incentive(self):
        self.econ.reward("Claude", 5)
        self.assertEqual(self.econ.get_balance("Claude"), 5)

    def test_policy_enforcement(self):
        self.kernel.enforce_policy({"rule": "No external calls"})
        self.assertTrue(any(p["rule"] == "No external calls" for p in self.kernel.state["policies"]))

    def test_threat_detection(self):
        self.immune.monitor_agent("Claude", {"action": "test"})
        # Can't assert threat due to randomness, but should not error

    def test_override(self):
        self.console.override("kill", "Claude")
        # Should emit event, not error

    def test_adapter_registry(self):
        # Should not error even if adapters dir is empty
        self.adapters.scan_and_register("./adapters")

if __name__ == "__main__":
    unittest.main()
