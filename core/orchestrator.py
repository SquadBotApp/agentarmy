from agentarmy.core.recursive_engine import RecursiveEngine
from agentarmy.core.planner import Planner
from agentarmy.core.cpm import CPMEngine
from agentarmy.core.router import Router
from agentarmy.core.providers.openai_provider import OpenAIProvider
from agentarmy.core.providers.claude_provider import ClaudeProvider
from agentarmy.core.providers.router import ProviderRouter, RouterConfig
from agentarmy.expansion.orders import Orders
from agentarmy.expansion.universes import Universes
from agentarmy.expansion.meta_synthesizer import MetaSynthesizer
from agentarmy.optimization.zpe import ZPEngine
from agentarmy.optimization.mobius import MobiusEngine
from agentarmy.core.governance import Governance

class Orchestrator:
    def __init__(self):
        self.planner = Planner()
        self.cpm = CPMEngine()
        self.router = Router()
        # ProviderRouter with OpenAI and Claude
        self.provider_router = ProviderRouter(
            providers=[OpenAIProvider(), ClaudeProvider()],
            config=RouterConfig()
        )
        self.orders = Orders()
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
            # Use the recursive engine for each task
            if isinstance(task, dict) and 'prompt' in task:
                result = self.recursive_engine.run(task, context={})
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
