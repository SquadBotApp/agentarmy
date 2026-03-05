from .base import Provider, ProviderRequest, ProviderResponse
import time

class OpenAIProvider:
    name = "openai"

    def call(self, req: ProviderRequest) -> ProviderResponse:
        # Simulate OpenAI call
        start = time.time()
        # ... real OpenAI API call would go here ...
        output = f"[OpenAI] {req.prompt}"
        latency = int((time.time() - start) * 1000)
        return ProviderResponse(
            output=output,
            tokens_in=len(req.prompt.split()),
            tokens_out=len(output.split()),
            latency_ms=latency,
            cost_usd=0.001,
            raw={"provider": "openai"}
        )
