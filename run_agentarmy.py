import os
import sys

# Ensure the agentarmy package is on the Python path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from agentarmy.core.orchestrator import Orchestrator

def main():
    # Example input data for demo purposes
    input_data = [
        {'name': 'Write spec', 'duration': 3, 'dependencies': [], 'type': 'writer'},
        {'name': 'Research market', 'duration': 2, 'dependencies': ['Write spec'], 'type': 'researcher'},
        {'name': 'Analyze risks', 'duration': 1, 'dependencies': ['Research market'], 'type': 'analyst'},
    ]
    orchestrator = Orchestrator()
    result = orchestrator.run(input_data)
    print('AgentArmyOS Result:', result)

if __name__ == '__main__':
    main()