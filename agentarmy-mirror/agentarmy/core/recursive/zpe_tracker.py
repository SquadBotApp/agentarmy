"""
Tracks ZPE (Zero-Point Energy) scores for quality measurement.
"""

from __future__ import annotations

from typing import Dict

from .run_history import JobRecord


class ZPETracker:
    """
    Tracks a simple ZPE-like score per job and per provider.
    v1 heuristic:
      - average task.zpe_score per job
      - average per provider across all jobs
      - uses exponential moving average for provider scores
    """
    
    def __init__(self) -> None:
        self._job_scores: Dict[str, float] = {}
        self._provider_scores: Dict[str, float] = {}
    
    def update_from_job(self, job: JobRecord) -> None:
        """Update ZPE scores based on job results"""
        
        if not job.tasks:
            return
        
        # Job-level score: average of all task ZPE scores
        job_score = sum(t.zpe_score for t in job.tasks) / len(job.tasks)
        self._job_scores[job.job_id] = job_score
        
        # Provider-level score with exponential moving average
        provider_totals: Dict[str, float] = {}
        provider_counts: Dict[str, int] = {}
        
        for task in job.tasks:
            provider_totals[task.provider] = (
                provider_totals.get(task.provider, 0.0) + task.zpe_score
            )
            provider_counts[task.provider] = provider_counts.get(task.provider, 0) + 1
        
        for provider, total in provider_totals.items():
            count = provider_counts[provider]
            avg = total / count
            
            # Simple exponential moving average (70% old, 30% new)
            if provider in self._provider_scores:
                self._provider_scores[provider] = (
                    self._provider_scores[provider] * 0.7 + avg * 0.3
                )
            else:
                self._provider_scores[provider] = avg
    
    def get_job_score(self, job_id: str) -> float | None:
        """Get ZPE score for a specific job"""
        
        return self._job_scores.get(job_id)
    
    def get_provider_scores(self) -> Dict[str, float]:
        """Get ZPE scores for all providers"""
        
        return dict(self._provider_scores)
