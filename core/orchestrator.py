from agentarmy.core.recursive_engine import RecursiveEngine
from agentarmy.core.planner import Planner
from agentarmy.core.cpm import CPMEngine
from agentarmy.core.router import Router
from agentarmy.core.providers.openai_provider import OpenAIProvider
from agentarmy.core.providers.claude_provider import ClaudeProvider
from agentarmy.core.providers.router import ProviderRouter, RouterConfig
from agentarmy.core.tool_registry import ToolRegistry
from agentarmy.expansion.orders import Orders
from agentarmy.expansion.universes import Universes
from agentarmy.expansion.meta_synthesizer import MetaSynthesizer
from agentarmy.expansion.expansion_369 import Expansion369
from agentarmy.optimization.zpe import ZPEngine
from agentarmy.optimization.mobius import MobiusEngine
from agentarmy.core.governance import Governance

class Orchestrator:
    def __init__(self):
        self.planner = Planner()
        self.cpm = CPMEngine()
        self.router = Router()
        self.tool_registry = ToolRegistry()
        # ProviderRouter with OpenAI and Claude
        self.provider_router = ProviderRouter(
            providers=[OpenAIProvider(), ClaudeProvider()],
            config=RouterConfig()
        )
        self.orders = Orders()
        self.expansion = Expansion369()
        self.universes = Universes()
        self.meta_synth = MetaSynthesizer()
        self.zpe = ZPEngine()
        self.mobius = MobiusEngine()
        self.governance = Governance()
        self.recursive_engine = RecursiveEngine(self.provider_router)

    def run(self, input_data):
        # 1. Planning
        plan = self.planner.plan(input_data)
        if plan is None:
            plan = input_data if input_data else []
            
        # 2. CPM Analysis
        cpm_result = self.cpm.analyze(plan)
        
        # 3. Routing
        assignments = self.router.route(cpm_result)
        
        # 4. Provider Execution (all model/tool calls go through ProviderRouter)
        results = []
        for assign in assignments:
            task = assign['task']
            
            # Check for tools
            tool = self.tool_registry.best_tool()
            context = {"tool": tool}

            # Use the recursive engine for each task
            if isinstance(task, dict) and 'prompt' in task:
                # Expand task if needed (3-6-9)
                # For this demo, we just use the expansion logic on the list of tasks if it were a list
                # But here we are iterating. Let's say we expand the single task into subtasks.
                # This is a simplification for the wiring demo.
                expanded_tasks = self.expansion.expand([task])
                
                sub_results = []
                for sub_task in expanded_tasks:
                    sub_res = self.recursive_engine.run(sub_task, context=context)
                    sub_results.append(sub_res)
                
                result = {"task": task["id"], "sub_results": sub_results}
                results.append(result)
            else:
                results.append(f"No prompt for task: {task}")
                
        # 5. Synthesis (meta-synthesizer)
        synthesis = self.meta_synth.synthesize(results)
        
        # 6. Optimization (ZPE, Möbius)
        optimized = self.mobius.optimize(self.zpe.score(synthesis))
        
        # 7. Governance
        final = self.governance.enforce(optimized)
        return final
