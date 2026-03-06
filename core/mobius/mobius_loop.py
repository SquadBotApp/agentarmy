"""
Möbius Loop: Self-optimization loop for AgentArmyOS.
Consumes signals, rewrites plans, refines strategies, returns improved plan.
"""

from __future__ import annotations

import logging
from typing import Dict, Any, Optional

from core.recursive import RecursiveEngine
from .feedback_signals import FeedbackSignals
from .plan_rewriter import PlanRewriter
from .strategy_refiner import StrategyRefiner

logger = logging.getLogger(__name__)


class MobiusLoop:
    """
    Self-optimization loop that sits between planning and expansion.
    
    Flow:
    1. Collect signals from Recursive Engine
    2. Rewrite plan (reorder tasks based on provider health)
    3. Refine strategy (adjust parameters, add dependencies)
    4. Return improved plan for expansion
    
    Integration:
        plan = planner.create(job)
        plan = mobius_loop.refine(plan)
        branches = expansion_engine.expand(plan)
        results = execute(branches)
        recursive_engine.ingest(results)
    """
    
    def __init__(
        self,
        recursive_engine: RecursiveEngine | None = None,
        signals: FeedbackSignals | None = None,
        rewriter: PlanRewriter | None = None,
        refiner: StrategyRefiner | None = None,
    ) -> None:
        self.recursive_engine = recursive_engine or RecursiveEngine()
        self.signals = signals or FeedbackSignals(self.recursive_engine)
        self.rewriter = rewriter or PlanRewriter()
        self.refiner = refiner or StrategyRefiner()
        
        logger.info("Möbius Loop initialized")
    
    def refine(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute full refinement cycle on a plan.
        
        Args:
            plan: Original plan from planner
        
        Returns:
            Refined plan optimized based on current signals
        """
        
        logger.info("Starting Möbius Loop refinement")
        
        # 1. Collect signals from Recursive Engine
        collected_signals = self.signals.collect()
        logger.info(f"Collected signals: {list(collected_signals.keys())}")
        
        # 2. Rewrite plan (reorder tasks)
        rewritten_plan = self.rewriter.rewrite(plan, collected_signals)
        logger.info(f"Plan rewritten: {len(plan.get('tasks', []))} tasks")
        
        # 3. Refine strategy (adjust parameters)
        refined_plan = self.refiner.refine(rewritten_plan, collected_signals)
        logger.info(f"Strategy refined: added execution parameters")
        
        # 4. Add annotations for tracking
        final_plan = {
            **refined_plan,
            "mobius_iteration": plan.get("mobius_iteration", 0) + 1,
            "signals_applied": True,
        }
        
        logger.info(f"Möbius Loop refinement complete (iteration {final_plan['mobius_iteration']})")
        
        return final_plan
    
    async def mobius_loop(self, tasks: list) -> list:
        """
        Main orchestration method called by Orchestrator.
        Takes tasks and returns refined results.
        """
        
        logger.info(f"MobiusLoop.mobius_loop() called with {len(tasks)} tasks")
        
        # Create a plan dict from tasks
        plan = {"tasks": tasks}
        
        # Refine the plan
        refined = self.refine(plan)
        
        # Extract and return tasks as results
        return refined.get("tasks", tasks)
        """
        Execute full refinement cycle on a plan.
        
        Args:
            plan: Original plan from planner
        
        Returns:
            Refined plan optimized based on current signals
        """
        
        logger.info("Starting Möbius Loop refinement")
        
        # 1. Collect signals from Recursive Engine
        collected_signals = self.signals.collect()
        logger.info(f"Collected signals: {list(collected_signals.keys())}")
        
        # 2. Rewrite plan (reorder tasks)
        rewritten_plan = self.rewriter.rewrite(plan, collected_signals)
        logger.info(f"Plan rewritten: {len(plan.get('tasks', []))} tasks")
        
        # 3. Refine strategy (adjust parameters)
        refined_plan = self.refiner.refine(rewritten_plan, collected_signals)
        logger.info(f"Strategy refined: added execution parameters")
        
        # 4. Add annotations for tracking
        final_plan = {
            **refined_plan,
            "mobius_iteration": plan.get("mobius_iteration", 0) + 1,
            "signals_applied": True,
        }
        
        logger.info(f"Möbius Loop refinement complete (iteration {final_plan['mobius_iteration']})")
        
        return final_plan
    
    def refine_with_checkpoints(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Refine plan and add validation checkpoints.
        Safer variant for complex plans.
        """
        
        # Base refinement
        refined_plan = self.refine(plan)
        
        # Add checkpoints
        collected_signals = self.signals.collect()
        checkpoint_plan = self.rewriter.insert_checkpoints(
            refined_plan,
            collected_signals,
            checkpoint_interval=3
        )
        
        return checkpoint_plan
    
    def refine_with_optimization(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Full refinement with all optimizations enabled.
        """
        
        collected_signals = self.signals.collect()
        
        # Base refinement
        refined = self.refine(plan)
        
        # Add checkpoints
        with_checkpoints = self.rewriter.insert_checkpoints(refined, collected_signals)
        
        # Adjust parallelism
        with_parallelism = self.refiner.adjust_parallelism(with_checkpoints, collected_signals)
        
        # Set task parameters
        with_params = self.refiner.set_task_parameters(with_parallelism, collected_signals)
        
        # Add dependencies
        final_plan = self.refiner.add_task_dependencies(with_params, collected_signals)
        
        logger.info("Full optimization refinement complete")
        
        return final_plan
    
    def get_provider_recommendations(self) -> Dict[str, str]:
        """
        Get recommended provider assignments for different task types.
        Useful for planner guidance.
        """
        
        best_providers = self.signals.get_best_providers(top_n=3)
        provider_health = self.signals.get_provider_health()
        
        recommendations = {
            "primary": best_providers[0] if best_providers else "openai",
            "fallback": best_providers[1] if len(best_providers) > 1 else "claude",
            "backup": best_providers[2] if len(best_providers) > 2 else "mock",
            "health_scores": provider_health,
        }
        
        logger.info(f"Provider recommendations: primary={recommendations['primary']}")
        
        return recommendations
    
    def get_plan_quality_estimate(self, plan: Dict[str, Any]) -> float:
        """
        Estimate quality of a plan based on provider assignments.
        Higher = more likely to succeed.
        Returns 0-1 score.
        """
        
        tasks = plan.get("tasks", [])
        provider_zpe = self.recursive_engine.get_provider_zpe()
        
        if not tasks or not provider_zpe:
            return 0.5
        
        # Average ZPE of assigned providers
        scores = []
        for task in tasks:
            provider = task.get("provider", "unknown")
            score = provider_zpe.get(provider, 0.5)
            scores.append(score)
        
        quality = sum(scores) / len(scores) if scores else 0.5
        
        logger.info(f"Plan quality estimate: {quality:.2f}")
        
        return quality
