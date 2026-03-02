"""
ZPE Evaluator — validates ZPE scoring quality and calibration.

Checks:
1. All 6 canonical dimensions are present in the Critic's ZPE output
2. Component scores are in valid range [0.0, 1.0]
3. Weighted total is correctly computed from components (± tolerance)
4. Score distribution is calibrated (not all 1.0 or all 0.0)
5. Total matches the canonical weight formula
"""

from __future__ import annotations

import sys
import os
from typing import Any, Dict

# Ensure parent paths are available for import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from agents.prompts import ZPE_WEIGHTS

from .base_evaluator import BaseEvaluator

_CANONICAL_DIMS = set(ZPE_WEIGHTS.keys())

# Map alternative keys to canonical keys (Critic prompt uses "cost_efficiency")
_DIM_ALIASES: Dict[str, str] = {
    "cost_efficiency": "cost",
}

_TOLERANCE = 0.05  # ±5% tolerance on recalculated total


class ZPEEvaluator(BaseEvaluator):
    """Evaluate ZPE scoring quality from Critic agent output."""

    name = "zpe_quality"
    threshold = 0.6

    def __call__(
        self,
        *,
        response: Dict[str, Any],
        task_spec: Dict[str, Any],
        ground_truth: Dict[str, Any] | None = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        output = response.get("output", response)
        if isinstance(output, str):
            parsed = self._safe_json_parse(output)
            output = parsed if parsed is not None else {}

        zpe = output.get("zpe_score", {})
        if not isinstance(zpe, dict):
            return self._build_result(
                score=0.0,
                details={"error": "No zpe_score dict in output"},
            )

        components = zpe.get("components", {})
        if not isinstance(components, dict):
            return self._build_result(
                score=0.1,
                details={"error": "zpe_score.components is not a dict"},
            )

        # Normalize aliases
        normalized: Dict[str, float] = {}
        for key, val in components.items():
            canon = _DIM_ALIASES.get(key, key)
            try:
                normalized[canon] = float(val)
            except (TypeError, ValueError):
                pass

        # 1) Dimension coverage
        present_dims = _CANONICAL_DIMS.intersection(normalized.keys())
        coverage_ratio = len(present_dims) / len(_CANONICAL_DIMS)

        # 2) Range validity [0.0, 1.0]
        valid_range_count = sum(
            1 for d in present_dims if 0.0 <= normalized[d] <= 1.0
        )
        range_ratio = valid_range_count / max(len(present_dims), 1)

        # 3) Recalculate expected total
        expected_total = 0.0
        for dim, weight in ZPE_WEIGHTS.items():
            val = normalized.get(dim, 0.0)
            # Critic prompt scores raw (higher is better for all dims)
            # The orchestrator inverts cost/latency/risk, but the Critic shouldn't
            expected_total += val * weight

        reported_total = float(zpe.get("total", -1))
        total_delta = abs(expected_total - reported_total) if reported_total >= 0 else 1.0
        total_accurate = total_delta <= _TOLERANCE

        # 4) Calibration — penalize degenerate scores (all same value)
        if present_dims:
            vals = [normalized[d] for d in present_dims]
            spread = max(vals) - min(vals)
            calibration = min(1.0, spread / 0.25)  # expect ≥0.25 spread
        else:
            calibration = 0.0

        # Composite score
        score = (
            coverage_ratio * 0.35
            + range_ratio * 0.20
            + (1.0 if total_accurate else 0.0) * 0.25
            + calibration * 0.20
        )

        return self._build_result(
            score=score,
            details={
                "canonical_dimensions": sorted(_CANONICAL_DIMS),
                "present_dimensions": sorted(present_dims),
                "missing_dimensions": sorted(_CANONICAL_DIMS - present_dims),
                "coverage_ratio": round(coverage_ratio, 3),
                "range_valid_ratio": round(range_ratio, 3),
                "reported_total": round(reported_total, 4) if reported_total >= 0 else None,
                "expected_total": round(expected_total, 4),
                "total_delta": round(total_delta, 4),
                "total_accurate": total_accurate,
                "calibration_spread": round(calibration, 3),
            },
        )
