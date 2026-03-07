# SpaceOS Agent - Commercial Space HITL AI Agent

## Overview
SpaceOS Agent is a production-ready Human-in-the-Loop AI agent for commercial space stations (Haven-1, Axiom, Starlab, etc). It ingests real NASA/Starlink telemetry, analyzes with multi-agent teams (power, science, logistics), and provides a human approval dashboard.

## Quickstart
1. Clone the repo and install dependencies:
   ```sh
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
2. Add your API keys to `.env` (see `.env.example`).
3. Run the agent:
   ```sh
   python -m space_hitl_agent.main
   ```
4. For LangGraph Cloud, deploy with `langgraph.yaml`.

## Features
- Real NASA TReK/ISS/Starlink telemetry ingestion
- Multi-agent analysis (power, science, logistics)
- Human-in-the-loop approval (HITL)
- Gradio dashboard UI
- Cloud deployable (LangGraph Cloud)

## Configuration
- `.env` for API keys (see `.env.example`)
- `langgraph.yaml` for cloud deployment

## Packaging
- `pyproject.toml` for pip installable package

## License
Proprietary. Contact for commercial licensing.
