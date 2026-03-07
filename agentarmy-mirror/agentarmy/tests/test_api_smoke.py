import pytest
import requests

def test_api_provider_smoke():
    # Check health endpoint, skip if not running
    try:
        r = requests.get("http://127.0.0.1:8000/health", timeout=2)
    except Exception:
        pytest.skip("API server not running on localhost:8000")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"
    # Check agents endpoint
    r2 = requests.get("http://127.0.0.1:8000/agents", timeout=2)
    assert r2.status_code == 200
    assert isinstance(r2.json(), list)
