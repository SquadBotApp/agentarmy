# Provider interface

class ProviderBase:
    def execute(self, task):
        raise NotImplementedError

class ProviderRouter:
    def __init__(self):
        self.providers = {}

    def add_provider(self, name, provider):
        self.providers[name] = provider

    def route(self, task_type):
        # Dummy routing logic
        return self.providers.get("openai")
