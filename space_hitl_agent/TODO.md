# Space HITL Agent Evolution - TODO

## Overview
Evolve the core agent into a multi-agent, fault-tolerant, mission-grade system for commercial space stations.

## A. Multi-Agent Architecture
- [ ] A1. Thermal Agent - radiator control, heat loops monitoring
- [ ] A2. Life Support Agent - pressure, O₂, CO₂, humidity monitoring
- [ ] A3. Attitude & Orbit Agent - station-keeping, docking prep
- [ ] A4. Payload Agent - experiment orchestration
- [ ] A5. Implement parallel subgraph execution with LangGraph

## B. Real Telemetry Connectors
- [ ] B1. ISS open data feed integration (api.open-notify.org)
- [ ] B2. NORAD/Space-Track orbital data connector
- [ ] B3. Starlink simulated telemetry
- [ ] B4. Haven-1/Axiom simulated telemetry
- [ ] B5. Unified telemetry aggregator

## C. Safety & Compliance Layer
- [ ] C1. No-go zones (hard limits that cannot be overridden)
- [ ] C2. Critical action cooldowns (prevent rapid repeated actions)
- [ ] C3. Two-person approval for life-support actions
- [ ] C4. Action whitelisting
- [ ] C5. Enhanced audit logs with full decision tracing

## D. Mission Timeline Awareness
- [ ] D1. Orbital day/night cycle calculator
- [ ] D2. Comms windows calculator
- [ ] D3. Docking windows calculator
- [ ] D4. Crew schedule integration

## E. Real-Time Dashboard
- [ ] E1. Live telemetry graphs (using matplotlib/plotly)
- [ ] E2. Alert feed with severity levels
- [ ] E3. Approval queue panel
- [ ] E4. Multi-agent status panel
- [ ] E5. Action history with filtering

## F. Productization
- [ ] F1. Dockerfile for containerized deployment
- [ ] F2. Configurable agent profiles (uncrewed, crewed, experiment, docking, safe mode)
- [ ] F3. Plugin system for custom tools/telemetry
- [ ] F4. Full logging and replay system

## Implementation Order
1. Multi-Agent Architecture (A1-A5)
2. Safety & Compliance Layer (C1-C5) - Critical for mission-grade
3. Real Telemetry Connectors (B1-B5)
4. Mission Timeline Awareness (D1-D4)
5. Real-Time Dashboard (E1-E5)
6. Productization (F1-F4)

## Files to Create/Modify
- `nodes/thermal_analyzer.py` - New
- `nodes/life_support_analyzer.py` - New
- `nodes/attitude_analyzer.py` - New
- `nodes/payload_analyzer.py` - New
- `nodes/telemetry_connectors.py` - New
- `nodes/safety_compliance.py` - New
- `nodes/timeline.py` - New
- `state.py` - Update for multi-agent state
- `main.py` - Update for parallel execution
- `ui/dashboard.py` - Update for real-time
- `docker/Dockerfile` - New
- `config/profiles.yaml` - New
- `plugins/__init__.py` - New

