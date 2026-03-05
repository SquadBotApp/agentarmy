class Orders:
    def expand(self, phase):
        """Handles 3-6-9 expansion logic. Returns a list of new orders for the given phase."""
        # For demo: phase is an int, return 3, 6, or 9 orders
        if phase == 1:
            return [f"Order_{i+1}" for i in range(3)]
        elif phase == 2:
            return [f"Order_{i+1}" for i in range(6)]
        elif phase == 3:
            return [f"Order_{i+1}" for i in range(9)]
        else:
            return []
