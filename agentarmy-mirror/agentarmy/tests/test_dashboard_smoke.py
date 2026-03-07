
import pytest
import requests
import time

def test_dashboard_provider_smoke(monkeypatch):
    # Wait for dashboard to be up (assume it's running on localhost:5001)
    for _ in range(10):
        try:
            r = requests.get("http://127.0.0.1:5001/state", timeout=1)
            if r.status_code == 200:
                break
        except Exception:
            time.sleep(0.5)
    else:
        pytest.skip("Dashboard not running on localhost:5001")
    data = r.json()
    # Check that agents and tasks are present and log is a list
    assert isinstance(data["agents"], list)
    assert isinstance(data["tasks"], list)
    assert isinstance(data["log"], list)
    # Check for at least one agent and one log entry
    assert len(data["agents"]) > 0
    assert len(data["log"]) > 0
