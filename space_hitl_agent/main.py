"""
Commercial Space HITL AI Agent - Main Entry Point

This is the core LangGraph-based agent for commercial space stations.
It implements the Human-in-the-Loop (HITL) pattern for safe autonomous operations.

Supports: Haven-1, Axiom Station, Starlab, Orbital Reef, and generic LEO stations
"""

import os
from typing import Dict, Any, Optional
from datetime import datetime

# LangGraph imports
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

# Import state and nodes
from state import SpaceState, create_initial_state
from nodes.telemetry import ingest_telemetry
from nodes.analyzer import analyze
try:
    from nodes.power_analyzer import power_analyze
    from nodes.science_analyzer import science_analyze
    from nodes.logistics_analyzer import logistics_analyze
except ImportError:
    import importlib.util, sys, os
    base = os.path.dirname(__file__)
    sys.path.insert(0, base)
    power_analyzer = importlib.util.spec_from_file_location("power_analyzer", os.path.join(base, "nodes", "power_analyzer.py"))
    power_mod = importlib.util.module_from_spec(power_analyzer)
    power_analyzer.loader.exec_module(power_mod)
    power_analyze = power_mod.power_analyze
    science_analyzer = importlib.util.spec_from_file_location("science_analyzer", os.path.join(base, "nodes", "science_analyzer.py"))
    science_mod = importlib.util.module_from_spec(science_analyzer)
    science_analyzer.loader.exec_module(science_mod)
    science_analyze = science_mod.science_analyze
    logistics_analyzer = importlib.util.spec_from_file_location("logistics_analyzer", os.path.join(base, "nodes", "logistics_analyzer.py"))
    logistics_mod = importlib.util.module_from_spec(logistics_analyzer)
    logistics_analyzer.loader.exec_module(logistics_mod)
    logistics_analyze = logistics_mod.logistics_analyze
from nodes.human_approval import request_human_approval, process_human_response
from nodes.executor import execute_action, create_execution_report


def create_space_agent(station_type: str = "generic", simulation_mode: bool = True) -> StateGraph:
    """
    Create the Commercial Space HITL Agent graph.
    
    Args:
        station_type: Type of space station (haven-1, axiom, starlab, generic)
        simulation_mode: If True, use simulated telemetry data
        
    Returns:
        Compiled LangGraph StateGraph
    """
    # Create the graph
    graph = StateGraph(SpaceState)
    
    # Add nodes
    graph.add_node("ingest", lambda state: {**state, **ingest_telemetry({**state, "station_type": station_type, "simulation_mode": simulation_mode})})
    # Multi-agent analyzers
    def multi_analyze(state):
        # Run all analyzers and aggregate results
        base = analyze(state)
        power = power_analyze(state)
        science = science_analyze(state)
        logistics = logistics_analyze(state)
        return {**state, **base, **power, **science, **logistics}
    graph.add_node("analyze", multi_analyze)
    graph.add_node("human_approval", request_human_approval)
    graph.add_node("execute", execute_action)
    # Define the flow
    graph.add_edge(START, "ingest")
    graph.add_edge("ingest", "analyze")
    graph.add_edge("analyze", "human_approval")
    # Conditional edge: execute only if approved
    graph.add_conditional_edges(
        "human_approval",
        should_execute,
        {
            "execute": "execute",
            "skip": END
        }
    )
    graph.add_edge("execute", END)
    
    # Compile with checkpointer for persistence
    checkpointer = MemorySaver()
    app = graph.compile(checkpointer=checkpointer)
    
    return app


def should_execute(state: Dict[str, Any]) -> str:
    """
    Determine whether to execute the action or skip.
    
    Returns:
        "execute" if approved, "skip" otherwise
    """
    if state.get("human_approval") is True:
        return "execute"
    return "skip"


def run_mission_cycle(
    app,
    config: Dict[str, Any],
    human_response: Optional[str] = None,
    initial_state: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Run a single mission cycle.
    
    Args:
        app: Compiled LangGraph application
        config: Configuration for this run (thread_id, etc.)
        human_response: Optional human response for approval
        initial_state: Optional initial state
        
    Returns:
        Final state after the cycle
    """
    # Prepare initial state
    if initial_state is None:
        initial_state = create_initial_state()
    
    # Add metadata
    initial_state["station_type"] = initial_state.get("station_type", "generic")
    initial_state["mission_id"] = initial_state.get("mission_id", f"mission-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
    
    # Run the agent
    if human_response:
        # If we have a human response, process it
        # This is used when resuming from an interrupt
        pass
    
    # Stream through the graph
    final_state = None
    for chunk in app.stream(initial_state, config):
        print(f"📊 Cycle update: {list(chunk.keys())}")
        final_state = chunk
    
    return final_state


def run_continuous_mission(
    station_type: str = "generic",
    cycle_interval: float = 10.0,
    max_cycles: Optional[int] = None
):
    """
    Run a continuous mission loop.
    
    Args:
        station_type: Type of space station
        cycle_interval: Time between cycles (seconds)
        max_cycles: Maximum number of cycles (None for infinite)
    """
    import time
    
    print(f"🚀 Starting continuous mission for {station_type}")
    print("=" * 50)
    
    app = create_space_agent(station_type=station_type)
    config = {"configurable": {"thread_id": f"{station_type}-mission-{datetime.now().strftime('%Y%m%d')}"}}
    
    cycle_count = 0
    while max_cycles is None or cycle_count < max_cycles:
        cycle_count += 1
        print(f"\n🔄 Cycle {cycle_count}")
        print("-" * 30)
        
        try:
            result = run_mission_cycle(app, config)
            print(f"✅ Cycle {cycle_count} completed")
            
            # Print summary
            if result:
                last_state = list(result.values())[-1] if result else {}
                print(f"   Phase: {last_state.get('mission_phase', 'unknown')}")
                print(f"   Anomaly: {last_state.get('anomaly', 'none')}")
                print(f"   Approved: {last_state.get('human_approval')}")
            
        except Exception as e:
            print(f"❌ Cycle {cycle_count} failed: {e}")
        
        # Wait before next cycle
        if max_cycles is None or cycle_count < max_cycles:
            time.sleep(cycle_interval)
    
    print("\n🏁 Mission complete")


# Example usage
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Commercial Space HITL AI Agent")
    parser.add_argument("--station", choices=["haven-1", "axiom", "starlab", "generic"], default="haven-1", help="Space station type")
    parser.add_argument("--cycles", type=int, default=5, help="Number of cycles to run")
    parser.add_argument("--interval", type=float, default=5.0, help="Interval between cycles (seconds)")
    
    args = parser.parse_args()
    
    print(f"""
🛰️ Commercial Space HITL AI Agent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Station: {args.station}
Cycles:  {args.cycles}
Interval: {args.interval}s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    """)
    
    run_continuous_mission(
        station_type=args.station,
        cycle_interval=args.interval,
        max_cycles=args.cycles
    )
