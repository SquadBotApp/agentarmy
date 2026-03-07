# AgentArmy Backend

This folder contains all backend Python code for AgentArmyOS, including the Sim Engine, agent logic, and API utilities.

## Structure
- `sim_engine.py` — Simulation engine core
- `agent.py` — Agent class and logic
- `modelslab_llm.py` — ModelsLab LLM API utility
- `app.py` — Main entrypoint to run the Sim Engine
- `task.py` — Task logic (if used)
- `requirements.txt` — Python dependencies

## Usage
1. Create and activate a virtual environment:
   ```sh
   python3 -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
2. Run the Sim Engine:
   ```sh
   python app.py
   ```

You should see output confirming the engine is running (tier actions, paywall, environment state, etc).
