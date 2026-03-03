from openai import OpenAI

class OpenAIProvider:
    def __init__(self, api_key):
        self.client = OpenAI(api_key=api_key)

    def chat(self, messages, model="gpt-4.1"):
        return self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2
        )

