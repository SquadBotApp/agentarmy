# Recursive improvement engine

class ReflectionEngine:
    def after_task(self, task, result):
        # Handle None inputs gracefully
        task_str = str(task) if task is not None else "unknown"
        result_str = str(result) if result is not None else "unknown"
        # Critique and store lesson
        print(f"Reflecting on {task_str} with result {result_str}")

    def critique(self, outcome):
        # Handle None input
        if outcome is None:
            return "Critique: No outcome to critique"
        
        # Handle non-string input
        if not isinstance(outcome, str):
            return f"Critique: {str(outcome)}"
            
        # Dummy critique logic
        return f"Critique: {outcome}"

    def update_lessons(self, lesson):
        # Handle None input
        if lesson is None:
            return []
        
        # Handle non-iterable input
        if not isinstance(lesson, (list, tuple, set, str)):
            lesson = [str(lesson)]
        
        # Handle empty string
        if isinstance(lesson, str) and len(lesson) == 0:
            return []
            
        # Update lessons store
        if isinstance(lesson, str):
            print(f"Updating lessons with {lesson}")
        else:
            print(f"Updating lessons with {list(lesson)}")
        return []
