import logging

logger = logging.getLogger(__name__)

class ComplianceEngine:
    """
    Enforces governance and safety rules on agent actions.
    """
    def check_compliance(self, task_name, result):
        # Placeholder logic: Ensure no restricted actions were taken
        if "illegal" in task_name.lower():
            logger.warning(f"Compliance ALERT: Task '{task_name}' flagged.")
            return False
        return True