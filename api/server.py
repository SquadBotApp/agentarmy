# FastAPI endpoints (scaffold)
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/agents")
def list_agents():
    return []

@app.get("/tasks")
def list_tasks():
    return []
