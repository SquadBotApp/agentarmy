"""
CLI entrypoint for AgentArmy - OPTION B

Minimal CLI for the modular orchestrator.
Input → ProviderRouter → Provider → TaskResult
"""
import click
import sys
import os
import asyncio

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.orchestration import Orchestrator
from core.orchestration import Orchestrator
from core.providers.base import MockProvider
from core.providers.router import ProviderRouter
from core.models import Task


@click.group()
def cli():
    """AgentArmy CLI - Option B Modular Orchestrator"""
    pass


@cli.command()
@click.argument('prompt')
def run(prompt):
    """Run a prompt through the orchestrator"""
    click.echo(f"Processing: {prompt}")
    
    # Create simple setup for testing
    mock_provider = MockProvider(response_text=f"Mock response to: {prompt}")
    router = ProviderRouter([mock_provider])
    
    task = Task(name="user_task", description=prompt)
    orchestrator = Orchestrator(provider_router=router, tasks=[task])
    
    # Run async function
    results = asyncio.run(orchestrator.execute_tasks())
    
    if results:
        result = results[0]
        click.echo(f"\n✓ Success: {result.success}")
        click.echo(f"✓ Provider: {result.provider}")
        click.echo(f"✓ Output: {result.output[:100]}...")
    else:
        click.echo("✗ No results returned")


@cli.command()
def start():
    """Start AgentArmy"""
    click.echo("AgentArmy started.")
    click.echo("Available commands: run <prompt>, status, inspect")


@cli.command()
def inspect():
    """Inspect providers"""
    mock_provider = MockProvider()
    router = ProviderRouter([mock_provider])
    
    click.echo("Available providers:")
    stats = router.get_provider_stats()
    for provider_name, provider_stats in stats.items():
        click.echo(f"  - {provider_name}: {provider_stats['request_count']} requests")


@cli.command()
def status():
    """Show system status"""
    mock_provider = MockProvider()
    router = ProviderRouter([mock_provider])
    
    click.echo("=== AgentArmy Status (OPTION B) ===")
    providers = router.providers
    click.echo(f"Providers: {len(providers)}")
    for provider in providers:
        click.echo(f"  - {provider.name}")
    
    click.echo("\nArchitecture: Input → ProviderRouter → Provider → TaskResult")
    click.echo("Status: ✓ Ready")


if __name__ == "__main__":
    cli()
