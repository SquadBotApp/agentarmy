import os
import sys
import asyncio

# Ensure the agentarmy package is on the Python path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from main import main

if __name__ == '__main__':
    asyncio.run(main())
