curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d':' -f2- | tr -d '"'#!/bin/bash
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

# Pull latest code
git pull

# Add and commit any local changes automatically
git add .
git commit -m "Automated commit before launch" || echo "No changes to commit."

# Push local changes
git push

# Start AgentArmyOS server in background
nohup npm start &

# Start Python orchestration backend
cd ../orchestration
pip install -r requirements.txt
nohup python3 -m uvicorn app:app --port 5000 &
cd ../server

# Wait for server to start
sleep 5

# Health check
curl http://localhost:4000/health || echo "Server health check failed."


# (Optional) Start ngrok if installed and display public URL
if command -v ngrok &> /dev/null; then
  nohup ngrok http 4000 > /dev/null 2>&1 &
  echo "ngrok tunnel started. Waiting for public URL..."
  sleep 3
  NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d':' -f2- | tr -d '"')
  if [ -n "$NGROK_URL" ]; then
    echo "Your public ngrok URL is: $NGROK_URL"
  else
    echo "Could not retrieve ngrok public URL. Check ngrok status manually."
  fi
else
  echo "ngrok not installed. Skipping tunnel setup."
fi

cd ../../..
echo "AgentArmyOS launch complete!"
