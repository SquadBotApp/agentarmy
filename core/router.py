class Router:
    def route(self, cpm_result):
        """Assigns each task to an agent type based on task name and criticality."""
        # For demo: round-robin assign to agent types by task index
        agent_types = [
            'WriterAgent', 'ResearcherAgent', 'AnalystAgent', 'LegalAgent', 'FinanceAgent',
            'DesignAgent', 'VideoAgent', 'AutomationAgent', 'CodingAgent', 'PRAgent', 'RiskAgent', 'SynthesizerAgent'
        ]
        assignments = []
        for i, t in enumerate(cpm_result):
            assignments.append({
                'agent_type': agent_types[i % len(agent_types)],
                'task': t['task'],
                'critical': t['critical']
            })
        return assignments
