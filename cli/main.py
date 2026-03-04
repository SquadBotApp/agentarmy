# CLI entrypoint
import click

@click.group()
def cli():
    pass

@cli.command()
def start():
    print("AgentArmyOS started.")

@cli.command()
def inspect():
    print("Inspecting agents and tasks...")

if __name__ == "__main__":
    cli()
