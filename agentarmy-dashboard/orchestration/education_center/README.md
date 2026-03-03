# EducationCenter Domain

EducationCenter is implemented as a first-class top-level domain under `orchestration/education_center/`.

## Included components

- `education_center.py`: domain orchestrator (bootstrap, state, session flow, event emission)
- `events.py`: canonical EducationCenter event taxonomy
- `policies.py`: domain policy set and topic/age classification helpers
- `runtime_hooks.py`: integration hooks for Defensive/Governance/Economic/Swarm
- Agents:
  - `knowledge_agent.py`
  - `curriculum_agent.py`
  - `assessment_agent.py`
  - `simulation_agent.py`
  - `learning_style_agent.py`
  - `progress_agent.py`
  - `safety_agent.py`
- `dashboard_stubs.py`: dashboard card/action stubs
- `registry.py`: registration helper (`register_education_center(runtime)`)

## Runtime registration

EducationCenter registration is wired in:

- `orchestration/runtime_core/runtime_orchestrator.py`
- `orchestration/runtime_core/bootstrap.py`

## Runtime API stubs

Dashboard/API discovery stubs are exposed in:

- `orchestration/runtime_core/api.py`

Routes:

- `GET /education/domain/status`
- `GET /education/domain/dashboard-stubs`
