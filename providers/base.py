# Provider interface

import random

class ProviderBase:
    name = "unknown"
    def execute(self, task):
        raise NotImplementedError

class ProviderRouter:
    def __init__(self):
        self.providers = {}
        self.history = {}  # {task_type: {provider: [success/fail,...]}}

    def add_provider(self, name, provider):
        self.providers[name] = provider

    def route(self, task_type, ab_test=False):
        # Dynamic routing: prefer best provider for task_type, fallback, or A/B test
        if ab_test and len(self.providers) > 1:
            # Randomly pick for A/B test
            return random.choice(list(self.providers.values()))
        # Use history to pick best provider
        stats = self.history.get(task_type, {})
        if stats:
            best = max(stats, key=lambda p: stats[p].count("success") - stats[p].count("fail"))
            return self.providers.get(best)
        # Fallback: OpenAI, then Claude, then any
        for pref in ["openai", "claude"]:
            if pref in self.providers:
                return self.providers[pref]
        return next(iter(self.providers.values()), None)

    def record_result(self, task_type, provider_name, result):
        if task_type not in self.history:
            self.history[task_type] = {}
        if provider_name not in self.history[task_type]:
            self.history[task_type][provider_name] = []
        self.history[task_type][provider_name].append(result)