"""
Dashboard integration stubs for EducationCenter domain.
"""


def build_domain_cards(state):
    learners = state.get("learners", [])
    sessions = state.get("sessions", [])
    active_sessions = len([s for s in sessions if s.get("status") == "active"])
    return [
        {"id": "edu-learners", "title": "Learners", "value": len(learners), "trend": "stable"},
        {"id": "edu-sessions", "title": "Sessions", "value": len(sessions), "trend": "up"},
        {"id": "edu-active", "title": "Active Sessions", "value": active_sessions, "trend": "stable"},
    ]


def build_action_stubs():
    return [
        {"action": "education.start_session", "method": "POST", "path": "/education/session/start"},
        {"action": "education.submit_assessment", "method": "POST", "path": "/education/session/assess"},
        {"action": "education.generate_simulation", "method": "POST", "path": "/education/simulation/generate"},
        {"action": "education.state", "method": "GET", "path": "/education/state"},
    ]

