"""
Recursive Engine - Core self-improvement loop for AgentArmyOS.
Called after each job completes to analyze performance and adjust behavior.
"""

from __future__ import annotations

from typing import Any, Dict

from .run_history import RunHistory, TaskRecord, JobRecord
from .pattern_learner import PatternLearner
from .routing_updater import RoutingUpdater
from .memory_store import MemoryStore
from .zpe_tracker import ZPETracker


class RecursiveEngine:
    """
    Core self-improvement loop for AgentArmyOS.
    Called after each job completes with a structured job_result dict.
    """
    
    def __init__(
        self,
        history: RunHistory | None = None,
        learner: PatternLearner | None = None,
        updater: RoutingUpdater | None = None,
        memory: MemoryStore | None = None,
        zpe: ZPETracker | None = None,
    ) -> None:
        self.history = history or RunHistory()
        self.learner = learner or PatternLearner()
        self.updater = updater or RoutingUpdater()
        self.memory = memory or MemoryStore()
        self.zpe = zpe or ZPETracker()
    
    def ingest_job_result(self, job_result: Dict[str, Any]) -> None:
        """
        Process a completed job result and trigger analysis.
        
        job_result schema (v1 expectation):
        {
          "job_id": str,
          "tasks": [
            {
              "task_id": str,
              "provider": str,
              "success": bool,
              "latency_ms": int,
              "cost_usd": float,
              "zpe_score": float,
              "metadata": {...}
            },
            ...
          ]
        }
        """
        
        job_id = job_result["job_id"]
        tasks_data = job_result.get("tasks", [])
        
        # Create TaskRecords from input data
        for t in tasks_data:
            record = TaskRecord(
                task_id=t["task_id"],
                job_id=job_id,
                provider=t["provider"],
                success=bool(t.get("success", True)),
                latency_ms=int(t.get("latency_ms", 0)),
                cost_usd=float(t.get("cost_usd", 0.0)),
                zpe_score=float(t.get("zpe_score", 0.0)),
                metadata=t.get("metadata", {}),
            )
            self.history.add_task(record)
        
        # Retrieve the complete job record and run analysis
        job = self.history.get_job(job_id)
        if job is None:
            return
        
        self._run_analysis(job)
    
    def _run_analysis(self, job: JobRecord) -> None:
        """Run all analysis modules on the completed job"""
        
        # Extract patterns from this job
        patterns = self.learner.extract(job)
        
        # Update routing scores based on performance
        self.updater.adjust_from_job(job)
        
        # Store insights for future reference
        self.memory.save_insights(job, patterns)
        
        # Update ZPE tracking
        self.zpe.update_from_job(job)
    
    # Convenience accessors for integration
    
    def get_routing_scores(self) -> Dict[str, float]:
        """Get current routing adjustment scores"""
        
        return self.updater.get_scores()
    
    def get_provider_zpe(self) -> Dict[str, float]:
        """Get ZPE scores for all providers"""
        
        return self.zpe.get_provider_scores()
    
    def get_job_zpe(self, job_id: str) -> float | None:
        """Get ZPE score for a specific job"""
        
        return self.zpe.get_job_score(job_id)
    
    def get_all_insights(self) -> list:
        """Get all stored insights"""
        
        return self.memory.all_insights()
    
    def get_job_history(self, job_id: str) -> JobRecord | None:
        """Retrieve full job record"""
        
        return self.history.get_job(job_id)
