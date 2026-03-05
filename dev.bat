@echo off
REM Agent Army OS - One-Click Docker Launcher
REM Launches backend, dashboard, and watches for changes

echo.
echo ====================================
echo  Agent Army OS - Docker Launcher
echo ====================================
echo.
echo Starting all services...
echo Backend:  http://localhost:5001
echo Dashboard: http://localhost:3000
echo.

docker compose up --build --watch

pause
