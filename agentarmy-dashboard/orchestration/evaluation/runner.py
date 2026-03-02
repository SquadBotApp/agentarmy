"""
Agent Runner — batch execution of agents against test datasets.

Supports two modes:
- **mock**: Uses pre-recorded LLM responses from the dataset (fast, deterministic)
- **live**: Calls actual agents via call_llm (requires LLM credentials)

The runner collects (task_spec, agent_response) pairs for downstream evaluation.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

# Ensure orchestration root is on path for agent imports
_ORCH_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ORCH_ROOT))


class RunResult:
    """One row of collected data: input + response + metadata."""

    __slots__ = ("case_id", "agent_type", "task_spec", "response", "ground_truth", "latency_ms")

    def __init__(
        self,
        case_id: str,
        agent_type: str,
        task_spec: Dict[str, Any],
        response: Dict[str, Any],
        ground_truth: Optional[Dict[str, Any]],
        latency_ms: float,
    ) -> None:
        self.case_id = case_id
        self.agent_type = agent_type
        self.task_spec = task_spec
        self.response = response
        self.ground_truth = ground_truth
        self.latency_ms = latency_ms

    def to_dict(self) -> Dict[str, Any]:
        return {
            "case_id": self.case_id,
            "agent_type": self.agent_type,
            "task_spec": self.task_spec,
            "response": self.response,
            "ground_truth": self.ground_truth,
            "latency_ms": round(self.latency_ms, 2),
        }


class AgentRunner:
    """Run agents against JSONL datasets and collect responses."""

    def __init__(self, mode: Literal["mock", "live"] = "mock") -> None:
        self.mode = mode
        self._agents: Dict[str, Any] = {}

    def _get_agent(self, agent_type: str) -> Any:
        """Lazy-load agent instances."""
        if agent_type not in self._agents:
            if agent_type == "planner":
                from agents import PlannerAgent
                self._agents[agent_type] = PlannerAgent()
            elif agent_type == "executor":
                from agents import ExecutorAgent
                self._agents[agent_type] = ExecutorAgent()
            elif agent_type == "critic":
                from agents import CriticAgent
                self._agents[agent_type] = CriticAgent()
            elif agent_type == "governor":
                from agents import GovernorAgent
                self._agents[agent_type] = GovernorAgent()
            elif agent_type == "synthesizer":
                from agents import SynthesizerAgent
                self._agents[agent_type] = SynthesizerAgent()
            else:
                raise ValueError(f"Unknown agent_type: {agent_type}")
        return self._agents[agent_type]

    def load_dataset(self, path: str | Path) -> List[Dict[str, Any]]:
        """Load a JSONL dataset file and return list of case dicts."""
        cases: List[Dict[str, Any]] = []
        with open(path, "r", encoding="utf-8") as f:
            for line_no, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    cases.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"  [WARN] Skipping line {line_no} in {path}: {e}")
        return cases

    def _mock_response(self, case: Dict[str, Any]) -> Dict[str, Any]:
        """Build a response dict from the pre-recorded mock_llm_response."""
        raw = case.get("mock_llm_response", "")
        agent_type = case.get("agent_type", "executor")

        # Try to parse the mock response as JSON (Planner/Executor/Critic format)
        parsed = None
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
            except (json.JSONDecodeError, ValueError):
                pass

        if parsed and isinstance(parsed, dict):
            # The mock IS the structured output the agent would have returned
            # Wrap it in the standard agent envelope if not already wrapped
            if "status" in parsed:
                return parsed
            return {"status": "completed", "output": parsed}

        # Governor returns text-based format
        if agent_type == "governor":
            blocked = "BLOCK" in raw.upper() or "ESCALATE" in raw.upper()
            violations = []
            if "VIOLATIONS:" in raw:
                viol_section = raw.split("VIOLATIONS:")[1].split("\n")[0].strip()
                if viol_section and viol_section.upper() != "NONE":
                    violations.append(viol_section)
            return {
                "content": raw,
                "blocked": blocked,
                "escalated": "ESCALATE" in raw.upper(),
                "violations": violations,
                "quality": 0.2 if blocked else 0.85,
            }

        # Fallback: wrap raw text
        return {"status": "completed", "output": {"raw_output": raw}}

    async def _live_run(self, agent_type: str, task_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Call the actual agent with the task_spec."""
        agent = self._get_agent(agent_type)
        try:
            if agent_type == "governor":
                context = task_spec.get("context", {})
                return await agent.execute(task_spec, context)
            else:
                return await agent.execute(task_spec)
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    async def run_dataset(self, path: str | Path) -> List[RunResult]:
        """Run all cases in a JSONL dataset file."""
        cases = self.load_dataset(path)
        results: List[RunResult] = []

        for case in cases:
            case_id = case.get("case_id", "unknown")
            agent_type = case.get("agent_type", "executor")
            task_spec = case.get("task_spec", {})
            ground_truth = case.get("ground_truth")

            t0 = time.perf_counter()

            if self.mode == "mock":
                response = self._mock_response(case)
            else:
                response = await self._live_run(agent_type, task_spec)

            latency_ms = (time.perf_counter() - t0) * 1000.0

            results.append(RunResult(
                case_id=case_id,
                agent_type=agent_type,
                task_spec=task_spec,
                response=response,
                ground_truth=ground_truth,
                latency_ms=latency_ms,
            ))

        return results

    def run_dataset_sync(self, path: str | Path) -> List[RunResult]:
        """Synchronous wrapper for run_dataset."""
        return asyncio.run(self.run_dataset(path))

    def discover_datasets(self, datasets_dir: str | Path | None = None) -> List[Path]:
        """Find all .jsonl files in the datasets directory."""
        if datasets_dir is None:
            datasets_dir = Path(__file__).parent / "datasets"
        datasets_dir = Path(datasets_dir)
        if not datasets_dir.is_dir():
            return []
        return sorted(datasets_dir.glob("*.jsonl"))
