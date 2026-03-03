"""
Universal Adapter Layer for AgentArmyOS
- Auto-discovers, sandboxes, governs, and optimizes any tool, API, binary, or model.
- Adapters are generated, registered, and managed as kernel modules.
"""

from typing import Dict, Any, Callable, List
import os
import importlib

class UniversalAdapterRegistry:
    def __init__(self, kernel):
        self.kernel = kernel
        self.adapters = {}
        self.listeners = []

    def scan_and_register(self, directory: str):
        # Scan for new tools/APIs/binaries and auto-generate adapters
        for fname in os.listdir(directory):
            if fname.endswith("_adapter.py") and fname not in self.adapters:
                module_name = fname[:-3]
                try:
                    module = importlib.import_module(f"orchestration.adapters.{module_name}")
                    adapter = getattr(module, module_name.title().replace('_', ''), None)
                    if adapter:
                        self.adapters[module_name] = adapter
                        self.kernel.register_tool(adapter)
                        self._emit_event({"type": "adapter_registered", "adapter": module_name})
                except Exception as e:
                    self._emit_event({"type": "adapter_error", "adapter": module_name, "error": str(e)})

    def add_listener(self, callback: Callable[[Dict[str, Any]], None]):
        self.listeners.append(callback)

    def _emit_event(self, event: Dict[str, Any]):
        for cb in self.listeners:
            cb(event)

# Example usage (to be replaced by API/dashboard integration)
if __name__ == "__main__":
    from intelligence_kernel import IntelligenceKernel
    kernel = IntelligenceKernel()
    kernel.set_root_owner("root")
    registry = UniversalAdapterRegistry(kernel)
    def print_event(event):
        print("EVENT:", event)
    registry.add_listener(print_event)
    registry.scan_and_register("./adapters")
