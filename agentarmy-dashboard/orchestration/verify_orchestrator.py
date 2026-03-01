#!/usr/bin/env python3
"""
Quick verification script for orchestrator.py
Tests core logic without needing FastAPI or network
"""
import sys
import json
from orchestrator import (
    orchestrate,
    Task,
    Agent,
    JobSpec,
    OrchestrationState,
    default_agents,
)


def test_simple_scenario():
    """Test basic orchestration scenario"""
    print("[Test] Running simple orchestration scenario...\n")

    # Create a simple workflow: 3 tasks in sequence
    payload = {
        "job": {
            "goal": "Complete marketing campaign",
            "constraints": {"budget": 500, "timeline": "urgent"},
            "deadline_hours": 24,
            "budget": 500,
            "risk_tolerance": 0.4,
        },
        "state": {
            "tasks": [
                {
                    "id": "t1",
                    "name": "Research market",
                    "description": "Gather market data",
                    "duration": 2.0,
                    "depends_on": [],
                },
                {
                    "id": "t2",
                    "name": "Draft campaign",
                    "description": "Write campaign copy",
                    "duration": 3.0,
                    "depends_on": ["t1"],
                },
                {
                    "id": "t3",
                    "name": "Review & approve",
                    "description": "QA and sign-off",
                    "duration": 1.0,
                    "depends_on": ["t2"],
                },
            ],
            "history": [],
        },
        "previous_zpe": 0.5,
    }

    try:
        result = orchestrate(payload)
        print("[Result] Decision made:")
        print(f"  Next task:  {result.get('nextTaskId')}")
        print(f"  Next agent: {result.get('nextAgentId')}")
        print(f"  ZPE score:  {result['zpe'].get('total', 0):.3f}")
        print(f"  CPM duration: {result['cpm'].get('project_duration', 0):.2f} hours")
        print(f"  Critical tasks: {result['cpm'].get('critical_tasks', [])}")
        print(f"\n  Rationale: {result.get('rationale', '')}\n")
        print("[Test] ✓ Orchestration logic works!\n")
        return True
    except Exception as e:
        print(f"[Error] {type(e).__name__}: {e}\n")
        import traceback
        traceback.print_exc()
        return False


def test_completion_scenario():
    """Test when all tasks are completed"""
    print("[Test] Running completion scenario (all tasks done)...\n")

    payload = {
        "job": {"goal": "Test", "constraints": {}},
        "state": {
            "tasks": [
                {
                    "id": "t1",
                    "name": "Task 1",
                    "description": "",
                    "duration": 1.0,
                    "depends_on": [],
                },
            ],
            "history": [
                {"task_id": "t1", "status": "completed"},
            ],
        },
        "previous_zpe": 0.6,
    }

    try:
        result = orchestrate(payload)
        print("[Result] Completion decision:")
        print(f"  Next task:  {result.get('nextTaskId')}")
        print(f"  Next agent: {result.get('nextAgentId')}")
        print(f"  Rationale: {result.get('rationale', '')}\n")
        print("[Test] ✓ Completion scenario works!\n")
        return True
    except Exception as e:
        print(f"[Error] {type(e).__name__}: {e}\n")
        return False


if __name__ == "__main__":
    print("\n" + "="*60)
    print("AgentArmy Orchestrator Verification")
    print("="*60 + "\n")

    results = []
    results.append(("Simple scenario", test_simple_scenario()))
    results.append(("Completion scenario", test_completion_scenario()))

    print("="*60)
    print("Summary:")
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}: {name}")
    print("="*60 + "\n")

    all_passed = all(r[1] for r in results)
    sys.exit(0 if all_passed else 1)
