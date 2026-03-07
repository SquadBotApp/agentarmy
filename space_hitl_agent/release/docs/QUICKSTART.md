# SpaceOS Agent - Quick Start Guide

## Overview
SpaceOS Agent is a mission-grade, multi-agent AI system for commercial space station operations with Human-in-the-Loop (HITL) safety controls.

## Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- Python 3.11+ (for local development)

## Quick Start - Docker Deployment

### 1. Clone and Navigate
```bash
cd space_hitl_agent/release
```

### 2. Configure Environment
```bash
# Copy environment template
cp ../config/env.example .env

# Edit with your API keys
nano .env
```

### 3. Deploy with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Quick Start - Local Development

### 1. Install Dependencies
```bash
pip install -r ../../requirements.txt
```

### 2. Run the Agent
```bash
# Run with default settings (Haven-1, simulation mode)
python ../../main.py --station haven-1 --cycles 5

# Run with specific profile
python ../../main.py --station axiom --profile crewed
```

### 3. Launch Dashboard
```bash
python -m ui.dashboard --station haven-1 --port 7860
```

## Configuration Profiles

### Available Profiles
| Profile | Description | Use Case |
|---------|-------------|----------|
| `uncrewed` | Maximum automation | Uncrewed stations |
| `crewed` | Human oversight | Stations with crew |
| `experiment` | Science focus | Research operations |
| `docking` | Approach focus | Docking operations |
| `safe_mode` | Maximum safety | Emergency operations |

### Using Profiles
```bash
# Set profile via environment
export PROFILE=crewed

# Or in docker-compose.yml
environment:
  - PROFILE=crewed
```

## Architecture

### Multi-Agent System
SpaceOS runs 6 specialized agents in parallel:
- **Power Agent** - Solar arrays, batteries, power distribution
- **Thermal Agent** - Radiator control, heat loops
- **Life Support Agent** - Pressure, O₂, CO₂, humidity
- **Attitude Agent** - Station-keeping, docking
- **Payload Agent** - Science experiments
- **Logistics Agent** - Inventory, resupply

### Safety Features
- **No-go zones**: Hard limits that cannot be overridden
- **Action cooldowns**: Prevent rapid repeated actions
- **Two-person approval**: Required for life-support actions
- **Audit logging**: Full decision trail for compliance

## Telemetry Sources

### Supported Stations
- Haven-1 (Vast)
- Axiom Station
- ISS (real-time position)
- Starlink constellation

### External Data
- ISS position (api.open-notify.org)
- NORAD orbital elements
- Ground station comms windows

## Troubleshooting

### Agent Not Starting
```bash
# Check Docker logs
docker-compose logs spaceos-agent

# Verify API keys
cat .env | grep API
```

### Dashboard Not Loading
```bash
# Check port availability
netstat -tulpn | grep 7860

# Try different port
python -m ui.dashboard --port 8080
```

## Support
- Documentation: `/docs/`
- API Reference: `/docs/API_REFERENCE.md`
- Configuration: `/config/profiles.yaml`

