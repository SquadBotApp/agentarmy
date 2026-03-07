import sys
import http.client

def check_health():
    """
    Performs a health check on the local dashboard server.
    Exits with status 0 on success, 1 on failure.
    """
    try:
        conn = http.client.HTTPConnection("localhost", 5001, timeout=5)
        conn.request("GET", "/state")
        response = conn.getresponse()
        if 200 <= response.status < 300:
            sys.exit(0) # Success
    except Exception as e:
        print(f"Health check failed: {e}", file=sys.stderr)
    
    sys.exit(1) # Failure

if __name__ == "__main__":
    check_health()