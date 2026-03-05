class CPMEngine:
    def analyze(self, tasks):
        """Analyze tasks for critical path, float, and dependencies.
        Returns a list of dicts: [{task, duration, dependencies, critical, float}]
        """
        # For demo: assume tasks is a list of dicts with 'name', 'duration', 'dependencies'
        # Mark all as critical if no dependencies, float=0
        if not tasks:
            return []
        analyzed = []
        for t in tasks:
            analyzed.append({
                'task': t['name'],
                'duration': t.get('duration', 1),
                'dependencies': t.get('dependencies', []),
                'critical': not t.get('dependencies'),
                'float': 0 if not t.get('dependencies') else 1
            })
        return analyzed
