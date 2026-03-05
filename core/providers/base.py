from typing import Protocol
from pydantic import BaseModel

class ProviderRequest(BaseModel):
    task_id: str
    prompt: str
    metadata: dict = {}

class ProviderResponse(BaseModel):
    output: str
    tokens_in: int
    tokens_out: int
    latency_ms: int
    cost_usd: float
    raw: dict = {}

class Provider(Protocol):
    name: str
    async def call(self, req: ProviderRequest) -> ProviderResponse:
        ...
