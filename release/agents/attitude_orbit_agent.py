# Attitude & Orbit Agent
# Handles station-keeping, docking, collision avoidance.
import os
import redis
import json
import time

def get_redis():
    host = os.getenv('REDIS_HOST', 'localhost')
    port = int(os.getenv('REDIS_PORT', 6379))
    return redis.Redis(host=host, port=port, decode_responses=True)

def run_attitude_orbit_agent():
    r = get_redis()
    while True:
        telemetry_raw = r.get('telemetry')
        telemetry = json.loads(telemetry_raw) if telemetry_raw else {}
        collision_alert = telemetry.get('collision_alert', False)
        if collision_alert:
            status = 'critical'
        else:
            status = 'nominal'
        r.set('attitude_orbit_status', status)
        print(f"[AttitudeOrbitAgent] collision_alert={collision_alert} status={status}")
        time.sleep(2)

if __name__ == "__main__":
    run_attitude_orbit_agent()
