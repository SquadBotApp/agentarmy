#!/bin/bash
set -e
cd "$(dirname "$0")/docker"
echo "[SpaceOS] Building Docker image..."
docker-compose build
echo "[SpaceOS] Starting services..."
docker-compose up -d
echo "[SpaceOS] Loading config and connecting to telemetry..."
# (Optional) Add health checks or logs here
echo "[SpaceOS] Deployment complete. Access dashboard at http://localhost:8080"
