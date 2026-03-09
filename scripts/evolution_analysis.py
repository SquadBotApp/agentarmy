#!/usr/bin/env python3
"""
Evolution Analysis Script for PR Evolution Bot
This script is called by the GitHub Actions PR Evolution Bot workflow.
"""
import asyncio
import json
import sys


async def analyze_pr_evolution():
    """Run Genesis evolution analysis on the PR changes."""
    try:
        # Try to import and run Genesis analysis
        from core.factories import make_agent_loop
        from core.genesis.genesis_loop import GenesisLoop

        loop = make_agent_loop()
        genesis = GenesisLoop(loop, plan='enterprise')
        
        result = await genesis.run(
            {'id': 'pr-evolution', 'description': 'analyze repo evolution'},
            cycles=1
        )
        
        actions = result.get('evolution', {}).get('evolution_actions', [])
        
        with open('evolution_actions.json', 'w') as f:
            json.dump(actions, f)
            
        print(f"Evolution analysis complete. Found {len(actions)} actions.")
        return actions
        
    except Exception as e:
        # Fallback to default suggestions
        print(f"Note: {e}", file=sys.stderr)
        suggestions = ['add_tests', 'optimize_routing']
        
        with open('evolution_actions.json', 'w') as f:
            json.dump(suggestions, f)
            
        return suggestions


if __name__ == "__main__":
    actions = asyncio.run(analyze_pr_evolution())
    print("Suggested actions:", actions)
