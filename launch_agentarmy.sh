#!/bin/bash
# AgentArmy Launch Script

set -e

echo "--- Starting AgentArmy System ---"

# Start the Python orchestration core and dashboard in the background.
# Logs will be saved to agentarmy.log.
nohup python3 agentarmy.py > agentarmy.log 2>&1 &

# Give the server a moment to start up
echo "Waiting for services to initialize..."
sleep 5

# Health check for the dashboard
echo "Performing health check on dashboard..."
curl -f http://localhost:5001/state > /dev/null && echo "Health check PASSED." || (echo "Health check FAILED. Check agentarmy.log for details." && exit 1)

echo "AgentArmy launch complete!"
echo "Dashboard is running at http://localhost:5001"
