"""
Tests for the AgentArmy Evaluation Framework.
Covers: evaluators, runner, engine, and report generation.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

# Ensure orchestration root on path
_ORCH_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ORCH_ROOT))

from evaluation.evaluators.base_evaluator import BaseEvaluator
from evaluation.evaluators.format_evaluator import FormatEvaluator
from evaluation.evaluators.zpe_evaluator import ZPEEvaluator
from evaluation.evaluators.safety_evaluator import SafetyEvaluator
from evaluation.evaluators.plan_quality_evaluator import PlanQualityEvaluator
from evaluation.runner import AgentRunner, RunResult
from evaluation.engine import EvaluationEngine, EvaluationResult
from evaluation.report import generate_json_report, generate_markdown_report


# =============================================================================
# Format Evaluator Tests
# =============================================================================

class TestFormatEvaluator(unittest.TestCase):
    def setUp(self):
        self.evaluator = FormatEvaluator()

    def test_planner_full_compliance(self):
        """Fully compliant planner output should score high."""
        response = {
            "status": "completed",
            "output": {
                "mission_id": "m-001",
                "goal": "Build API",
                "steps": [
                    {"id": "s1", "name": "Design", "description": "Design API", "agent_type": "executor"},
                    {"id": "s2", "name": "Review", "description": "Review code", "agent_type": "critic"},
                ],
                "budget": {"max_steps": 5},
                "governance": {"requires_approval": False},
            },
        }
        result = self.evaluator(response=response, task_spec={}, agent_type="planner")
        self.assertGreater(result["score"], 0.8)
        self.assertTrue(result["passed"])

    def test_planner_missing_fields(self):
        """Planner output missing required fields should score low."""
        response = {"status": "completed", "output": {"goal": "Build API"}}
        result = self.evaluator(response=response, task_spec={}, agent_type="planner")
        self.assertLess(result["score"], 0.7)
        self.assertIn("mission_id", result["details"]["missing_fields"])

    def test_executor_valid_status(self):
        """Executor with valid status gets bonus."""
        response = {
            "output": {
                "task_id": "t1",
                "status": "completed",
                "output": {"content": "done"},
            },
        }
        result = self.evaluator(response=response, task_spec={}, agent_type="executor")
        self.assertGreater(result["score"], 0.7)
        self.assertTrue(result["details"]["status_valid"])

    def test_critic_valid_verdict(self):
        """Critic with valid verdict and zpe_score gets high score."""
        response = {
            "output": {
                "zpe_score": {"total": 0.8, "components": {"usefulness": 0.9}},
                "verdict": "accept",
                "evaluation_id": "e-001",
            },
        }
        result = self.evaluator(response=response, task_spec={}, agent_type="critic")
        self.assertGreater(result["score"], 0.8)
        self.assertTrue(result["details"]["verdict_valid"])

    def test_empty_response(self):
        """Empty response should score 0."""
        result = self.evaluator(response={}, task_spec={}, agent_type="executor")
        self.assertEqual(result["score"], 0.0)


# =============================================================================
# ZPE Evaluator Tests
# =============================================================================

class TestZPEEvaluator(unittest.TestCase):
    def setUp(self):
        self.evaluator = ZPEEvaluator()

    def test_perfect_zpe(self):
        """Well-calibrated ZPE with all dimensions should score high."""
        response = {
            "output": {
                "zpe_score": {
                    "total": 0.645,
                    "components": {
                        "usefulness": 0.8,
                        "coherence": 0.7,
                        "cost_efficiency": 0.6,
                        "latency": 0.9,
                        "risk": 0.5,
                        "alignment": 0.7,
                    },
                },
            },
        }
        result = self.evaluator(response=response, task_spec={})
        self.assertGreater(result["score"], 0.5)
        self.assertEqual(result["details"]["coverage_ratio"], 1.0)

    def test_missing_dimensions(self):
        """ZPE with missing dimensions should score lower."""
        response = {
            "output": {
                "zpe_score": {
                    "total": 0.5,
                    "components": {"usefulness": 0.8, "coherence": 0.7},
                },
            },
        }
        result = self.evaluator(response=response, task_spec={})
        self.assertLess(result["details"]["coverage_ratio"], 0.5)

    def test_no_zpe_score(self):
        """No zpe_score should score 0."""
        result = self.evaluator(response={"output": {}}, task_spec={})
        self.assertEqual(result["score"], 0.0)

    def test_degenerate_scores(self):
        """All same value = poor calibration."""
        response = {
            "output": {
                "zpe_score": {
                    "total": 0.5,
                    "components": {
                        "usefulness": 0.5, "coherence": 0.5, "cost_efficiency": 0.5,
                        "latency": 0.5, "risk": 0.5, "alignment": 0.5,
                    },
                },
            },
        }
        result = self.evaluator(response=response, task_spec={})
        self.assertEqual(result["details"]["calibration_spread"], 0.0)


# =============================================================================
# Safety Evaluator Tests
# =============================================================================

class TestSafetyEvaluator(unittest.TestCase):
    def setUp(self):
        self.evaluator = SafetyEvaluator()

    def test_clean_output(self):
        """Output with no safety issues should score 1.0."""
        response = {"output": {"content": "Hello, the weather is sunny today."}}
        result = self.evaluator(response=response, task_spec={})
        self.assertEqual(result["score"], 1.0)
        self.assertTrue(result["passed"])

    def test_credential_leak(self):
        """Output with credential leak should score low."""
        response = {"output": {"content": "api_key=sk-1234567890abcdef"}}
        result = self.evaluator(response=response, task_spec={})
        self.assertLess(result["score"], 0.9)
        self.assertGreater(len(result["details"]["sensitive_marker_leaks"]), 0)

    def test_sql_injection(self):
        """Output with DROP TABLE should be flagged."""
        response = {"output": {"content": "Running: DROP TABLE users"}}
        result = self.evaluator(response=response, task_spec={})
        self.assertLess(result["score"], 1.0)
        self.assertGreater(len(result["details"]["harmful_patterns_found"]), 0)

    def test_governor_violation_not_blocked(self):
        """Violations detected but not blocked = penalty."""
        response = {"blocked": False, "violations": ["Category A: credential exposure"]}
        result = self.evaluator(response=response, task_spec={})
        self.assertLess(result["score"], 1.0)
        self.assertIn("Violations detected but output not blocked", result["details"]["governor_issues"])


# =============================================================================
# Plan Quality Evaluator Tests
# =============================================================================

class TestPlanQualityEvaluator(unittest.TestCase):
    def setUp(self):
        self.evaluator = PlanQualityEvaluator()

    def test_high_quality_plan(self):
        """Well-structured plan should score high."""
        response = {
            "output": {
                "plan": {
                    "steps": [
                        {"id": "s1", "name": "Design", "description": "Schema design", "agent_type": "executor", "tool_hints": ["llm"], "depends_on": [], "risk_level": "low"},
                        {"id": "s2", "name": "Build", "description": "Implement", "agent_type": "executor", "tool_hints": ["codegen"], "depends_on": ["s1"], "risk_level": "medium"},
                        {"id": "s3", "name": "Review", "description": "Quality check", "agent_type": "critic", "tool_hints": ["llm"], "depends_on": ["s2"], "risk_level": "low"},
                        {"id": "s4", "name": "Deliver", "description": "Final merge", "agent_type": "synthesizer", "tool_hints": ["llm"], "depends_on": ["s3"], "risk_level": "low"},
                    ],
                    "budget": {"max_steps": 10, "max_cost_qb": 50},
                    "governance": {"requires_approval": False},
                },
            },
        }
        result = self.evaluator(response=response, task_spec={})
        self.assertGreater(result["score"], 0.6)
        self.assertTrue(result["details"]["has_critic_step"])
        self.assertTrue(result["details"]["has_synthesizer_step"])

    def test_empty_plan(self):
        """Plan with no steps should score very low."""
        response = {"output": {"plan": {"steps": []}}}
        result = self.evaluator(response=response, task_spec={})
        self.assertLess(result["score"], 0.5)
        self.assertFalse(result["passed"])

    def test_orphan_dependencies(self):
        """Plan with broken dependency refs should be penalized."""
        response = {
            "output": {
                "steps": [
                    {"id": "s1", "name": "A", "description": "a", "agent_type": "executor", "depends_on": ["nonexistent"]},
                ],
            },
        }
        result = self.evaluator(response=response, task_spec={})
        self.assertFalse(result["details"]["dag_valid"])


# =============================================================================
# Runner Tests
# =============================================================================

class TestAgentRunner(unittest.TestCase):
    def test_load_dataset(self):
        """Runner should load JSONL datasets correctly."""
        runner = AgentRunner(mode="mock")
        datasets = runner.discover_datasets()
        self.assertGreater(len(datasets), 0)

        cases = runner.load_dataset(datasets[0])
        self.assertGreater(len(cases), 0)
        self.assertIn("case_id", cases[0])

    def test_mock_run(self):
        """Mock mode should return pre-recorded responses."""
        runner = AgentRunner(mode="mock")
        datasets = runner.discover_datasets()
        results = runner.run_dataset_sync(datasets[0])
        self.assertGreater(len(results), 0)
        self.assertIsInstance(results[0], RunResult)
        self.assertIsInstance(results[0].response, dict)

    def test_run_result_to_dict(self):
        """RunResult.to_dict should serialize correctly."""
        rr = RunResult("c-001", "critic", {"desc": "test"}, {"status": "ok"}, None, 12.5)
        d = rr.to_dict()
        self.assertEqual(d["case_id"], "c-001")
        self.assertEqual(d["latency_ms"], 12.5)


# =============================================================================
# Engine Tests
# =============================================================================

class TestEvaluationEngine(unittest.TestCase):
    def test_evaluate_all_mock(self):
        """Engine should evaluate all datasets in mock mode without error."""
        engine = EvaluationEngine(mode="mock")
        results = engine.evaluate_all()
        self.assertGreater(len(results), 0)
        for r in results:
            self.assertIsInstance(r, EvaluationResult)
            self.assertIsInstance(r.aggregate_score, float)

    def test_aggregate(self):
        """Aggregation should compute correct statistics."""
        engine = EvaluationEngine(mode="mock")
        results = engine.evaluate_all()
        agg = EvaluationEngine.aggregate(results)
        self.assertIn("total_cases", agg)
        self.assertIn("overall_pass_rate", agg)
        self.assertIn("by_agent", agg)
        self.assertIn("by_evaluator", agg)
        self.assertGreater(agg["total_cases"], 0)

    def test_evaluate_single_dataset(self):
        """Engine should handle single dataset evaluation."""
        engine = EvaluationEngine(mode="mock")
        datasets = engine.runner.discover_datasets(engine.datasets_dir)
        if datasets:
            results = engine.evaluate_dataset(datasets[0])
            self.assertGreater(len(results), 0)


# =============================================================================
# Report Tests
# =============================================================================

class TestReports(unittest.TestCase):
    def test_json_report(self):
        """JSON report should be valid JSON."""
        engine = EvaluationEngine(mode="mock")
        results = engine.evaluate_all()
        agg = EvaluationEngine.aggregate(results)

        with tempfile.TemporaryDirectory() as tmp:
            path = generate_json_report(results, agg, Path(tmp) / "test.json")
            self.assertTrue(path.exists())
            data = json.loads(path.read_text())
            self.assertIn("summary", data)
            self.assertIn("results", data)

    def test_markdown_report(self):
        """Markdown report should contain expected sections."""
        engine = EvaluationEngine(mode="mock")
        results = engine.evaluate_all()
        agg = EvaluationEngine.aggregate(results)

        with tempfile.TemporaryDirectory() as tmp:
            path = generate_markdown_report(results, agg, Path(tmp) / "test.md")
            self.assertTrue(path.exists())
            content = path.read_text(encoding="utf-8")
            self.assertIn("# AgentArmy Evaluation Report", content)
            self.assertIn("## Overall Summary", content)
            self.assertIn("## Per-Agent Results", content)


if __name__ == "__main__":
    unittest.main()
