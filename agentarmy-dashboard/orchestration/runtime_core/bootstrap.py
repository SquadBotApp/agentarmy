"""
AgentArmy Runtime Bootstrap
--------------------------
Entry point to start the AgentArmy OS runtime.
"""
from .runtime_orchestrator import RuntimeOrchestrator
from ..education_center.registry import register_education_center

def main():
    orchestrator = RuntimeOrchestrator()
    register_education_center(orchestrator)
    try:
        orchestrator.start()
    except KeyboardInterrupt:
        print("[AgentArmy] Shutting down...")
        orchestrator.stop()

if __name__ == "__main__":
    main()
