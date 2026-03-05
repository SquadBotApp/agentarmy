import json
import time
import matplotlib.pyplot as plt
from agentarmy import agentarmy

def visualize_agentarmy_progress(iterations=10, interval=2):
    """Visualize AgentArmy's progress and performance over time."""
    performance_history = []
    timestamps = []
    for i in range(iterations):
        result = agentarmy.run_full_cycle(
            tasks=["analyze_market", "generate_report", "optimize_strategy"],
            max_depth=3,
            enable_expansion=True,
            enable_compliance=True
        )
        perf = result.get("performance", {})
        performance_history.append(perf.get("score", 0))
        timestamps.append(time.time())
        print(f"Iteration {i+1}: Score={perf.get('score', 0)}")
        time.sleep(interval)
    # Plot
    plt.figure(figsize=(10, 5))
    plt.plot(timestamps, performance_history, marker='o')
    plt.title("AgentArmy Performance Over Time")
    plt.xlabel("Timestamp")
    plt.ylabel("Performance Score")
    plt.grid(True)
    plt.show()

if __name__ == "__main__":
    visualize_agentarmy_progress()
