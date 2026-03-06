"""
Puter.js Provider Example Usage

This file demonstrates how to use the PuterProvider in AgentArmy.

For more information about Puter.js, visit: https://docs.puter.com/
"""

import asyncio
from core.providers import PuterProvider, PuterModels, ProviderRequest, ProviderRouter, RoutingStrategy


async def example_text_generation():
    """Example 1: Basic text generation with GPT-5 nano"""
    print("=" * 50)
    print("Example 1: Text Generation with GPT-5 nano")
    print("=" * 50)
    
    provider = PuterProvider(default_model=PuterModels.GPT_5_NANO)
    
    request = ProviderRequest(
        prompt="What are the benefits of exercise?",
        model=PuterModels.GPT_5_NANO,
        temperature=0.7,
        max_tokens=500
    )
    
    response = await provider.generate(request)
    
    if response.success:
        print(f"Response: {response.output}")
        print(f"Tokens used: {response.tokens_used}")
        print(f"Latency: {response.latency_ms}ms")
        print(f"Cost: ${response.cost:.4f}")
    else:
        print(f"Error: {response.error}")
    
    return response


async def example_different_models():
    """Example 2: Using different OpenAI models"""
    print("\n" + "=" * 50)
    print("Example 2: Different OpenAI Models")
    print("=" * 50)
    
    models = [
        PuterModels.GPT_5_4,
        PuterModels.GPT_5_3_CHAT,
        PuterModels.GPT_5_2,
    ]
    
    for model in models:
        provider = PuterProvider(default_model=model)
        request = ProviderRequest(
            prompt="Write a short poem about coding",
            model=model
        )
        
        response = await provider.generate(request)
        
        if response.success:
            print(f"\nModel: {model}")
            print(f"Response: {response.output[:100]}...")
        else:
            print(f"Error with {model}: {response.error}")


async def example_streaming():
    """Example 3: Streaming responses"""
    print("\n" + "=" * 50)
    print("Example 3: Streaming Responses")
    print("=" * 50)
    
    provider = PuterProvider()
    
    request = ProviderRequest(
        prompt="Explain the theory of relativity in detail",
        model=PuterModels.GPT_5_NANO,
        metadata={"stream": True}
    )
    
    response = await provider.generate(request)
    
    if response.success:
        print(f"Streaming response: {response.output}")
    else:
        print(f"Error: {response.error}")


async def example_temperature_control():
    """Example 4: Control randomness with temperature"""
    print("\n" + "=" * 50)
    print("Example 4: Temperature Control")
    print("=" * 50)
    
    provider = PuterProvider()
    
    # Low temperature for focused output
    request_focused = ProviderRequest(
        prompt="Tell me about planet Mars",
        model=PuterModels.GPT_5_NANO,
        temperature=0.2,
        max_tokens=100
    )
    
    response_focused = await provider.generate(request_focused)
    print(f"\nLow temperature (0.2): {response_focused.output[:150]}...")
    
    # High temperature for creative output
    request_creative = ProviderRequest(
        prompt="Tell me about planet Mars",
        model=PuterModels.GPT_5_NANO,
        temperature=0.8,
        max_tokens=100
    )
    
    response_creative = await provider.generate(request_creative)
    print(f"\nHigh temperature (0.8): {response_creative.output[:150]}...")


async def example_with_router():
    """Example 5: Using PuterProvider with ProviderRouter"""
    print("\n" + "=" * 50)
    print("Example 5: ProviderRouter Integration")
    print("=" * 50)
    
    from core.providers import OpenAIProvider, ClaudeProvider
    
    providers = [
        PuterProvider(default_model=PuterModels.GPT_5_NANO),
        OpenAIProvider(api_key="your-openai-key"),
    ]
    
    router = ProviderRouter(
        providers=providers,
        strategy=RoutingStrategy.ROUND_ROBIN
    )
    
    request = ProviderRequest(
        prompt="Hello, how are you?",
        model=PuterModels.GPT_5_NANO
    )
    
    response = await router.route(request)
    
    print(f"Provider: {response.provider_name}")
    print(f"Response: {response.output}")
    print(f"Success: {response.success}")


async def example_image_generation():
    """Example 6: Image generation"""
    print("\n" + "=" * 50)
    print("Example 6: Image Generation")
    print("=" * 50)
    
    provider = PuterProvider()
    
    request = ProviderRequest(
        prompt="A futuristic cityscape at night",
        model=PuterModels.GPT_IMAGE_1_5,
        metadata={
            "size": "1024x1024",
            "quality": "standard"
        }
    )
    
    response = await provider.generate(request)
    
    if response.success:
        print(f"Image generated: {response.output}")
        print(f"Latency: {response.latency_ms}ms")
    else:
        print(f"Error: {response.error}")


async def example_text_to_speech():
    """Example 7: Text-to-speech"""
    print("\n" + "=" * 50)
    print("Example 7: Text-to-Speech")
    print("=" * 50)
    
    provider = PuterProvider()
    
    request = ProviderRequest(
        prompt="Hello world! This is OpenAI text-to-speech.",
        model=PuterModels.TTS_1,
        metadata={"voice": "alloy"}
    )
    
    response = await provider.generate(request)
    
    if response.success:
        print(f"Audio generated: {response.output}")
        print(f"Latency: {response.latency_ms}ms")
    else:
        print(f"Error: {response.error}")


async def main():
    """Run all examples"""
    print("Puter.js Provider Examples")
    print("=" * 50)
    print("Documentation: https://docs.puter.com/")
    print("=" * 50 + "\n")
    
    # Run examples
    await example_text_generation()
    await example_different_models()
    await example_streaming()
    await example_temperature_control()
    await example_with_router()
    await example_image_generation()
    await example_text_to_speech()
    
    print("\n" + "=" * 50)
    print("All examples completed!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())

