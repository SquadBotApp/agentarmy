"""
EducationCenter domain bootstrapper for AgentArmyOS.
Registers all EducationCenter agents, policies, events, and runtime hooks.
"""
from .agents import *
from .policies import *
from .events import *
from .runtime_hooks import *

def register_educationcenter(os_core):
    # Register agents
    os_core.register_domain("EducationCenter", agents=[
        KnowledgeAgent(),
        CurriculumAgent(),
        AssessmentAgent(),
        SimulationAgent(),
        LearningStyleAgent(),
        ProgressAgent(),
        SafetyAgent()
    ])
    # Register policies
    for policy in EDUCATION_POLICIES:
        os_core.register_policy(policy)
    # Register events
    for event in EDUCATION_EVENTS:
        os_core.register_event(event)
    # Register runtime hooks
    os_core.register_runtime_hook("lesson_started", on_lesson_started)
    os_core.register_runtime_hook("assessment_submitted", on_assessment_submitted)
    os_core.register_runtime_hook("progress_updated", on_progress_updated)
