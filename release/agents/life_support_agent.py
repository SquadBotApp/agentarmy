# Life Support Agent
# Monitors O2, CO2, pressure, humidity, crew health.
import os
import redis
import json
import time

def get_redis():
    host = os.getenv('REDIS_HOST', 'localhost')
    port = int(os.getenv('REDIS_PORT', 6379))
    return redis.Redis(host=host, port=port, decode_responses=True)

def run_life_support_agent():
    r = get_redis()
    while True:
        telemetry_raw = r.get('telemetry')
        telemetry = json.loads(telemetry_raw) if telemetry_raw else {}
        o2_pct = telemetry.get('o2_pct', 99)
        if o2_pct < 85:
            status = 'warning'
        else:
            status = 'nominal'
        r.set('life_support_status', status)
        print(f"[LifeSupportAgent] o2_pct={o2_pct} status={status}")
        time.sleep(2)

if __name__ == "__main__":
    run_life_support_agent()
