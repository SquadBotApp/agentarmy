"""
In-memory storage of reusable insights.
"""

from __future__ import annotations

from typing import Any, Dict, List, Tuple

from .run_history import JobRecord


class MemoryStore:
    """
    Simple in-memory store of reusable insights.
    In v1 this just keeps a list of (job_id, summary) entries.
    Later can be extended to a vector database or knowledge graph.
    """
    
    def __init__(self) -> None:
        self._insights: List[Tuple[str, Dict[str, Any]]] = []
    
    def save_insights(self, job: JobRecord, patterns: Dict[str, Any]) -> None:
        """Save job insights for future reference"""
        
        self._insights.append((job.job_id, patterns))
    
    def all_insights(self) -> List[Tuple[str, Dict[str, Any]]]:
        """Retrieve all stored insights"""
        
        return list(self._insights)
