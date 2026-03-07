# Space HITL Agent - Docker Configuration
# Multi-stage build for production deployment

# ============================================================================
# Base Stage
# ============================================================================
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# ============================================================================
# Production Stage
# ============================================================================
FROM base as production

# Create non-root user for security
RUN groupadd -r agent && useradd -r -g agent agent

# Copy application code
COPY . .

# Set ownership
RUN chown -R agent:agent /app

# Switch to non-root user
USER agent

# Expose port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Default command
CMD ["python", "main.py", "--station", "haven-1", "--port", "7860"]

# ============================================================================
# Development Stage
# ============================================================================
FROM base as development

# Install development dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-asyncio \
    black \
    flake8 \
    mypy

# Copy application code
COPY . .

# Set ownership
RUN chown -R agent:agent /app

# Switch to non-root user
USER agent

# Volume for live code reloading
VOLUME ["/app"]

# Default command - run in dev mode
CMD ["python", "-m", "pip", "install", "-e", ".", "&&", "python", "main.py", "--station", "haven-1"]

