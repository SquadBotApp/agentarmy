# Möbius loop problem-solving framework

class MobiusOrchestrator:
    def strategy_phase(self, context):
        # Handle None or invalid context
        if context is None:
            return []
        
        # Handle non-iterable context
        if not isinstance(context, (list, tuple, set)):
            return []
        
        # High-level strategy planning
        return [task for task in context]

    def execution_phase(self, plan):
        # Handle None or invalid plan
        if plan is None:
            return []
        
        # Handle non-iterable plan
        if not isinstance(plan, (list, tuple, set)):
            return []
            
        # Low-level execution
        results = []
        for task in plan:
            results.append(f"Executed {task}")
        return results

    def feedback_loop(self, results):
        # Handle None results
        if results is None:
            return "Feedback: No results"
        
        # Handle non-iterable results
        if not isinstance(results, (list, tuple, set, str)):
            return "Feedback: Invalid results"
            
        # Feed results back to strategy
        return f"Feedback: {results}"