
# Provider Integration and Routing

AgentArmyOS supports dynamic, multi-provider routing for all agent tasks. Providers are registered with the `MultiPlatformRouter` and routed by task type.

## How It Works

- Providers (e.g., OpenAI, Claude) implement the `ProviderBase` interface.
- The `MultiPlatformRouter` is instantiated and providers are registered by name.
- The MobiusOrchestrator uses the router to select the correct provider for each task.
- Routing is dynamic and can be extended for A/B, fallback, or custom logic.

## Example

```python
from integration.router import MultiPlatformRouter
from providers.openai import OpenAIProvider
from providers.claude import ClaudeProvider

router = MultiPlatformRouter()
router.add_provider("openai", OpenAIProvider())
router.add_provider("claude", ClaudeProvider())

# In MobiusOrchestrator:
mobius = MobiusOrchestrator(agents=["agent1"], provider_router=router)
```

## Extending Providers

To add a new provider:

1. Implement a class inheriting from `ProviderBase`.
2. Register it with the router using `add_provider("name", provider_instance)`.
3. Update the router's `route` method if you want custom routing logic.

## Testing

- Provider routing is covered by integration and smoke tests in `tests/`.
- Dashboard, CLI, and API all support dynamic provider routing.

---

For more, see `providers/`, `integration/router.py`, and `core/mobius.py`.
