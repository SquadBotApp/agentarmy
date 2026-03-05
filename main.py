import logging
import argparse
import threading
from dashboard import app, shared_state, lock
import json
import os
import asyncio

from core.orchestration import Orchestrator
from core.expansion import ExpansionManager
from core.mobius import MobiusOrchestrator
from core.reflection import ReflectionEngine
from expansion.universes import Universes
from core.cpm import CPMEngine
from core.intel import CompetitiveIntelligence
from core.compliance import ComplianceEngine
from billing.engine import BillingEngine
from core.bounded_growth import BoundedGrowthGovernor
from optimization.zpe import ZPEngine
from expansion.meta_synthesizer import MetaSynthesizer
from core.recursive import RecursiveEngine

async def main():
    STATE_FILE = "agentarmy_state.json"

    def load_state():
        """Loads the application state from a JSON file if it exists."""
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, 'r') as f:
                    state = json.load(f)
                    logger.info(f"Resuming from saved state in {STATE_FILE}")
                    return state.get('agents'), state.get('tasks'), state.get('log')
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Could not load state file: {e}. Starting fresh.")
        return None, None, None

    def save_state(orchestrator):
        """Saves the application state to a JSON file."""
        state = {
            'agents': orchestrator.agents,
            'tasks': orchestrator.tasks,
            'log': orchestrator.log
        }
        with open(STATE_FILE, 'w') as f:
            json.dump(state, f, indent=2)
        logger.info(f"Application state saved to {STATE_FILE}")

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

    # 2. Load previous state or define initial state
    saved_agents, saved_tasks, saved_log = load_state()
    initial_agents = saved_agents or ["agent_alpha", "agent_beta"]
    initial_tasks = saved_tasks or ["analyze_market_trends", "generate_quarterly_report", "optimize_database_queries"]
    initial_log = saved_log or []
    
    logger.info(f"Initial agents: {initial_agents}")
    logger.info(f"Initial tasks: {initial_tasks}")

    # 3. Instantiate Core Components
    expansion_manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)

    # Provider integration (lazy instantiation)
    def get_provider_router():
        from core.providers.router import ProviderRouter
        from core.providers.base import OpenAIProvider, ClaudeProvider
        return ProviderRouter(
            providers=[OpenAIProvider(), ClaudeProvider()],
            strategy='round_robin'
        )

    provider_router = get_provider_router()
    mobius_orchestrator = MobiusOrchestrator(agents=initial_agents, provider_router=provider_router)
    reflection_engine = ReflectionEngine()
    universes_layer = Universes()
    intel_module = CompetitiveIntelligence()
    compliance_engine = ComplianceEngine()
    billing_engine = BillingEngine()
    growth_governor = BoundedGrowthGovernor(max_population=50)
    zpe_engine = ZPEngine()
    meta_synth = MetaSynthesizer()
    recursive_engine = RecursiveEngine()
    
    # 4. Instantiate the Main Orchestrator
    orchestrator = Orchestrator(
        agents=initial_agents,
        tasks=initial_tasks,
        expansion_manager=expansion_manager,
        mobius=mobius_orchestrator,
        reflection=reflection_engine,
        cpm=cpm_engine,
        meta_synthesizer=meta_synth,
        zpe=zpe_engine,
        universes=universes_layer,
        intel=intel_module,
        compliance=compliance_engine,
        billing_engine=billing_engine,
        bounded_growth_governor=growth_governor,
        shared_state=shared_state,
        lock=lock,
        initial_log=initial_log,
        recursive_engine=recursive_engine
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
        await orchestrator.run(max_cycles=args.cycles)
    except KeyboardInterrupt:
        logger.info("\n--- Orchestration Loop Interrupted by User ---")
    except Exception as e:
        logger.error(f"Critical System Failure: {e}")
    finally:
        # Ensure we always save state and print final stats, even if interrupted
        logger.info("--- Orchestration Loop Finished ---")
        logger.info(f"Final total cost: ${billing_engine.total_billed():.6f}")
        save_state(orchestrator)

if __name__ == "__main__":
    asyncio.run(main())
