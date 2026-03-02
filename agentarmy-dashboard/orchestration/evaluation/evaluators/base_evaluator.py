"""
Base evaluator contract for the AgentArmy evaluation framework.

Every evaluator implements __init__ (setup) and __call__ (evaluation logic),
returning a dict with at minimum {"score": float, "details": dict}.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseEvaluator(ABC):
    """Abstract evaluator contract.

    Subclasses MUST implement ``__call__`` which receives the agent's
    response dict (the output of ``agent.execute()``) along with the
    original ``task_spec`` and optional ``ground_truth``.

    Returns
    -------
    dict with at least:
        score: float   — 0.0 (worst) to 1.0 (best)
        passed: bool   — whether the score meets the evaluator's threshold
        details: dict  — evaluator-specific breakdown
    """

    name: str = "base"
    threshold: float = 0.5

    def __init__(self, threshold: float | None = None) -> None:
        if threshold is not None:
            self.threshold = threshold

    @abstractmethod
    def __call__(
        self,
        *,
        response: Dict[str, Any],
        task_spec: Dict[str, Any],
        ground_truth: Dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Run the evaluation and return a result dict."""

    # ------------------------------------------------------------------
    # Helpers available to all evaluators
    # ------------------------------------------------------------------

    @staticmethod
    def _safe_json_parse(text: str) -> Dict[str, Any] | None:
        """Try to parse JSON from agent output text, handling fences."""
        import json

        if not isinstance(text, str):
            return None
        # Strip markdown code fences
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except (json.JSONDecodeError, ValueError):
            return None

    def _build_result(
        self,
        score: float,
        details: Dict[str, Any],
        *,
        passed: bool | None = None,
    ) -> Dict[str, Any]:
        """Standardised result dict builder."""
        if passed is None:
            passed = score >= self.threshold
        return {
            "evaluator": self.name,
            "score": round(score, 4),
            "passed": passed,
            "threshold": self.threshold,
            "details": details,
        }
