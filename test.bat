@echo off
REM Run tests in Docker container

echo Running pytest in Docker...
echo.

docker compose run --rm tests

pause
