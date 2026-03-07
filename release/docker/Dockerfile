# SpaceOS Agent Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY ../../space_hitl_agent /app/space_hitl_agent
COPY ../../requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "-m", "space_hitl_agent.main"]
