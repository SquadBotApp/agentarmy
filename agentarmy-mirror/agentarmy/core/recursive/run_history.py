"""
Run history tracking for the Recursive Engine.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List


@dataclass
class TaskRecord:
    """Record of a single task execution"""
    
    task_id: str
    job_id: str
    provider: str
    success: bool
    latency_ms: int
    cost_usd: float
    zpe_score: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class JobRecord:
    """Record of a complete job run"""
    
    job_id: str
    tasks: List[TaskRecord] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)


class RunHistory:
    """
    In-memory history of job runs.
    In v1 this is process-local; later can be swapped to database.
    """
    
    def __init__(self) -> None:
        self._jobs: Dict[str, JobRecord] = {}
    
    def add_task(self, record: TaskRecord) -> None:
        """Add a task record to a job"""
        
        job = self._jobs.get(record.job_id)
        if job is None:
            job = JobRecord(job_id=record.job_id)
            self._jobs[record.job_id] = job
        
        job.tasks.append(record)
    
    def get_job(self, job_id: str) -> JobRecord | None:
        """Retrieve a complete job record"""
        
        return self._jobs.get(job_id)
    
    def all_jobs(self) -> List[JobRecord]:
        """Get all job records"""
        
        return list(self._jobs.values())
