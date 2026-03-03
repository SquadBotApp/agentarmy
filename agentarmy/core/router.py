
class ModelRouter:
    def __init__(self, providers):
        self.providers = providers

    def route(self, task):
        if task.type == "code":
            return self.providers["openai"]
        if task.type == "analysis":
            return self.providers["anthropic"]
        if task.type == "simulation":
            return self.providers["simai"]
        return self.providers["openai"]

    def execute(self, task):
        provider = self.route(task)
        # SimAiProvider uses 'run', others use 'chat'
        if hasattr(provider, "chat"):
            return provider.chat(task.messages)
        elif hasattr(provider, "run"):
            return provider.run(task)
        else:
            raise NotImplementedError("Provider does not support chat or run method.")
