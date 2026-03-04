# Use an official, lightweight Python runtime as a parent image
FROM python:3.9-slim

# Create a non-root user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set the working directory inside the container
WORKDIR /app

# Copy the dependency list
COPY requirements.txt .

# Install the application's dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's code into the container
COPY . .

# Make the healthcheck script executable
RUN chmod +x healthcheck.py

# Switch to the non-root user
USER appuser

# Make port 5001 (the dashboard) available to other containers
EXPOSE 5001

# Add a health check to ensure the dashboard is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["python", "healthcheck.py"]

# The command to run when the container starts.
# The -u flag ensures that logs are printed in real-time.
CMD ["python", "-u", "agentarmy.py"]