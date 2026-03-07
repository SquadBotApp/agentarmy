#!/bin/bash

# Agent Army OS - One-Click Docker Launcher
# Launches backend, dashboard, tests, and watches for changes

echo ""
echo "===================================="
echo " Agent Army OS - Docker Launcher"
echo "===================================="
echo ""
echo "Starting all services..."
echo "Backend:   http://localhost:5001"
echo "Dashboard: http://localhost:3000"
echo ""

docker compose up --build --watch
