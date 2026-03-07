# SpaceOS Agent - API Reference

## Core Modules

### main.py

#### `create_space_agent(station_type: str, simulation_mode: bool) -> StateGraph`
Creates the multi-agent LangGraph for space station operations.

**Parameters:**
- `station_type` (str): Station type - "haven-1", "axiom", "starlab", "generic"
- `simulation_mode` (bool): Use simulated telemetry if True

**Returns:**
- Compiled LangGraph StateGraph

**Example:**
```python
from main import create_space_agent
app = create_space_agent(station_type="haven-1", simulation_mode=True)
```

#### `run_mission_cycle(app, config, human_response, initial_state) -> Dict`
Runs a single mission cycle through the agent.

**Parameters:**
- `app`: Compiled LangGraph application
- `config` (dict): Thread configuration
- `human_response` (str, optional): Human approval response
- `initial_state` (dict, optional): Initial state

**Returns:**
- Final state after cycle

#### `run_continuous_mission(station_type, cycle_interval, max_cycles)`
Runs continuous mission loops.

**Parameters:**
- `station_type` (str): Station type
- `cycle_interval` (float): Seconds between cycles
- `max_cycles` (int, optional): Max cycles to run

---

## Agent Nodes

### Power Agent (`power_analyzer.py`)
```python
from nodes.power_analyzer import power_analyze
result = power_analyze(state)
# Returns: power_anomaly, power_action, power_severity, power_rationale
```

### Thermal Agent (`thermal_analyzer.py`)
```python
from nodes.thermal_analyzer import thermal_analyze
result = thermal_analyze(state)
# Returns: thermal_anomaly, thermal_action, thermal_severity, thermal_rationale
```

### Life Support Agent (`life_support_analyzer.py`)
```python
from nodes.life_support_analyzer import life_support_analyze
result = life_support_analyze(state)
# Returns: life_support_anomaly, life_support_action, life_support_severity
```

### Attitude Agent (`attitude_analyzer.py`)
```python
from nodes.attitude_analyzer import attitude_analyze
result = attitude_analyze(state)
# Returns: attitude_anomaly, attitude_action, attitude_severity, orbital_period_minutes
```

### Payload Agent (`payload_analyzer.py`)
```python
from nodes.payload_analyzer import payload_analyze
result = payload_analyze(state)
# Returns: payload_anomaly, payload_action, payload_severity, payload_experiments
```

---

## Safety Compliance

### `check_no_go_zones(telemetry: Dict) -> Dict`
Checks if telemetry values trigger no-go zones.

**Returns:**
```python
{
    "no_go_zones_triggered": [...],
    "actions_blocked": bool,
    "required_action": str
}
```

### `validate_action(action: str, telemetry: Dict) -> Dict`
Validates if an action can be executed.

**Returns:**
```python
{
    "approved": bool,
    "reason": str,
    "requires_two_person_approval": bool,
    "action_category": str
}
```

### `get_audit_log() -> AuditLog`
Returns the global audit log instance.

**Example:**
```python
from nodes.safety_compliance import get_audit_log
audit = get_audit_log()
logs = audit.get_logs(limit=100)
```

---

## Telemetry Connectors

### `generate_unified_telemetry(station_type, include_external, anomaly_probability) -> Dict`
Generates complete telemetry data.

**Parameters:**
- `station_type` (str): Station type
- `include_external` (bool): Include ISS/NORAD data
- `anomaly_probability` (float): Chance of anomaly injection

### `fetch_iss_position() -> Dict`
Fetches real ISS position from Open-Notify API.

### `get_norad_elements(satellite_id) -> Dict`
Gets NORAD TLE elements.

---

## Timeline

### `calculate_mission_timeline(state: Dict) -> Dict`
Calculates mission timeline information.

**Returns:**
```python
{
    "timeline": {...},
    "orbital": {...},
    "day_night_cycle": {...},
    "comms_windows": {...},
    "docking_windows": {...}
}
```

---

## Configuration Profiles

### YAML Structure
```yaml
profile_name:
  description: str
  telemetry:
    cycle_interval_seconds: int
    anomaly_injection_probability: float
  hitl:
    auto_approve_nominal: bool
    auto_approve_confidence_threshold: float
    require_approval_for: [list]
  safety:
    enforce_no_go_zones: bool
    action_cooldowns_enabled: bool
    two_person_approval_for_life_support: bool
  thresholds: {...}
  enabled_agents: [list]
  external_data: {...}
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STATION_TYPE` | Station type | No |
| `PROFILE` | Operational profile | No |
| `GOOGLE_API_KEY` | Google AI API key | No |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `GROQ_API_KEY` | Groq API key | No |
| `LOG_LEVEL` | Logging level | No |
| `SIMULATION_MODE` | Use simulation | No |

---

## Dashboard

### `launch_dashboard(station_type: str, port: int)`
Launches the Gradio dashboard.

**Example:**
```python
from ui.dashboard import launch_dashboard
launch_dashboard(station_type="haven-1", port=7860)
```

