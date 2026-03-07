"""
Routing weight adjustment based on job performance.
"""

from __future__ import annotations

from typing import Dict

from .run_history import JobRecord


class RoutingUpdater:
    """
    Adjusts provider routing weights based on recent job performance.
    In v1 this computes a simple score per provider:
        score = success_rate - failure_rate
    and exposes it as a dict. ProviderRouter can read this.
    """
    
    def __init__(self) -> None:
        self._provider_scores: Dict[str, float] = {}
    
    def adjust_from_job(self, job: JobRecord) -> None:
        """Update routing scores based on job results"""
        
        if not job.tasks:
            return
        
        provider_stats: Dict[str, Dict[str, int]] = {}
        
        for task in job.tasks:
            stats = provider_stats.setdefault(
                task.provider, {"success": 0, "failure": 0}
            )
            
            if task.success:
                stats["success"] += 1
            else:
                stats["failure"] += 1
        
        for provider, stats in provider_stats.items():
            total = stats["success"] + stats["failure"]
            if total == 0:
                continue
            
            success_rate = stats["success"] / total
            failure_rate = stats["failure"] / total
            score = success_rate - failure_rate
            
            self._provider_scores[provider] = score
    
    def get_scores(self) -> Dict[str, float]:
        """Get current routing scores for all providers"""
        
        return dict(self._provider_scores)
