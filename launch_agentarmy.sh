#!/bin/bash
# AgentArmyOS Automated Launch Script for Kali Linux

set -e

# Clone repo if not present
git clone https://github.com/SquadBotApp/agentarmy.git || true
cd agentarmy

# Install dashboard/server dependencies
cd agentarmy-dashboard/server
npm install

# Set environment variables (edit as needed)
export PORT=4000
export JWT_SECRET=agentarmy-secret-2024
export NODE_ENV=development
export OPENAI_API_KEY=your-openai-key
export ANTHROPIC_API_KEY=your-anthropic-key

# Start AgentArmyOS server in background
nohup npm start &

# Wait for server to start
sleep 5

# Health check
curl http://localhost:4000/health || echo "Server health check failed."

# (Optional) Start ngrok if installed
if command -v ngrok &> /dev/null; then
  nohup ngrok http 4000 &
  echo "ngrok tunnel started. Check your ngrok dashboard for the public URL."
else
  echo "ngrok not installed. Skipping tunnel setup."
fi

cd ../../..
echo "AgentArmyOS launch complete!"
