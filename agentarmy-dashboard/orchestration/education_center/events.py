"""
EducationCenter event taxonomy for runtime/event-bus integration.
"""

EDU_SESSION_STARTED = "education.session.started"
EDU_SESSION_BLOCKED = "education.session.blocked"
EDU_LESSON_GENERATED = "education.lesson.generated"
EDU_ASSESSMENT_COMPLETED = "education.assessment.completed"
EDU_SIMULATION_REQUESTED = "education.simulation.requested"
EDU_PROGRESS_UPDATED = "education.progress.updated"
EDU_POLICY_VIOLATION = "education.policy.violation"
EDU_REWARD_ISSUED = "education.reward.issued"

ALL_EVENTS = [
    EDU_SESSION_STARTED,
    EDU_SESSION_BLOCKED,
    EDU_LESSON_GENERATED,
    EDU_ASSESSMENT_COMPLETED,
    EDU_SIMULATION_REQUESTED,
    EDU_PROGRESS_UPDATED,
    EDU_POLICY_VIOLATION,
    EDU_REWARD_ISSUED,
]

