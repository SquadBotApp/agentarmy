"""
Plan rewriter: applies structural transformations to job plans.
Reorders tasks based on signals to optimize execution.
"""

from __future__ import annotations

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class PlanRewriter:
    """
    Applies structural transformations to the plan based on feedback signals.
    
    Transformations:
    - Reorder tasks by provider health score
    - Adjust task prioritization
    - Insert validation/checkpoint tasks
    - Combine related tasks
    """
    
    def rewrite(self, plan: Dict[str, Any], signals: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rewrite plan based on signals.
        
        Args:
            plan: Original plan with tasks
            signals: Feedback signals (routing_scores, provider_zpe)
        
        Returns:
            Rewritten plan with optimized task ordering
        """
        
        routing_scores = signals.get("routing_scores", {})
        provider_zpe = signals.get("provider_zpe", {})
        tasks: List[Dict[str, Any]] = plan.get("tasks", [])
        
        logger.info(f"Rewriting plan with {len(tasks)} tasks")
        
        # 1. Score each task based on provider health
        scored_tasks = []
        for task in tasks:
            provider = task.get("provider", "unknown")
            score = self._score_task(provider, routing_scores, provider_zpe)
            scored_tasks.append((task, score))
        
        # 2. Sort by score (highest first - best providers execute first)
        sorted_tasks = sorted(scored_tasks, key=lambda x: x[1], reverse=True)
        rewritten_tasks = [t[0] for t in sorted_tasks]
        
        logger.info(f"Reordered tasks: {[t.get('provider') for t in rewritten_tasks]}")
        
        # 3. Return rewritten plan
        return {
            **plan,
            "tasks": rewritten_tasks,
            "rewritten_at": signals.get("timestamp"),
        }
    
    def insert_checkpoints(
        self,
        plan: Dict[str, Any],
        signals: Dict[str, Any],
        checkpoint_interval: int = 3
    ) -> Dict[str, Any]:
        """
        Insert validation checkpoints between task groups.
        Helps catch errors early.
        """
        
        tasks = plan.get("tasks", [])
        new_tasks = []
        
        for i, task in enumerate(tasks):
            new_tasks.append(task)
            
            # Add checkpoint every N tasks
            if (i + 1) % checkpoint_interval == 0 and i + 1 < len(tasks):
                checkpoint = {
                    "task_id": f"checkpoint_{i // checkpoint_interval}",
                    "type": "validation",
                    "provider": "validator",
                    "description": f"Validate tasks 1-{i+1}",
                }
                new_tasks.append(checkpoint)
        
        logger.info(f"Inserted {len(new_tasks) - len(tasks)} checkpoints")
        
        return {
            **plan,
            "tasks": new_tasks,
        }
    
    def combine_related_tasks(
        self,
        plan: Dict[str, Any],
        signals: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Combine related tasks to reduce overhead.
        Example: combine multiple analysis tasks into a single batch.
        """
        
        tasks = plan.get("tasks", [])
        
        # Group tasks by provider
        by_provider = {}
        for task in tasks:
            provider = task.get("provider", "unknown")
            if provider not in by_provider:
                by_provider[provider] = []
            by_provider[provider].append(task)
        
        # Check if we can combine any groups
        combined_tasks = []
        for provider, provider_tasks in by_provider.items():
            if len(provider_tasks) > 1 and provider != "validator":
                # Combine tasks for same provider
                combined = {
                    "task_id": f"batch_{provider}",
                    "type": "batch",
                    "provider": provider,
                    "subtasks": [t.get("task_id") for t in provider_tasks],
                    "description": f"Batch {len(provider_tasks)} {provider} tasks",
                }
                combined_tasks.append(combined)
            else:
                combined_tasks.extend(provider_tasks)
        
        logger.info(f"Combined tasks: {len(tasks)} → {len(combined_tasks)}")
        
        return {
            **plan,
            "tasks": combined_tasks,
        }
    
    @staticmethod
    def _score_task(
        provider: str,
        routing_scores: Dict[str, float],
        provider_zpe: Dict[str, float]
    ) -> float:
        """Calculate a task's priority score based on provider health."""
        
        routing = routing_scores.get(provider, 0.0)
        zpe = provider_zpe.get(provider, 0.0)
        
        # Equal weight for both metrics
        return (routing + zpe) / 2.0 if (routing or zpe) else 0.0
