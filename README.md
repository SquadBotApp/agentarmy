# Agent Army

**Autonomous AI Agent Orchestration System**

Agent Army is a self-improving, autonomous multi-agent system capable of planning, executing, and reflecting on complex tasks. It features a recursive Möbius loop for strategy, a 3-6-9 expansion logic for scaling, and a live "Matrix" style dashboard.

## Quick Start

1.  **Configuration**:
    Copy `.env.example` to `.env` and set your `MODELSLAB_API_KEY`.
    ```bash
    cp .env.example .env
    ```

2.  **Cleanup (First Run Only)**:
    Run the cleanup script to remove legacy development files.
    ```bash
    python cleanup.py
    ```

3.  **Launch**:
    *   **Docker (Recommended)**: `docker-compose up --build`
    *   **Local**: `./launch_agentarmy.sh`

## Dashboard
Access the live command center at: **http://localhost:5001**