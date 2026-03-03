import anthropic

class AnthropicProvider:
    def __init__(self, api_key):
        self.client = anthropic.Anthropic(api_key=api_key)

    def chat(self, messages, model="claude-3-7-sonnet"):
        return self.client.messages.create(
            model=model,
            messages=messages,
            max_tokens=4096,
            temperature=0.2
        )
