"""
OPTION B: Minimal Orchestrator
Input → ProviderRouter → Provider → TaskResult

No legacy modules: No planner, no CPM, no recursion, no universes, no Möbius, no ZPE, no governance, etc.
"""

import logging
from typing import List, Optional
from core.models import Task, TaskResult
from core.providers.router import ProviderRouter, ProviderRequest

logger = logging.getLogger(__name__)


class Orchestrator:
    """
    OPTION B: Minimal orchestrator that routes tasks through providers.
    
    Input → ProviderRouter → Provider → TaskResult
    
    That's it. No complexity beyond this chain.
    """
    
    def __init__(
        self,
        provider_router: ProviderRouter,
        tasks: Optional[List[Task]] = None,
    ):
        """
        Initialize with minimal requirements.
        
        Args:
            provider_router: The ProviderRouter that will handle all requests
            tasks: Optional list of initial tasks
        """
        self.provider_router = provider_router
        self.tasks = tasks or []
        self.results = []
        logger.info(f"Orchestrator initialized with {len(tasks) or 0} tasks")
    
    async def execute_tasks(self) -> List[TaskResult]:
        """
        Execute all tasks through the provider router.
        
        Simple: for each task, send through router, collect result.
        """
        self.results = []
        
        for task in self.tasks:
            logger.info(f"Executing task: {task.name}")
            
            # Create provider request from task
            request = ProviderRequest(
                prompt=task.description or task.name,
                task_id=task.name
            )
            
            # Route through provider router
            response = await self.provider_router.route(request)
            
            # Convert provider response to TaskResult
            result = TaskResult(
                success=response.success,
                output=response.output,
                provider=response.provider_name
            )
            
            self.results.append(result)
            
            if response.success:
                logger.info(f"Task {task.name} completed via {response.provider_name}")
            else:
                logger.error(f"Task {task.name} failed: {response.error}")
        
        return self.results
    
    def add_task(self, task: Task):
        """Add a task to the queue"""
        self.tasks.append(task)
    
    def get_results(self) -> List[TaskResult]:
        """Get results from last execution"""
        return self.results
