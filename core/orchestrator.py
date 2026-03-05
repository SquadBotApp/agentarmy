from core.recursive_engine import RecursiveEngine
from core.planner import Planner
from core.cpm import CPMEngine
from core.router import Router
from core.providers.openai_provider import OpenAIProvider
from core.providers.claude_provider import ClaudeProvider
from core.providers.router import ProviderRouter, RouterConfig
from core.tool_registry import ToolRegistry
from core.expansion.orders import Orders
from core.expansion.universes import Universes
from core.expansion.meta_synthesizer import MetaSynthesizer
from core.expansion.expansion_369 import Expansion369
from core.optimization.zpe import ZPEngine
from core.optimization.mobius import MobiusEngine
from core.governance import Governance
from core.thinking import get_thinking_core


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
        
        # Initialize the Thinking Core - the "blackbox AI brain"
        self.thinking = get_thinking_core()

    def run(self, input_data):
        # Prepare job dict for thinking core
        job = {"input_data": input_data}
        
        # 0. THINKING CORE: Get planning guidance
        plan_signals = self.thinking.advise_on_plan(job)
        
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
                # Get universe strategy from thinking core
                universe_signals = self.thinking.advise_on_universes(job)
                
                # Use thinking core to advise on routing
                task_for_routing = {"input_data": task.get("prompt", "")}
                provider_info = [
                    {"name": "openai", "latency_ms": 100, "cost": 0.01},
                    {"name": "claude", "latency_ms": 120, "cost": 0.015}
                ]
                routing_signals = self.thinking.advise_on_routing(task_for_routing, provider_info)
                
                expanded_tasks = self.expansion.expand([task])
                
                sub_results = []
                for sub_task in expanded_tasks:
                    sub_res = self.recursive_engine.run(sub_task, context=context)
                    sub_results.append(sub_res)
                
                result = {"task": task["id"], "sub_results": sub_results, "routing": routing_signals}
                results.append(result)
            else:
                results.append(f"No prompt for task: {task}")
                
        # 5. Synthesis (meta-synthesizer)
        synthesis = self.meta_synth.synthesize(results)
        
        # 6. Universe Collapse Evaluation
        universe_outputs = [{"output": str(s), "zpe_score": 0.7, "quality_score": 0.8} for s in results]
        collapse_signals = self.thinking.advise_on_collapse(universe_outputs)
        
        # 7. Optimization (ZPE, Möbius)
        optimized = self.mobius.optimize(self.zpe.score(synthesis))
        
        # 8. Governance
        final = self.governance.enforce(optimized)
        
        # 9. Learn from job outcome
        self.thinking.learn({
            "provider": routing_signals.preferred if hasattr(routing_signals, 'preferred') else "unknown",
            "success": True
        })
        
        return {
            "result": final,
            "thinking_signals": {
                "plan": {
                    "complexity": plan_signals.complexity.value,
                    "universe_count": plan_signals.universe_count,
                    "risk": plan_signals.risk.value,
                    "confidence": plan_signals.confidence
                },
                "collapse": {
                    "winner": collapse_signals.winner,
                    "confidence": collapse_signals.confidence,
                    "needs_refinement": collapse_signals.needs_refinement
                },
                "routing": {
                    "preferred": routing_signals.preferred,
                    "fallbacks": routing_signals.fallbacks
                } if 'routing_signals' in locals() else {}
            }
        }
