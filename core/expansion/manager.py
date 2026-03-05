
class ExpansionManager:
    def __init__(self, last_results=None, average_score=0.0, *args, **kwargs):
        self.last_results = last_results or []
        self.average_score = average_score  # From ZPE engine post-reflection

    def __getattr__(self, name):
        if name == 'all_success':
            return all(getattr(r, 'status', None) == 'success' for r in self.last_results)
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

    def should_expand(self, results=None):
        """
        Determine if expansion should occur based on results.
        - True if all successes or positive ZPE score (triggers bounded growth).
        - False otherwise (e.g., failures or neutral/negative score).
        """
        if results:
            self.last_results = results  # Update if new results passed (from orchestrator)
        return self.all_success or self.average_score > 0.0

    def get_expansion_count(self):
        if self.should_expand():  # Reuse the new method for consistency
            return 2 if self.all_success else 1
        return 0
        # If you have average_score logic, add it here
        # elif hasattr(self, 'average_score') and self.average_score > 0:
        #     return 1
        return 0
