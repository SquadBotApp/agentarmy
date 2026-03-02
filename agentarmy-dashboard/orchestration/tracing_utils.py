"""
Tracing utilities for AgentArmy orchestration.
Provides OpenTelemetry span helpers for agents, LLM calls, and orchestration steps.
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Any, Dict, Generator, Optional

# Conditionally import OpenTelemetry if tracing is enabled
_TRACING_ENABLED = os.getenv('ENABLE_TRACING', 'false').lower() == 'true'

if _TRACING_ENABLED:
    from opentelemetry import trace  # type: ignore[import]
    from opentelemetry.trace import Status, StatusCode, Span  # type: ignore[import]
    _tracer = trace.get_tracer("agentarmy.orchestration", "1.0.0")
else:
    _tracer = None


def is_tracing_enabled() -> bool:
    """Check if tracing is enabled."""
    return _TRACING_ENABLED


@contextmanager
def trace_span(
    name: str,
    attributes: Optional[Dict[str, Any]] = None,
    kind: str = "internal"
) -> Generator[Optional[Any], None, None]:
    """
    Context manager for creating a traced span.
    
    Args:
        name: Span name (e.g., "agent.execute", "llm.call")
        attributes: Key-value attributes to attach to the span
        kind: Span kind ("internal", "client", "server", "producer", "consumer")
    
    Yields:
        The span object (or None if tracing disabled)
    """
    if not _TRACING_ENABLED or _tracer is None:
        yield None
        return
    
    kind_map = {
        "internal": trace.SpanKind.INTERNAL,
        "client": trace.SpanKind.CLIENT,
        "server": trace.SpanKind.SERVER,
        "producer": trace.SpanKind.PRODUCER,
        "consumer": trace.SpanKind.CONSUMER,
    }
    span_kind = kind_map.get(kind, trace.SpanKind.INTERNAL)
    
    with _tracer.start_as_current_span(name, kind=span_kind) as span:
        if attributes:
            for key, value in attributes.items():
                # OpenTelemetry only accepts str, bool, int, float, or sequences of these
                if isinstance(value, (str, bool, int, float)):
                    span.set_attribute(key, value)
                elif isinstance(value, (list, tuple)):
                    span.set_attribute(key, str(value))
                else:
                    span.set_attribute(key, str(value))
        try:
            yield span
        except Exception as exc:
            span.set_status(Status(StatusCode.ERROR, str(exc)))
            span.record_exception(exc)
            raise


def trace_agent_execution(
    agent_id: str,
    agent_name: str,
    task_id: str,
    task_description: str = ""
):
    """Create a span for agent task execution."""
    return trace_span(
        f"agent.execute.{agent_id}",
        attributes={
            "agent.id": agent_id,
            "agent.name": agent_name,
            "task.id": task_id,
            "task.description": task_description[:200] if task_description else "",
        }
    )


def trace_llm_call(
    model: str,
    provider: str = "unknown",
    prompt_tokens: int = 0,
    max_tokens: int = 0
):
    """Create a span for LLM API calls with gen_ai semantic conventions."""
    return trace_span(
        "gen_ai.chat",
        kind="client",
        attributes={
            "gen_ai.system": provider,
            "gen_ai.request.model": model,
            "gen_ai.request.max_tokens": max_tokens,
            "gen_ai.usage.prompt_tokens": prompt_tokens,
        }
    )


def trace_orchestration_step(
    step_name: str,
    job_id: str = "",
    task_count: int = 0,
    decision: str = ""
):
    """Create a span for orchestration decision steps."""
    return trace_span(
        f"orchestration.{step_name}",
        attributes={
            "orchestration.job_id": job_id,
            "orchestration.task_count": task_count,
            "orchestration.decision": decision[:200] if decision else "",
        }
    )


def trace_cpm_calculation(
    job_id: str = "",
    task_count: int = 0,
    critical_path_length: float = 0.0
):
    """Create a span for CPM (Critical Path Method) calculations."""
    return trace_span(
        "orchestration.cpm",
        attributes={
            "orchestration.job_id": job_id,
            "cpm.task_count": task_count,
            "cpm.critical_path_hours": critical_path_length,
        }
    )


def trace_zpe_scoring(
    job_id: str = "",
    zpe_total: float = 0.0,
    components: Optional[Dict[str, float]] = None
):
    """Create a span for ZPE scoring calculations."""
    attrs = {
        "orchestration.job_id": job_id,
        "zpe.total_score": zpe_total,
    }
    if components:
        for key, val in components.items():
            attrs[f"zpe.{key}"] = val
    return trace_span("orchestration.zpe_score", attributes=attrs)


def add_span_event(span: Any, name: str, attributes: Optional[Dict[str, Any]] = None):
    """Add an event to the current span."""
    if span is not None and hasattr(span, 'add_event'):
        span.add_event(name, attributes=attributes or {})


def set_span_attribute(span: Any, key: str, value: Any):
    """Set an attribute on the current span."""
    if span is not None and hasattr(span, 'set_attribute'):
        if isinstance(value, (str, bool, int, float)):
            span.set_attribute(key, value)
        else:
            span.set_attribute(key, str(value))


def mark_span_error(span: Any, error: Exception):
    """Mark the current span as errored."""
    if span is not None and hasattr(span, 'set_status'):
        from opentelemetry.trace import Status, StatusCode  # type: ignore[import]
        span.set_status(Status(StatusCode.ERROR, str(error)))
        span.record_exception(error)
