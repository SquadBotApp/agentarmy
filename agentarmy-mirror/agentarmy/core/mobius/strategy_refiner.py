"""
Strategy refiner: adjusts provider selection and task execution parameters.
"""

from __future__ import annotations

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class StrategyRefiner:
    """
    Refines task execution strategy based on feedback signals.
    
    Adjustments:
    - Update provider assignments
    - Adjust temperature/risk parameters
    - Add/remove task dependencies
    - Modify execution parallelism
    """
    
    def refine(self, plan: Dict[str, Any], signals: Dict[str, Any]) -> Dict[str, Any]:
        """
        Refine plan strategy based on signals.
        
        Args:
            plan: Plan to refine
            signals: Feedback signals (routing_scores, provider_zpe)
        
        Returns:
            Refined plan with strategy adjustments
        """
        
        routing_scores = signals.get("routing_scores", {})
        provider_zpe = signals.get("provider_zpe", {})
        tasks = plan.get("tasks", [])
        
        logger.info(f"Refining strategy for {len(tasks)} tasks")
        
        refined_tasks = []
        for task in tasks:
            refined_task = self._refine_task(task, routing_scores, provider_zpe)
            refined_tasks.append(refined_task)
        
        return {
            **plan,
            "tasks": refined_tasks,
            "refined_at": signals.get("timestamp"),
        }
    
    def adjust_parallelism(
        self,
        plan: Dict[str, Any],
        signals: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Adjust parallelism level based on provider health.
        Better providers → more parallelism (less risk).
        """
        
        provider_zpe = signals.get("provider_zpe", {})
        
        # Calculate average provider health
        avg_health = sum(provider_zpe.values()) / len(provider_zpe) if provider_zpe else 0.5
        
        if avg_health > 0.8:
            parallelism_level = "aggressive"
        elif avg_health > 0.6:
            parallelism_level = "balanced"
        else:
            parallelism_level = "conservative"
        
        logger.info(f"Adjusted parallelism to {parallelism_level} (avg_health: {avg_health:.2f})")
        
        return {
            **plan,
            "parallelism": parallelism_level,
        }
    
    def add_task_dependencies(
        self,
        plan: Dict[str, Any],
        signals: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Add dependencies between tasks based on strategy.
        For sequential critical path.
        """
        
        tasks = plan.get("tasks", [])
        routing_scores = signals.get("routing_scores", {})
        
        # Find critical path (low-scoring providers get dependencies)
        poor_providers = [
            p for p, score in routing_scores.items()
            if score < 0.5
        ]
        
        dependencies = {}
        for i, task in enumerate(tasks):
            if task.get("provider") in poor_providers and i > 0:
                # Add dependency on previous task for validation
                dependencies[task.get("task_id")] = [tasks[i - 1].get("task_id")]
        
        logger.info(f"Added {len(dependencies)} task dependencies")
        
        return {
            **plan,
            "tasks": tasks,
            "dependencies": dependencies,
        }
    
    def set_task_parameters(
        self,
        plan: Dict[str, Any],
        signals: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Set execution parameters (temperature, timeout, retry) per task.
        """
        
        routing_scores = signals.get("routing_scores", {})
        provider_zpe = signals.get("provider_zpe", {})
        tasks = plan.get("tasks", [])
        
        for task in tasks:
            provider = task.get("provider", "unknown")
            
            # Score-based parameter tuning
            score = self._get_provider_score(provider, routing_scores, provider_zpe)
            
            # Higher score = more aggressive parameters
            if score > 0.8:
                task["temperature"] = 0.8  # More creative
                task["timeout_seconds"] = 30
                task["max_retries"] = 1
            elif score > 0.6:
                task["temperature"] = 0.7
                task["timeout_seconds"] = 45
                task["max_retries"] = 2
            else:
                task["temperature"] = 0.5  # More conservative
                task["timeout_seconds"] = 60
                task["max_retries"] = 3
        
        logger.info(f"Set execution parameters for {len(tasks)} tasks")
        
        return {
            **plan,
            "tasks": tasks,
        }
    
    @staticmethod
    def _refine_task(
        task: Dict[str, Any],
        routing_scores: Dict[str, float],
        provider_zpe: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Refine a single task based on provider signals.
        """
        
        provider = task.get("provider", "unknown")
        
        # Calculate combined score
        routing = routing_scores.get(provider, 0.0)
        zpe = provider_zpe.get(provider, 0.0)
        combined_score = (routing + zpe) / 2.0 if (routing or zpe) else 0.0
        
        return {
            **task,
            "routing_score": routing,
            "zpe_score": zpe,
            "strategy_score": combined_score,
            "execution_priority": StrategyRefiner._priority_from_score(combined_score),
        }
    
    @staticmethod
    def _get_provider_score(
        provider: str,
        routing_scores: Dict[str, float],
        provider_zpe: Dict[str, float]
    ) -> float:
        """Calculate combined score for a provider."""
        
        routing = routing_scores.get(provider, 0.0)
        zpe = provider_zpe.get(provider, 0.0)
        return (routing + zpe) / 2.0 if (routing or zpe) else 0.0
    
    @staticmethod
    def _priority_from_score(score: float) -> str:
        """Convert score to priority level."""
        
        if score > 0.8:
            return "high"
        elif score > 0.6:
            return "medium"
        else:
            return "low"
