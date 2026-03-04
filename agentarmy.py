import logging
import argparse
import threading
from dashboard import app, shared_state, lock

from core.orchestration import Orchestrator
from core.expansion import ExpansionManager
from core.mobius import MobiusOrchestrator
from core.reflection import ReflectionEngine

def main():
    """
    Main entrypoint for the Agent Army application.
    Initializes and runs the orchestration loop.
    """
    # 0. Configure Argument Parser
    parser = argparse.ArgumentParser(description="Run the Agent Army orchestration loop.")
    parser.add_argument(
        '-c', '--cycles',
        type=int,
        help='Number of orchestration cycles to run. Runs indefinitely if not provided.'
    )
    args = parser.parse_args()

    # 1. Configure Rich Logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - [%(name)s] - %(message)s'
    )
    logger = logging.getLogger("AgentArmy")
    
    print(r"""
    _                    _      _                     
   / \   __ _  ___ _ __ | |_   / \   _ __ _ __ ___  _   _ 
  / _ \ / _` |/ _ \ '_ \| __| / _ \ | '__| '_ ` _ \| | | |
 / ___ \ (_| |  __/ | | | |_ / ___ \| |  | | | | | | |_| |
/_/   \_\__, |\___|_| |_|\__/_/   \_\_|  |_| |_| |_|\__, |
        |___/                                       |___/ 
    """)
    logger.info("--- System Online: Initializing Agent Army ---")

    # 2. Define Initial State
    initial_agents = ["agent_alpha", "agent_beta"]
    initial_tasks = ["analyze_market_trends", "generate_quarterly_report", "optimize_database_queries"]
    
    logger.info(f"Initial agents: {initial_agents}")
    logger.info(f"Initial tasks: {initial_tasks}")

    # 3. Instantiate Core Components
    expansion_manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)
    mobius_orchestrator = MobiusOrchestrator(agents=initial_agents)
    reflection_engine = ReflectionEngine()
    
    # 4. Instantiate the Main Orchestrator
    orchestrator = Orchestrator(
        agents=initial_agents,
        tasks=initial_tasks,
        expansion_manager=expansion_manager,
        mobius=mobius_orchestrator,
        reflection=reflection_engine,
        shared_state=shared_state,
        lock=lock
    )
    
    # 5. Start the dashboard in a separate thread
    logger.info("--- Starting Dashboard Web Server ---")
    dashboard_thread = threading.Thread(target=lambda: app.run(host='0.0.0.0', port=5001, debug=False), daemon=True)
    dashboard_thread.start()
    logger.info("Dashboard running on http://127.0.0.1:5001")
    
    run_mode = f"for {args.cycles} cycles" if args.cycles is not None else "indefinitely"
    logger.info(f"--- Starting Orchestration Loop (Running {run_mode}) ---")
    
    try:
        # 6. Run the main loop based on command-line arguments.
        orchestrator.run(max_cycles=args.cycles)
    except KeyboardInterrupt:
        logger.info("\n--- Orchestration Loop Interrupted by User ---")
    except Exception as e:
        logger.error(f"Critical System Failure: {e}")
    finally:
        # Ensure we always print the final stats, even if interrupted
        logger.info("--- Orchestration Loop Finished ---")
        logger.info(f"Final agent pool: {orchestrator.agents}")
        logger.info(f"Final task list: {orchestrator.tasks}")

if __name__ == "__main__":
    main()