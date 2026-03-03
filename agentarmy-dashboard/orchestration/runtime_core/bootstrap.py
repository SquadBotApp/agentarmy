"""
AgentArmy Runtime Bootstrap
--------------------------
Entry point to start the AgentArmy OS runtime.
"""
from .runtime_orchestrator import RuntimeOrchestrator

def main():
    orchestrator = RuntimeOrchestrator()
    try:
        orchestrator.start()
    except KeyboardInterrupt:
        print("[AgentArmy] Shutting down...")
        orchestrator.stop()

if __name__ == "__main__":
    main()
