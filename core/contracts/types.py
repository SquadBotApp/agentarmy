from dataclasses import dataclass
from typing import Any, Dict, List

@dataclass
class TaskResult:
    task_id: str
    provider: str
    success: bool
    output: Any
    metadata: Dict[str, Any]

@dataclass
class Task:
    task_id: str
    provider: str
    input: Any
    metadata: Dict[str, Any]

@dataclass
class Job:
    job_id: str
    tasks: List[Task]
    metadata: Dict[str, Any]
