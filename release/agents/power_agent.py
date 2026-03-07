# Power Agent
# Monitors and manages power systems, battery, solar.
import os
import redis
import json
import time

def get_redis():
    host = os.getenv('REDIS_HOST', 'localhost')
    port = int(os.getenv('REDIS_PORT', 6379))
    return redis.Redis(host=host, port=port, decode_responses=True)

def run_power_agent():
    r = get_redis()
    while True:
        telemetry_raw = r.get('telemetry')
        telemetry = json.loads(telemetry_raw) if telemetry_raw else {}
        # Example logic: check power level
        power_kw = telemetry.get('power_kw', 10)
        battery_pct = telemetry.get('battery_pct', 100)
        if power_kw < 3 or battery_pct < 20:
            status = 'critical'
        elif power_kw < 5 or battery_pct < 50:
            status = 'warning'
        else:
            status = 'nominal'
        r.set('power_status', status)
        print(f"[PowerAgent] power_kw={power_kw} battery_pct={battery_pct} status={status}")
        time.sleep(2)

if __name__ == "__main__":
    run_power_agent()
