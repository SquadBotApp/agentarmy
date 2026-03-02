"""
Evaluation Engine — orchestrates evaluators, runs evaluation, aggregates results.

Usage:
    engine = EvaluationEngine()
    results = engine.evaluate_all()   # runs all datasets through all relevant evaluators
    report = engine.aggregate(results)
"""

from __future__ import annotations

import statistics
from pathlib import Path
from typing import Any, Dict, List, Optional

from .evaluators import (
    BaseEvaluator,
    FormatEvaluator,
    ZPEEvaluator,
    SafetyEvaluator,
    PlanQualityEvaluator,
)
from .runner import AgentRunner, RunResult


# Which evaluators apply to which agent types
_EVALUATOR_MAP: Dict[str, List[type]] = {
    "planner": [FormatEvaluator, SafetyEvaluator, PlanQualityEvaluator],
    "executor": [FormatEvaluator, SafetyEvaluator],
    "critic": [FormatEvaluator, SafetyEvaluator, ZPEEvaluator],
    "governor": [SafetyEvaluator],
    "synthesizer": [FormatEvaluator, SafetyEvaluator],
}


class EvaluationResult:
    """All evaluator results for a single case."""

    __slots__ = ("case_id", "agent_type", "evaluations", "passed", "aggregate_score")

    def __init__(
        self,
        case_id: str,
        agent_type: str,
        evaluations: List[Dict[str, Any]],
    ) -> None:
        self.case_id = case_id
        self.agent_type = agent_type
        self.evaluations = evaluations
        self.passed = all(e.get("passed", False) for e in evaluations)
        scores = [e.get("score", 0.0) for e in evaluations]
        self.aggregate_score = statistics.mean(scores) if scores else 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "case_id": self.case_id,
            "agent_type": self.agent_type,
            "aggregate_score": round(self.aggregate_score, 4),
            "passed": self.passed,
            "evaluations": self.evaluations,
        }


class EvaluationEngine:
    """Orchestrates evaluation: run agents → apply evaluators → aggregate."""

    def __init__(
        self,
        mode: str = "mock",
        datasets_dir: Optional[str | Path] = None,
    ) -> None:
        self.runner = AgentRunner(mode=mode)
        self.datasets_dir = Path(datasets_dir) if datasets_dir else Path(__file__).parent / "datasets"
        # Instantiate evaluators once
        self._evaluator_cache: Dict[str, BaseEvaluator] = {}

    def _get_evaluator(self, cls: type) -> BaseEvaluator:
        key = cls.__name__
        if key not in self._evaluator_cache:
            self._evaluator_cache[key] = cls()
        return self._evaluator_cache[key]

    def _evaluators_for(self, agent_type: str) -> List[BaseEvaluator]:
        """Get the evaluator instances applicable to an agent type."""
        classes = _EVALUATOR_MAP.get(agent_type, [FormatEvaluator, SafetyEvaluator])
        return [self._get_evaluator(cls) for cls in classes]

    def evaluate_run_result(self, run: RunResult) -> EvaluationResult:
        """Run all applicable evaluators on a single RunResult."""
        evaluators = self._evaluators_for(run.agent_type)
        evaluations: List[Dict[str, Any]] = []

        for evaluator in evaluators:
            try:
                result = evaluator(
                    response=run.response,
                    task_spec=run.task_spec,
                    ground_truth=run.ground_truth,
                    agent_type=run.agent_type,
                )
                evaluations.append(result)
            except Exception as e:
                evaluations.append({
                    "evaluator": evaluator.name,
                    "score": 0.0,
                    "passed": False,
                    "error": str(e),
                })

        return EvaluationResult(
            case_id=run.case_id,
            agent_type=run.agent_type,
            evaluations=evaluations,
        )

    def evaluate_dataset(self, path: str | Path) -> List[EvaluationResult]:
        """Run a single dataset through the runner and evaluators."""
        runs = self.runner.run_dataset_sync(path)
        return [self.evaluate_run_result(r) for r in runs]

    def evaluate_all(self) -> List[EvaluationResult]:
        """Discover and evaluate all datasets."""
        datasets = self.runner.discover_datasets(self.datasets_dir)
        all_results: List[EvaluationResult] = []
        for ds_path in datasets:
            all_results.extend(self.evaluate_dataset(ds_path))
        return all_results

    @staticmethod
    def aggregate(results: List[EvaluationResult]) -> Dict[str, Any]:
        """Compute aggregate metrics across all evaluation results."""
        if not results:
            return {"total_cases": 0, "overall_pass_rate": 0.0, "by_agent": {}, "by_evaluator": {}}

        total = len(results)
        passing = sum(1 for r in results if r.passed)
        scores = [r.aggregate_score for r in results]

        # Per-agent breakdown
        by_agent: Dict[str, Dict[str, Any]] = {}
        for r in results:
            bucket = by_agent.setdefault(r.agent_type, {"cases": 0, "passed": 0, "scores": []})
            bucket["cases"] += 1
            if r.passed:
                bucket["passed"] += 1
            bucket["scores"].append(r.aggregate_score)

        for agent_type, bucket in by_agent.items():
            s = bucket.pop("scores")
            bucket["pass_rate"] = round(bucket["passed"] / max(bucket["cases"], 1), 3)
            bucket["mean_score"] = round(statistics.mean(s), 4) if s else 0.0
            bucket["min_score"] = round(min(s), 4) if s else 0.0
            bucket["max_score"] = round(max(s), 4) if s else 0.0

        # Per-evaluator breakdown
        by_evaluator: Dict[str, Dict[str, Any]] = {}
        for r in results:
            for ev in r.evaluations:
                name = ev.get("evaluator", "unknown")
                bucket = by_evaluator.setdefault(name, {"count": 0, "passed": 0, "scores": []})
                bucket["count"] += 1
                if ev.get("passed", False):
                    bucket["passed"] += 1
                bucket["scores"].append(ev.get("score", 0.0))

        for name, bucket in by_evaluator.items():
            s = bucket.pop("scores")
            bucket["pass_rate"] = round(bucket["passed"] / max(bucket["count"], 1), 3)
            bucket["mean_score"] = round(statistics.mean(s), 4) if s else 0.0

        return {
            "total_cases": total,
            "overall_pass_rate": round(passing / total, 3),
            "overall_mean_score": round(statistics.mean(scores), 4) if scores else 0.0,
            "by_agent": by_agent,
            "by_evaluator": by_evaluator,
        }
