# Orchestration core: main loop, agent/task management

class Orchestrator:
    def __init__(self, agents, tasks, expansion_manager, mobius, reflection, shared_state=None, lock=None):
        self.agents = agents
        self.tasks = tasks
        self.expansion_manager = expansion_manager
        self.mobius = mobius
        self.reflection = reflection
        self.shared_state = shared_state
        self.lock = lock
        self.log = []
        self._update_shared_state() # Initial state

    def run(self, max_cycles: int = 1):
        """
        Runs the main orchestration loop for a specified number of cycles.

        Args:
            max_cycles (int): The number of cycles to run. Defaults to 1.
                              If set to None, it will run indefinitely.
        """
        cycles_run = 0
        while max_cycles is None or cycles_run < max_cycles:
            cycle_start_msg = f"Cycle {cycles_run + 1} starting. Agents: {len(self.agents)}, Tasks: {len(self.tasks)}"
            self._add_log(cycle_start_msg)
            plan = self.mobius.strategy_phase(self.tasks)
            self._add_log(f"Strategy phase generated plan with {len(plan)} tasks.")
            results = self.mobius.execution_phase(plan)
            self._add_log(f"Execution phase completed with {len(results)} results.")
            self.reflection.after_task(plan, results)
            # ACT on the recommendation from the expansion manager
            if self.expansion_manager.should_expand(results):
                # A simple expansion strategy: add a new numbered agent
                new_agent_name = f"agent_{len(self.agents) + 1}"
                self.agents.append(new_agent_name)
                self._add_log(f"Army expanded. New agent '{new_agent_name}' created.")
            self.tasks = self.reflection.update_lessons(results)
            self._add_log(f"Reflection phase updated task list. New task count: {len(self.tasks)}.")
            if max_cycles is not None:
                cycles_run += 1
            self._update_shared_state()

    def _add_log(self, message: str):
        # Keep the log from growing indefinitely
        if len(self.log) > 50:
            self.log.pop(0)
        self.log.append(message)

    def _update_shared_state(self):
        if self.shared_state is not None and self.lock is not None:
            with self.lock:
                self.shared_state['agents'] = list(self.agents)
                self.shared_state['tasks'] = list(self.tasks)
                self.shared_state['log'] = list(self.log)
