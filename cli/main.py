"""
CLI entrypoint for AgentArmy
"""
import click
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.orchestrator import Orchestrator


@click.group()
def cli():
    """AgentArmy CLI - Modular Orchestrator"""
    pass


@cli.command()
@click.argument('prompt')
def run(prompt):
    """Run a prompt through the orchestrator"""
    click.echo(f"Processing: {prompt}")
    
    orchestrator = Orchestrator()
    result = orchestrator.run(prompt)
    
    click.echo(f"\n✓ Success: {result.success}")
    click.echo(f"✓ Provider: {result.provider}")
    click.echo(f"✓ Output: {result.output}")


@cli.command()
def start():
    """Start AgentArmy"""
    click.echo("AgentArmy started.")


@cli.command()
def inspect():
    """Inspect agents and tasks"""
    orchestrator = Orchestrator()
    providers = orchestrator.provider_router.providers
    
    click.echo("Available providers:")
    for provider in providers:
        stats = orchestrator.provider_router.get_provider_stats()
        provider_stats = stats.get(provider.name, {})
        click.echo(f"  - {provider.name}: {provider_stats.get('request_count', 0)} requests")


@cli.command()
def status():
    """Show system status"""
    orchestrator = Orchestrator()
    providers = orchestrator.provider_router.providers
    
    click.echo("=== AgentArmy Status ===")
    click.echo(f"Providers: {len(providers)}")
    for provider in providers:
        click.echo(f"  - {provider.name}")


if __name__ == "__main__":
    cli()

