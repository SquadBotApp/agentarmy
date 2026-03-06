of"""
Gradio Dashboard for Commercial Space HITL AI Agent

This provides a web interface for:
1. Viewing real-time telemetry
2. Approving/rejecting AI-proposed actions
3. Viewing mission history and logs
"""

import gradio as gr
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Import the agent
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import create_space_agent, run_mission_cycle


class SpaceHITLDashboard:
    """Dashboard for managing the Commercial Space HITL Agent."""
    
    def __init__(self, station_type: str = "haven-1"):
        self.station_type = station_type
        self.app = create_space_agent(station_type=station_type)
        self.config = {"configurable": {"thread_id": f"{station_type}-dashboard"}}
        self.current_state = None
        self.telemetry_history = []
        self.execution_history = []
    
    def run_cycle(self, station_type: str = "haven-1") -> Dict[str, Any]:
        """Run a single mission cycle and return results."""
        try:
            result = run_mission_cycle(
                self.app,
                self.config,
                initial_state={"station_type": station_type}
            )
            
            # Extract state from result
            if result:
                self.current_state = list(result.values())[-1] if result else {}
                
                # Store in history
                if self.current_state.get("telemetry"):
                    self.telemetry_history.append({
                        "timestamp": datetime.now().isoformat(),
                        "data": self.current_state["telemetry"]
                    })
                
                if self.current_state.get("execution_log"):
                    self.execution_history.extend(self.current_state["execution_log"])
            
            return self.current_state or {}
        except Exception as e:
            return {"error": str(e)}
    
    def get_telemetry_display(self) -> str:
        """Format telemetry for display."""
        if not self.current_state or not self.current_state.get("telemetry"):
            return "No telemetry data yet. Run a cycle to start."
        
        telemetry = self.current_state["telemetry"]
        
        # Format as a nice table
        lines = [
            "## 📡 Current Telemetry",
            "",
            "| Parameter | Value | Status |",
            "|-----------|-------|--------|"
        ]
        
        # Define display parameters
        params = [
            ("power_kw", "Power", "kW"),
            ("temp_c", "Temperature", "°C"),
            ("pressure_kpa", "Pressure", "kPa"),
            ("oxygen_percent", "Oxygen", "%"),
            ("co2_level_mmhg", "CO2", "mmHg"),
            ("battery_charge_percent", "Battery", "%"),
            ("attitude_error_deg", "Attitude Error", "°"),
            ("comm_status", "Comm Status", ""),
        ]
        
        for key, label, unit in params:
            value = telemetry.get(key, "N/A")
            status = "✅" if self._is_normal(key, value) else "⚠️"
            lines.append(f"| {label} | {value} {unit} | {status} |")
        
        return "\n".join(lines)
    
    def _is_normal(self, key: str, value: Any) -> bool:
        """Check if a telemetry value is normal."""
        if key == "power_kw":
            return 8 <= value <= 12
        elif key == "temp_c":
            return 18 <= value <= 26
        elif key == "pressure_kpa":
            return 99 <= value <= 101
        elif key == "oxygen_percent":
            return 95 <= value <= 100
        elif key == "co2_level_mmhg":
            return value <= 5
        elif key == "battery_charge_percent":
            return value >= 60
        elif key == "attitude_error_deg":
            return value <= 2.5
        return True
    
    def get_analysis_display(self) -> str:
        """Format analysis results for display."""
        if not self.current_state:
            return "No analysis yet."
        
        anomaly = self.current_state.get("anomaly", "none")
        severity = self.current_state.get("severity", "nominal")
        proposed = self.current_state.get("proposed_action", "none")
        confidence = self.current_state.get("confidence_score", 0)
        
        severity_emoji = {"critical": "🚨", "warning": "⚠️", "nominal": "✅"}.get(severity, "❓")
        
        lines = [
            f"## 🔍 AI Analysis",
            "",
            f"**Severity:** {severity_emoji} {severity.upper()}",
            f"**Confidence:** {confidence:.1%}",
            f"**Anomaly:** {anomaly}",
            f"**Proposed Action:** {proposed}",
        ]
        
        if self.current_state.get("rationale"):
            lines.append(f"**Rationale:** {self.current_state['rationale']}")
        
        return "\n".join(lines)
    
    def get_approval_status(self) -> tuple[str, str]:
        """Get current approval status for display."""
        if not self.current_state:
            return "No pending approvals", "secondary"
        
        approval = self.current_state.get("human_approval")
        phase = self.current_state.get("mission_phase", "unknown")
        
        if approval is True:
            return "✅ Approved", "success"
        elif approval is False:
            return "❌ Rejected", "danger"
        elif phase == "awaiting_approval":
            return "⏳ Awaiting Approval", "warning"
        else:
            return f"Phase: {phase}", "secondary"
    
    def get_history_display(self) -> str:
        """Format execution history for display."""
        if not self.execution_history:
            return "No actions executed yet."
        
        lines = ["## 📋 Execution History", ""]
        
        for i, entry in enumerate(reversed(self.execution_history[-10:]), 1):
            status = "✅" if entry.get("status") == "completed" else "❌"
            lines.append(f"{i}. **{status}** {entry.get('final_action', 'unknown')}")
            lines.append(f"   - {entry.get('timestamp', '')}")
        
        return "\n".join(lines)


def create_dashboard(station_type: str = "haven-1") -> gr.Blocks:
    """
    Create the Gradio dashboard interface.
    
    Args:
        station_type: Type of space station to monitor
        
    Returns:
        Gradio Blocks interface
    """
    dashboard = SpaceHITLDashboard(station_type)
    
    with gr.Blocks(title=f"🛰️ Space HITL Agent - {station_type.upper()}") as demo:
        gr.Markdown(f"""
# 🛰️ Commercial Space HITL AI Agent
## {station_type.upper()} Mission Control

This dashboard provides human-in-the-loop oversight for autonomous space station operations.

**How it works:**
1. Agent ingests real-time telemetry
2. AI analyzes for anomalies
3. Critical actions require human approval
4. Approved actions are executed
        """)
        
        with gr.Row():
            with gr.Column(scale=1):
                station_dropdown = gr.Dropdown(
                    choices=["haven-1", "axiom", "starlab", "generic"],
                    value=station_type,
                    label="Station Type"
                )
                
                run_btn = gr.Button("🔄 Run Mission Cycle", variant="primary")
                
                gr.Markdown("### Status")
                status_display = gr.Markdown("🟢 Ready")
                
            with gr.Column(scale=2):
                gr.Markdown("### 📡 Telemetry")
                telemetry_display = gr.Markdown("No data yet. Run a cycle to start.")
        
        with gr.Row():
            gr.Markdown("### 🔍 AI Analysis")
        
        with gr.Row():
            analysis_display = gr.Markdown("No analysis yet.")
        
        with gr.Row():
            with gr.Column():
                approve_btn = gr.Button("✅ Approve", variant="success")
            with gr.Column():
                reject_btn = gr.Button("❌ Reject", variant="danger")
        
        with gr.Row():
            gr.Markdown("### 📋 Execution History")
            history_display = gr.Markdown("No actions yet.")
        
        # Event handlers
        def run_cycle(station):
            dashboard.station_type = station
            dashboard.app = create_space_agent(station_type=station)
            result = dashboard.run_cycle(station)
            
            return (
                dashboard.get_telemetry_display(),
                dashboard.get_analysis_display(),
                f"Last run: {datetime.now().strftime('%H:%M:%S')}",
                dashboard.get_history_display()
            )
        
        run_btn.click(
            run_cycle,
            inputs=[station_dropdown],
            outputs=[telemetry_display, analysis_display, status_display, history_display]
        )
        
        def approve_action():
            # Process human approval
            if dashboard.current_state:
                from nodes.human_approval import process_human_response
                dashboard.current_state = process_human_response(
                    dashboard.current_state,
                    "yes"
                )
                return "✅ Action Approved"
            return "No pending action"
        
        def reject_action():
            # Process human rejection
            if dashboard.current_state:
                from nodes.human_approval import process_human_response
                dashboard.current_state = process_human_response(
                    dashboard.current_state,
                    "no"
                )
                return "❌ Action Rejected"
            return "No pending action"
        
        approve_btn.click(approve_action, outputs=[status_display])
        reject_btn.click(reject_action, outputs=[status_display])
    
    return demo


def launch_dashboard(station_type: str = "haven-1", port: int = 7860):
    """
    Launch the dashboard.
    
    Args:
        station_type: Type of space station
        port: Port to listen on
    """
    demo = create_dashboard(station_type)
    demo.launch(server_name="0.0.0.0", server_port=port, share=True)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--station", default="haven-1", help="Station type")
    parser.add_argument("--port", type=int, default=7860, help="Port")
    args = parser.parse_args()
    
    launch_dashboard(args.station, args.port)
