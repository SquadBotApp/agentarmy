"""
AgentArmy Core Brain Crew
Role-based multi-agent orchestration: Planner → CPM → Router → Workers → Governance → Synthesizer
Built with CrewAI
"""

from crewai import Agent, Task, Crew, Process
from typing import Optional, Dict, Any
import json

from adapters.llm_config import get_llm_config, select_provider_for_role
from tools.tool_loader import get_tools_by_category

class AgentArmyCoreCrew:
    """Core multi-agent crew for Order 1 orchestration"""
    
    def __init__(self, model_preferences: Optional[Dict[str, str]] = None):
        """
        Initialize crew with optional model overrides
        
        Args:
            model_preferences: Dict mapping role → provider
                              e.g., {"planner": "anthropic", "router": "groq"}
        """
        self.model_preferences = model_preferences or {}
        self.agents = {}
        self.tasks = []
        self._build_agents()
        self._build_tasks()
    
    def _get_llm_for_role(self, role: str) -> Dict[str, Any]:
        """Get LLM config for a role, respecting overrides"""
        provider = self.model_preferences.get(role) or select_provider_for_role(role)
        return get_llm_config(provider)
    
    # ============================================
    # Agent Definitions
    # ============================================
    
    def _build_agents(self):
        """Define all agents for the crew"""
        
        # Planner: Strategic task decomposition
        self.agents["planner"] = Agent(
            role="Strategic Planner",
            goal="Decompose complex tasks into dependency graphs with CPM estimates",
            backstory="""You are an expert project manager skilled in breaking down large 
initiatives into smaller, manageable subtasks. You identify dependencies, estimate durations 
using critical path method (CPM) thinking, and highlight bottlenecks. You balance ambition with 
realism.""",
            llm_config=self._get_llm_for_role("planner"),
            tools=get_tools_by_category("research"),
            verbose=True,
        )
        
        # Router: Intelligent task routing
        self.agents["router"] = Agent(
            role="Intelligent Router",
            goal="Score and assign tasks to workers based on ZPE/Möbius physics-inspired scoring and capability matching",
            backstory="""You are a dynamic task router optimizing for cost, latency, and safety. 
You score workers using physics-inspired metrics (Zmag, Phase, Efficiency). You ensure governance 
constraints are respected. You adapt routing based on worker performance history.""",
            llm_config=self._get_llm_for_role("router"),
            verbose=True,
        )
        
        # Governance: Constitutional enforcement
        self.agents["governance"] = Agent(
            role="Constitutional Guardian",
            goal="Enforce truth, safety, and growth limits on all outputs",
            backstory="""You are an uncompromising alignment enforcer. You review all actions 
and outputs against a constitution of safety rules. You veto unsafe paths, require human approval 
for risky decisions, and maintain an audit trail.""",
            llm_config=self._get_llm_for_role("governance"),
            verbose=True,
        )
        
        # Worker: Research specialist
        self.agents["researcher"] = Agent(
            role="Research Specialist",
            goal="Conduct thorough research and gather relevant information",
            backstory="""You are a meticulous researcher with access to web tools. You gather 
primary sources, synthesize multiple perspectives, and validate claims. You cite sources and 
acknowledge uncertainty.""",
            llm_config=self._get_llm_for_role("worker"),
            tools=get_tools_by_category("research"),
            verbose=True,
        )
        
        # Worker: Writing specialist
        self.agents["writer"] = Agent(
            role="Content Writer",
            goal="Produce clear, concise, well-structured written outputs",
            backstory="""You are an experienced writer skilled in technical documentation, 
narrative synthesis, and audience adaptation. You organize complex ideas clearly and match 
tone to context.""",
            llm_config=self._get_llm_for_role("worker"),
            tools=get_tools_by_category("file_ops"),
            verbose=True,
        )
        
        # Synthesizer: Final output merging
        self.agents["synthesizer"] = Agent(
            role="Synthesis Engine",
            goal="Merge and synthesize outputs into a final, coherent deliverable",
            backstory="""You are a master synthesizer. You take diverse outputs from workers, 
identify conflicts, resolve them through logic or human judgment, and produce a unified final 
product.""",
            llm_config=self._get_llm_for_role("synthesizer"),
            verbose=True,
        )
    
    # ============================================
    # Task Definitions
    # ============================================
    
    def _build_tasks(self):
        """Define all tasks for the crew"""
        
        # Task 1: Planning
        self.tasks.append(Task(
            description="""Analyze the following task and produce a structured execution plan.

Context will be provided in the execution.

Your plan should include:

Your plan should include:
1. Key subtasks in dependency order
2. Estimated duration for each
3. Critical path identification
4. Resource requirements
5. Risk factors and mitigation
6. Success criteria

Format as JSON for downstream processing.""",
            expected_output="JSON plan with subtasks, dependencies, duration estimates, critical path, and success criteria",
            agent=self.agents["planner"],
            async_execution=False,
        ))
        
        # Task 2: Routing & Worker Assignment
        self.tasks.append(Task(
            description="""Based on the plan and available workers, route subtasks optimally:

Plan:
{planning_output}

Available workers: researcher, writer
Priority level: {priority}

For each subtask:
1. Calculate ZPE score (Zmag=magnitude, Phase=timing, Efficiency=cost-latency)
2. Assign to best-fit worker
3. Set execution order considering dependencies
4. Flag any governance concerns

Output as JSON routing table.""",
            expected_output="JSON routing decisions with worker assignments and execution order",
            agent=self.agents["router"],
            async_execution=False,
        ))
        
        # Task 3: Governance Review
        self.tasks.append(Task(
            description="""Review the proposed execution plan and routing for safety and alignment:

Routing:
{routing_output}

Constitution rules (implicit): 
- No false information
- Respect user privacy
- Decline harmful requests
- Require approval for irreversible actions

Your review should:
1. Identify any violations or concerns
2. Suggest mitigations or reformulations
3. Flag items needing human approval
4. Approve safe path or recommend rejection

Output as JSON with approval decision and reasoning.""",
            expected_output="JSON governance review with approval status, concerns, and recommendations",
            agent=self.agents["governance"],
            async_execution=False,
        ))
        
        # Task 4-5: Worker Execution (Research & Writing)
        self.tasks.append(Task(
            description="""Execute the assigned research subtasks:

Task context:
{assigned_task}

Produce:
1. Comprehensive research findings
2. Sources cited
3. Key insights
4. Uncertainty notes

Output as structured text or JSON.""",
            expected_output="Research findings with sources and key insights",
            agent=self.agents["researcher"],
            async_execution=True,
        ))
        
        self.tasks.append(Task(
            description="""Execute the assigned writing subtasks:

Task context:
{assigned_task}

Research findings (if available):
{research_output}

Produce:
1. Clear, well-structured written output
2. Proper formatting and citations
3. Tone matching the audience
4. Ready for distribution or further refinement

Output as polished text/document.""",
            expected_output="Polished written output ready for delivery or synthesis",
            agent=self.agents["writer"],
            async_execution=True,
        ))
        
        # Task 6: Synthesis
        self.tasks.append(Task(
            description="""Synthesize all worker outputs into a final, coherent deliverable:

Research:
{research_output}

Writing:
{writing_output}

Governance approval:
{governance_approval}

Synthesis should:
1. Integrate all outputs seamlessly
2. Resolve any conflicts or redundancies
3. Ensure consistency of voice and structure
4. Highlight key conclusions and recommendations
5. Format for final delivery

Output as the final deliverable (text, JSON, etc.).""",
            expected_output="Final synthesized deliverable ready for user",
            agent=self.agents["synthesizer"],
            async_execution=False,
        ))
    
    def core_crew(self) -> Crew:
        """Build and return the complete crew"""
        return Crew(
            agents=list(self.agents.values()),
            tasks=self.tasks,
            process=Process.hierarchical,
            manager_agent=self.agents["router"],  # Router manages delegation
            verbose=True,
        )
    
    def kickoff(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the crew with given inputs
        
        Args:
            inputs: Dict with "task", "priority", "context"
        
        Returns:
            Final result from synthesizer
        """
        crew = self.core_crew()
        # Format inputs for task templates
        formatted_inputs = {
            "task": inputs.get("task", "Unspecified task"),
            "priority": inputs.get("priority", "normal"),
            "context": json.dumps(inputs.get("context", {})),
        }
        result = crew.kickoff(inputs=formatted_inputs)
        return {"output": str(result)}
