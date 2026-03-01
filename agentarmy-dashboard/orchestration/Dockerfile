
FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Set environment
ENV PYTHONUNBUFFERED=1
ENV ORCHESTRATION_PORT=5000

# Create non-root user
RUN useradd -m -u 1000 orchestration && chown -R orchestration:orchestration /app
USER orchestration

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:5000/health')" || exit 1

# Expose port
EXPOSE 5000

# Run
CMD ["python", "app.py"]
