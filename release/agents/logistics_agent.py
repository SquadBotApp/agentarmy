# Logistics Agent
# Manages inventory, resupply, waste, crew logistics.
import os
import redis
import json
import time

def get_redis():
    host = os.getenv('REDIS_HOST', 'localhost')
    port = int(os.getenv('REDIS_PORT', 6379))
    return redis.Redis(host=host, port=port, decode_responses=True)

def run_logistics_agent():
    r = get_redis()
    while True:
        telemetry_raw = r.get('telemetry')
        telemetry = json.loads(telemetry_raw) if telemetry_raw else {}
        inventory_ok = telemetry.get('inventory_ok', True)
        if not inventory_ok:
            status = 'warning'
        else:
            status = 'nominal'
        r.set('logistics_status', status)
        print(f"[LogisticsAgent] inventory_ok={inventory_ok} status={status}")
        time.sleep(2)

if __name__ == "__main__":
    run_logistics_agent()
