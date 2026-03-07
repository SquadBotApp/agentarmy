# Payload Agent
# Orchestrates experiments, payload health, data.
import os
import redis
import json
import time

def get_redis():
    host = os.getenv('REDIS_HOST', 'localhost')
    port = int(os.getenv('REDIS_PORT', 6379))
    return redis.Redis(host=host, port=port, decode_responses=True)

def run_payload_agent():
    r = get_redis()
    while True:
        telemetry_raw = r.get('telemetry')
        telemetry = json.loads(telemetry_raw) if telemetry_raw else {}
        payload_ok = telemetry.get('payload_ok', True)
        if not payload_ok:
            status = 'warning'
        else:
            status = 'nominal'
        r.set('payload_status', status)
        print(f"[PayloadAgent] payload_ok={payload_ok} status={status}")
        time.sleep(2)

if __name__ == "__main__":
    run_payload_agent()
