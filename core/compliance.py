import logging
from typing import List, Dict, Any
from .contracts import TaskResult


logger = logging.getLogger(__name__)


class ComplianceEngine:
    """
    Enforces governance and safety rules on agent actions.
    This now includes logic to actively prevent non-compliant tasks.
    """
    COMPLIANCE_LOG_FILE = "compliance_violations.log"

    # Create a logger specific to compliance violations
    compliance_logger = logging.getLogger('compliance_violations')
    def __init__(self):
        # Add rules to prevent certain actions, providers, or data access
        self.rules = [
            {"description": "Prevent using OpenAI for critical tasks", "task_keywords": ["critical"], "provider": "openai", "action": "block"},
            {"description": "Limit access to PII", "task_keywords": ["pii"], "data_access": "block"},
            {"description": "Enforce data encryption", "task_keywords": ["data"], "encryption_required": True, "action": "require_encryption"}
        ]

    def check_compliance(self, task_name, result):
        """
        Checks compliance for a given task and result against defined rules.
        Returns True if compliant, False otherwise.
        """
        # Ensure no restricted actions were taken
        if "illegal" in task_name.lower():
            logger.warning(f"Compliance ALERT: Task '{task_name}' flagged.")
            return False

        # Run Compliance Checks
        return self.enforce_rules(task_name, result)

    def enforce_rules(self, task_name, result: TaskResult) -> bool:
        """
        Enforces configured rules and logs any violations.
        """
        is_compliant = True
        for rule in self.rules:
            if self.rule_matches(rule, task_name):
                if rule.get("action") == "block":
                    logger.warning(f"Compliance ALERT: Task '{task_name}' blocked due to rule: {rule['description']}")
                    is_compliant = False
                elif rule.get("encryption_required"):
                    # Placeholder for encryption check (real implementation to query system's encryption status)
                    if not self.is_data_encrypted(result):
                        logger.warning(f"Compliance ALERT: Task '{task_name}' requires data encryption. Current state is not compliant.")
                        is_compliant = False
        if not is_compliant:
            violation_details = f"Task: {task_name}, Result: {result}"
            self.compliance_logger.warning(f"Compliance Violation: {violation_details}")  # Logging to compliance file

        return is_compliant

    def rule_matches(self, rule, task_name) -> bool:
        """
        Checks if the given rule applies to the current task based on keywords.
        In a real implementation, this could be extended to evaluate a much broader and specific set of criteria.
        """
        if any(keyword in task_name for keyword in rule.get("task_keywords", [])):
            return True
        return False

    def is_data_encrypted(self, result: TaskResult) -> bool:
        """
        Placeholder function for more sophisticated encryption checking.
        A real version would likely query the cloud platform's encryption status.
        """
        # Return True if "encrypted" is in error_message, otherwise False
        if result.error_message and "encrypted" in result.error_message.lower():
            return True
        return False

    def enforce(self, tasks, *args, **kwargs):
        """
        Enforces compliance on a list of tasks.
        Returns True if all tasks are compliant, False otherwise.
        
        Args:
            tasks: List of task names or task dicts
            *args, **kwargs: Additional arguments (for compatibility)
        """
        if not tasks:
            return True
            
        all_compliant = True
        for task in tasks:
            # Handle dict format
            task_name = task if isinstance(task, str) else task.get('task', str(task))
            # Create a dummy result for compliance check
            dummy_result = type('Result', (), {
                'task_name': task_name,
                'error_message': None,
                'status': 'completed'
            })()
            
            if not self.check_compliance(task_name, dummy_result):
                all_compliant = False
                
        return all_compliant


# Aliases for compatibility
Compliance = ComplianceEngine

def enforce(task, *args, **kwargs):
    """Compatibility alias for enforce method"""
    return ComplianceEngine().enforce_rules(task, args[0] if args else None)
