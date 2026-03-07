"""
Pattern learning from execution history.
Extracts provider usage and success patterns.
"""

from __future__ import annotations

from collections import Counter
from typing import Dict, List

from .run_history import JobRecord, TaskRecord


class PatternLearner:
    """
    Simple v1 pattern learner:
    - counts provider usage
    - counts success/failure per provider
    - returns a summary dict for other modules
    """
    
    def extract(self, job: JobRecord) -> Dict[str, Dict[str, int]]:
        """Extract patterns from a single job"""
        
        provider_counts: Counter[str] = Counter()
        provider_success: Counter[str] = Counter()
        provider_failure: Counter[str] = Counter()
        
        for task in job.tasks:
            provider_counts[task.provider] += 1
            if task.success:
                provider_success[task.provider] += 1
            else:
                provider_failure[task.provider] += 1
        
        summary: Dict[str, Dict[str, int]] = {}
        for provider, count in provider_counts.items():
            summary[provider] = {
                "count": count,
                "success": provider_success[provider],
                "failure": provider_failure[provider],
            }
        
        return summary
    
    def extract_from_jobs(self, jobs: List[JobRecord]) -> Dict[str, Dict[str, int]]:
        """Extract aggregate patterns from multiple jobs"""
        
        aggregate: Dict[str, Dict[str, int]] = {}
        
        for job in jobs:
            job_summary = self.extract(job)
            for provider, stats in job_summary.items():
                if provider not in aggregate:
                    aggregate[provider] = {"count": 0, "success": 0, "failure": 0}
                
                aggregate[provider]["count"] += stats["count"]
                aggregate[provider]["success"] += stats["success"]
                aggregate[provider]["failure"] += stats["failure"]
        
        return aggregate
