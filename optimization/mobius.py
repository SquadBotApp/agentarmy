class MobiusEngine:
    def optimize(self, state):
        """Möbius upgrade loop: recursive self-improvement. Returns improved state."""
        # For demo: append ' (optimized)' to the task if possible
        if isinstance(state, dict) and 'task' in state:
            state['task'] = str(state['task']) + ' (optimized)'
        return state
