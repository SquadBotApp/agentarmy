# AgentArmy Integration with Replit Agents and Voiceflow

## Overview
This document tracks the integration of Replit Agents and Voiceflow Conversational AI into the AgentArmy system.

## Tasks

### Phase 1: Replit Integration ✅
- [x] 1.1 Create ReplitProvider class in core/providers/
- [x] 1.2 Create ReplitAgentAdapter in runtime_core/adapters/
- [x] 1.3 Update main.py to include Replit in provider router
- [x] 1.4 Add environment configuration (.env.example)
- [x] 1.5 Update docker-compose.yml with Replit env vars

### Phase 2: Voiceflow Integration ✅
- [x] 2.1 Create VoiceflowProvider class in core/providers/
- [x] 2.2 Create VoiceflowAdapter in runtime_core/adapters/
- [x] 2.3 Update main.py to include Voiceflow in provider router
- [x] 2.4 Update docker-compose.yml with Voiceflow env vars

## Environment Variables
Set these in your .env file:

### Replit Agents
- `REPLIT_API_KEY` - Your Replit API key
- `REPLIT_WORKSPACE_ID` - Your workspace ID
- `REPLIT_AGENT_ID` - Agent to use (default: "default")
- `REPLIT_TIMEOUT_SECONDS` - Session timeout (default: 120)

### Voiceflow Conversational AI
- `VOICEFLOW_API_KEY` - Your Voiceflow API key
- `VOICEFLOW_VERSION_ID` - Version ID (default: "production")
- `VOICEFLOW_TIMEOUT_SECONDS` - Request timeout (default: 30)

## Usage
- Replit provider is automatically added when `REPLIT_API_KEY` is set
- Voiceflow provider is automatically added when `VOICEFLOW_API_KEY` is set
- Both providers use PERFORMANCE_BASED routing strategy

