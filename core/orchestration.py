# Orchestration core: main loop, agent/task management

class Orchestrator:
    def __init__(self, agents, tasks, expansion_manager, mobius, reflection):
        self.agents = agents
        self.tasks = tasks
        self.expansion_manager = expansion_manager
        self.mobius = mobius
        self.reflection = reflection

    def run(self, max_cycles: int = 1):
        """
        Runs the main orchestration loop for a specified number of cycles.

        Args:
            max_cycles (int): The number of cycles to run. Defaults to 1.
                              If set to None, it will run indefinitely.
        """
        cycles_run = 0
        while max_cycles is None or cycles_run < max_cycles:
            plan = self.mobius.strategy_phase(self.tasks)
            results = self.mobius.execution_phase(plan)
            self.reflection.after_task(plan, results)
            # ACT on the recommendation from the expansion manager
            if self.expansion_manager.should_expand(results):
                # A simple expansion strategy: add a new numbered agent
                new_agent_name = f"agent_{len(self.agents) + 1}"
                self.agents.append(new_agent_name)
            self.tasks = self.reflection.update_lessons(results)
            if max_cycles is not None:
                cycles_run += 1
