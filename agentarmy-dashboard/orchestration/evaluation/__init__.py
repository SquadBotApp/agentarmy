"""
AgentArmy Evaluation Framework
===============================
Systematic quality assessment for multi-agent orchestration.

Components:
- evaluators/   — Code-based evaluators (format, ZPE, safety, plan quality)
- datasets/     — JSONL test cases per agent type
- runner.py     — Batch agent runner (mock + live modes)
- engine.py     — Evaluation orchestrator & metric aggregation
- report.py     — JSON + Markdown report generation
- run_eval.py   — CLI entry point
"""

from .engine import EvaluationEngine
from .runner import AgentRunner

__all__ = ["EvaluationEngine", "AgentRunner"]
