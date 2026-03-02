#!/usr/bin/env python3
"""
AgentArmy Evaluation CLI — run evaluations from the command line.

Usage:
    python -m evaluation.run_eval                    # run all datasets (mock mode)
    python -m evaluation.run_eval --mode live         # run with real LLM calls
    python -m evaluation.run_eval --dataset critic    # run only critic cases
    python -m evaluation.run_eval --output ./reports  # custom output directory
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Ensure orchestration root for imports
_ORCH_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ORCH_ROOT))

from evaluation.engine import EvaluationEngine
from evaluation.report import generate_json_report, generate_markdown_report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="AgentArmy Evaluation Framework",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--mode",
        choices=["mock", "live"],
        default="mock",
        help="Execution mode: 'mock' uses pre-recorded responses, 'live' calls real agents (default: mock)",
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default=None,
        help="Run only a specific dataset by name (e.g., 'critic', 'planner'). Omit for all.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output directory for reports (default: orchestration/evaluation/reports/)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Print detailed per-case results to stdout",
    )

    args = parser.parse_args(argv)

    # Resolve output directory
    output_dir = Path(args.output) if args.output else Path(__file__).parent / "reports"
    output_dir.mkdir(parents=True, exist_ok=True)

    engine = EvaluationEngine(mode=args.mode)

    print(f"🔬 AgentArmy Evaluation Framework")
    print(f"   Mode: {args.mode}")
    print(f"   Output: {output_dir}\n")

    # Run evaluation
    if args.dataset:
        # Single dataset
        dataset_path = engine.datasets_dir / f"{args.dataset}_cases.jsonl"
        if not dataset_path.exists():
            print(f"❌ Dataset not found: {dataset_path}")
            available = [p.stem.replace("_cases", "") for p in engine.runner.discover_datasets(engine.datasets_dir)]
            print(f"   Available: {', '.join(available)}")
            return 1
        print(f"📂 Running dataset: {dataset_path.name}")
        results = engine.evaluate_dataset(dataset_path)
    else:
        datasets = engine.runner.discover_datasets(engine.datasets_dir)
        print(f"📂 Discovered {len(datasets)} dataset(s):")
        for ds in datasets:
            print(f"   - {ds.name}")
        print()
        results = engine.evaluate_all()

    if not results:
        print("⚠️  No results produced.")
        return 1

    # Aggregate
    aggregates = EvaluationEngine.aggregate(results)

    # Print summary
    print(f"\n{'='*60}")
    print(f"  RESULTS SUMMARY")
    print(f"{'='*60}")
    print(f"  Total Cases:    {aggregates['total_cases']}")
    print(f"  Overall Pass:   {aggregates['overall_pass_rate']:.1%}")
    print(f"  Mean Score:     {aggregates.get('overall_mean_score', 0):.4f}")
    print()

    by_agent = aggregates.get("by_agent", {})
    if by_agent:
        print(f"  {'Agent':<15} {'Cases':>6} {'Pass%':>8} {'Mean':>8}")
        print(f"  {'-'*15} {'-'*6} {'-'*8} {'-'*8}")
        for agent_type, stats in sorted(by_agent.items()):
            print(
                f"  {agent_type.capitalize():<15} "
                f"{stats['cases']:>6} "
                f"{stats['pass_rate']:>7.1%} "
                f"{stats['mean_score']:>8.4f}"
            )
    print()

    by_evaluator = aggregates.get("by_evaluator", {})
    if by_evaluator:
        print(f"  {'Evaluator':<22} {'Count':>6} {'Pass%':>8} {'Mean':>8}")
        print(f"  {'-'*22} {'-'*6} {'-'*8} {'-'*8}")
        for name, stats in sorted(by_evaluator.items()):
            print(
                f"  {name:<22} "
                f"{stats['count']:>6} "
                f"{stats['pass_rate']:>7.1%} "
                f"{stats['mean_score']:>8.4f}"
            )
    print()

    # Verbose — per-case details
    if args.verbose:
        print(f"{'='*60}")
        print(f"  PER-CASE DETAILS")
        print(f"{'='*60}")
        for r in results:
            status = "PASS" if r.passed else "FAIL"
            icon = "✅" if r.passed else "❌"
            print(f"\n  {icon} {r.case_id} ({r.agent_type}) — {status} ({r.aggregate_score:.4f})")
            for ev in r.evaluations:
                ev_icon = "✅" if ev.get("passed") else "❌"
                print(f"     {ev_icon} {ev.get('evaluator', '?')}: {ev.get('score', 0):.4f}")
                if ev.get("error"):
                    print(f"        ⚠️  {ev['error']}")
        print()

    # Generate reports
    json_path = generate_json_report(results, aggregates, output_dir / "evaluation_results.json")
    md_path = generate_markdown_report(results, aggregates, output_dir / "evaluation_report.md")

    print(f"📊 Reports generated:")
    print(f"   JSON: {json_path}")
    print(f"   Markdown: {md_path}")
    print(f"\n{'='*60}")

    # Exit code: 0 if all pass, 1 if any failures
    return 0 if aggregates["overall_pass_rate"] >= 1.0 else 1


if __name__ == "__main__":
    sys.exit(main())
