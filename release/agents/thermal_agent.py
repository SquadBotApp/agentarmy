# Thermal Agent
# Controls thermal loops, radiators, heaters.
import os
import redis
import json
import time

def get_redis():
    host = os.getenv('REDIS_HOST', 'localhost')
    port = int(os.getenv('REDIS_PORT', 6379))
    return redis.Redis(host=host, port=port, decode_responses=True)

def run_thermal_agent():
    r = get_redis()
    while True:
        telemetry_raw = r.get('telemetry')
        telemetry = json.loads(telemetry_raw) if telemetry_raw else {}
        temp_c = telemetry.get('temp_c', 22)
        if temp_c > 30:
            status = 'warning'
        elif temp_c < 10:
            status = 'warning'
        else:
            status = 'nominal'
        r.set('thermal_status', status)
        print(f"[ThermalAgent] temp_c={temp_c} status={status}")
        time.sleep(2)

if __name__ == "__main__":
    run_thermal_agent()
