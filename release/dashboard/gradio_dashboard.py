# SpaceOS Dashboard UI
# Provides HITL control and real-time agent status
import gradio as gr
import redis
import os
import json

def get_redis():
    host = os.getenv('REDIS_HOST', 'localhost')
    port = int(os.getenv('REDIS_PORT', 6379))
    return redis.Redis(host=host, port=port, decode_responses=True)

def get_status():
    r = get_redis()
    status = {}
    for key in ['power_status', 'thermal_status', 'life_support_status', 'attitude_orbit_status', 'payload_status', 'logistics_status']:
        status[key] = r.get(key) or 'unknown'
    telemetry_raw = r.get('telemetry')
    telemetry = json.loads(telemetry_raw) if telemetry_raw else {}
    return status, telemetry

def set_telemetry(power_kw, battery_pct, temp_c, o2_pct, collision_alert, payload_ok, inventory_ok):
    r = get_redis()
    telemetry = {
        'power_kw': power_kw,
        'battery_pct': battery_pct,
        'temp_c': temp_c,
        'o2_pct': o2_pct,
        'collision_alert': collision_alert,
        'payload_ok': payload_ok,
        'inventory_ok': inventory_ok
    }
    r.set('telemetry', json.dumps(telemetry))
    return 'Telemetry updated!'

def dashboard_ui():
    with gr.Blocks() as demo:
        gr.Markdown("# SpaceOS Agent Dashboard\nMonitor and control all agents in real time.")
        with gr.Row():
            status_box = gr.JSON(label="Agent Status")
            telemetry_box = gr.JSON(label="Current Telemetry")
        refresh_btn = gr.Button("Refresh Status")
        refresh_btn.click(lambda: get_status(), outputs=[status_box, telemetry_box])
        gr.Markdown("## Update Telemetry (HITL Override)")
        with gr.Row():
            power_kw = gr.Number(label="Power (kW)", value=10)
            battery_pct = gr.Number(label="Battery (%)", value=100)
            temp_c = gr.Number(label="Temp (C)", value=22)
            o2_pct = gr.Number(label="O2 (%)", value=99)
        with gr.Row():
            collision_alert = gr.Checkbox(label="Collision Alert", value=False)
            payload_ok = gr.Checkbox(label="Payload OK", value=True)
            inventory_ok = gr.Checkbox(label="Inventory OK", value=True)
        submit_btn = gr.Button("Send Telemetry")
        submit_btn.click(
            set_telemetry,
            inputs=[power_kw, battery_pct, temp_c, o2_pct, collision_alert, payload_ok, inventory_ok],
            outputs=[]
        )
        demo.load(get_status, outputs=[status_box, telemetry_box])
    return demo

if __name__ == "__main__":
    dashboard_ui().launch(server_port=8080, server_name="0.0.0.0")
