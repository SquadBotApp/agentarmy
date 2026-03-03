#!/usr/bin/env python3
"""
Lightweight orchestration HTTP server using Flask (no Rust dependencies)
Wraps orchestrator.py logic for REST API access
"""
import json
import logging
from datetime import datetime
from typing import Dict, Any
from uuid import uuid4

try:
    from flask import Flask, request, jsonify  # type: ignore[import]
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

from orchestrator import orchestrate as run_orchestrator
from executor import RegistryAgentExecutor
from job_runner import JobRunner
from agents import PlannerAgent, ExecutorAgent, CriticAgent, GovernorAgent
from frameworks import SUPPORTED_FRAMEWORKS
from integrations import (
    SUPPORTED_PLATFORMS,
    MOBILE_VENDOR_TARGETS,
    SOCIAL_PROFILE_TEMPLATES,
    SSH_PROFILE_TEMPLATES,
    COMMS_ALIAS_TARGETS,
    build_efficiency_plan,
    build_social_intel,
    build_ssh_plan,
    broadcast_comms,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__) if FLASK_AVAILABLE else None

# In-memory job store (TODO: Redis/Postgres)
jobs: Dict[str, Dict[str, Any]] = {}

AUTH_SCHEME = 'Bearer '
AUTH_ERROR = "Missing or invalid authorization"

agent_registry = {
    "planner": PlannerAgent(),
    "executor": ExecutorAgent(),
    "critic": CriticAgent(),
    "governor": GovernorAgent(),
}
job_runner = JobRunner(
    orchestrate_fn=run_orchestrator,
    executor=RegistryAgentExecutor(agent_registry),
)


def create_job_id() -> str:
    """Generate unique job ID"""
    return f"job-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid4())[:8]}"


# ============ Health Check ============

if FLASK_AVAILABLE:
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            "status": "healthy",
            "version": "0.1.0",
            "backend": "lightweight (Flask)",
        })


if FLASK_AVAILABLE:
    @app.route('/capabilities', methods=['GET'])
    def capabilities():
        auth = request.headers.get('Authorization', '')
        if not auth.startswith(AUTH_SCHEME):
            return jsonify({"error": AUTH_ERROR}), 401
        return jsonify({
            "frameworks": sorted(SUPPORTED_FRAMEWORKS),
            "platforms": SUPPORTED_PLATFORMS,
            "mobile_vendors": MOBILE_VENDOR_TARGETS,
            "social_profiles": sorted(SOCIAL_PROFILE_TEMPLATES.keys()),
            "ssh_profiles": sorted(SSH_PROFILE_TEMPLATES.keys()),
            "comms_aliases": COMMS_ALIAS_TARGETS,
        })

if FLASK_AVAILABLE:
    @app.route('/efficiency/plan', methods=['POST'])
    def efficiency_plan():
        auth = request.headers.get('Authorization', '')
        if not auth.startswith(AUTH_SCHEME):
            return jsonify({"error": AUTH_ERROR}), 401
        payload = request.get_json() or {}
        return jsonify(build_efficiency_plan(payload if isinstance(payload, dict) else {}))

if FLASK_AVAILABLE:
    @app.route('/social/intel/analyze', methods=['POST'])
    def social_intel_analysis():
        auth = request.headers.get('Authorization', '')
        if not auth.startswith(AUTH_SCHEME):
            return jsonify({"error": AUTH_ERROR}), 401
        payload = request.get_json() or {}
        return jsonify(build_social_intel(payload if isinstance(payload, dict) else {}))

if FLASK_AVAILABLE:
    @app.route('/ssh/plan', methods=['POST'])
    def ssh_plan():
        auth = request.headers.get('Authorization', '')
        if not auth.startswith(AUTH_SCHEME):
            return jsonify({"error": AUTH_ERROR}), 401
        payload = request.get_json() or {}
        return jsonify(build_ssh_plan(payload if isinstance(payload, dict) else {}))

if FLASK_AVAILABLE:
    @app.route('/comms/broadcast', methods=['POST'])
    def comms_broadcast():
        auth = request.headers.get('Authorization', '')
        if not auth.startswith(AUTH_SCHEME):
            return jsonify({"error": AUTH_ERROR}), 401
        payload = request.get_json() or {}
        result = broadcast_comms(payload if isinstance(payload, dict) else {})
        if result.get("status") == "failed":
            return jsonify(result), 400
        return jsonify(result)


# ============ Orchestration ============

if FLASK_AVAILABLE:
    @app.route('/orchestrate', methods=['POST'])
    def orchestrate_endpoint():
        """
        Orchestration endpoint supporting both payload shapes:
        1. Legacy: {task, priority, context, model_preferences}
        2. Advanced: {job, state, previous_zpe}
        """
        try:
            payload = request.get_json() or {}
            
            # Validate authorization (basic)
            auth = request.headers.get('Authorization', '')
            if not auth.startswith(AUTH_SCHEME):
                return jsonify({"error": AUTH_ERROR}), 401

            job_id = create_job_id()
            created_at = datetime.now().isoformat()

            # Store job record
            jobs[job_id] = {
                "job_id": job_id,
                "status": "pending",
                "created_at": created_at,
                "completed_at": None,
                "result": None,
                "error": None,
            }

            try:
                # Build orchestrator payload
                orch_payload: Dict[str, Any] = {}

                if payload.get('job'):
                    # Already in orchestrator format
                    orch_payload = payload
                elif payload.get('task'):
                    # Legacy format—translate to orchestrator
                    orch_payload = {
                        "job": {
                            "goal": payload.get('task', ''),
                            "constraints": payload.get('context', {}) or {},
                            "deadline_hours": None,
                            "budget": None,
                            "risk_tolerance": 0.5,
                        },
                        "state": payload.get('context', {}).get('state', {'tasks': [], 'history': []}),
                        "previous_zpe": float(payload.get('context', {}).get('previous_zpe', 0.5)),
                        "framework": payload.get('framework', payload.get('context', {}).get('framework', 'native')),
                    }
                else:
                    raise ValueError("Payload must contain 'job' or 'task' field")

                # Call full workflow runner (orchestrate -> execute -> evaluate)
                logger.info(f"[Job {job_id}] Running workflow...")
                import asyncio
                workflow_result = asyncio.run(job_runner.run_workflow(orch_payload))
                decision = workflow_result.get("decision", {})

                # Update job
                jobs[job_id]["status"] = "completed"
                jobs[job_id]["result"] = {
                    "decision": decision,
                    "execution": workflow_result.get("execution"),
                    "evaluation": workflow_result.get("evaluation"),
                    "integrations": workflow_result.get("integrations"),
                    "metrics": workflow_result.get("metrics"),
                }
                jobs[job_id]["completed_at"] = datetime.now().isoformat()

                logger.info(f"[Job {job_id}] Completed successfully")

                return jsonify(jobs[job_id]), 200

            except Exception as e:
                logger.error(f"[Job {job_id}] Error: {str(e)}")
                jobs[job_id]["status"] = "failed"
                jobs[job_id]["error"] = str(e)
                jobs[job_id]["completed_at"] = datetime.now().isoformat()
                return jsonify(jobs[job_id]), 500

        except Exception as e:
            logger.error(f"Request error: {str(e)}")
            return jsonify({"error": str(e)}), 400


# ============ Job Status ============

if FLASK_AVAILABLE:
    @app.route('/jobs/<job_id>', methods=['GET'])
    def get_job(job_id: str):
        """Get job status"""
        auth = request.headers.get('Authorization', '')
        if not auth.startswith(AUTH_SCHEME):
            return jsonify({"error": AUTH_ERROR}), 401

        if job_id not in jobs:
            return jsonify({"error": f"Job {job_id} not found"}), 404

        return jsonify(jobs[job_id]), 200


if FLASK_AVAILABLE:
    @app.route('/jobs', methods=['GET'])
    def list_jobs():
        """List all jobs (with optional status filter)"""
        auth = request.headers.get('Authorization', '')
        if not auth.startswith(AUTH_SCHEME):
            return jsonify({"error": AUTH_ERROR}), 401

        status = request.args.get('status')
        filtered = [j for j in jobs.values() if not status or j['status'] == status]
        return jsonify(filtered), 200


# ============ Main ============

if __name__ == '__main__':
    if not FLASK_AVAILABLE:
        print("\n✗ Flask not installed. Install with:")
        print("  pip install flask")
        exit(1)

    port = 5000
    print("\n🚀 AgentArmy Orchestration Service (Lightweight)")
    print("   Backend: Flask (no Rust dependencies)")
    print(f"   Running on http://127.0.0.1:{port}")
    print("   Endpoints: /health, /orchestrate, /jobs\n")

    app.run(host='127.0.0.1', port=port, debug=False)
