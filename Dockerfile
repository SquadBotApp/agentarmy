# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app


# Copy project files
COPY . /app

# Install dependencies
RUN pip install --upgrade pip \
	&& pip install --no-cache-dir -r requirements.txt


# Define environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app:/app/core

# Default command: run CLI help (Option B)
CMD ["python", "-m", "cli.main", "--help"]