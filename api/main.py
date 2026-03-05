from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/status")
def status():
    return {"status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy"}

def start_api():
    """Start the API server on port 5000"""
    uvicorn.run("api.main:app", host="0.0.0.0", port=5000, reload=False)

if __name__ == "__main__":
    start_api()
