# Orchestration core: main loop, agent/task management

class Orchestrator:
    def __init__(self, agents, tasks, expansion_manager, mobius, reflection, cpm=None, meta_synthesizer=None, zpe=None, universes=None, intel=None, compliance=None, billing_engine=None, bounded_growth_governor=None, shared_state=None, lock=None, initial_log=None):
        self.agents = agents
        self.tasks = tasks
        self.expansion_manager = expansion_manager
        self.mobius = mobius
        self.reflection = reflection
        self.cpm = cpm
        self.meta_synthesizer = meta_synthesizer
        self.zpe = zpe
        self.universes = universes
        self.intel = intel
        self.compliance = compliance
        self.billing_engine = billing_engine
        self.bounded_growth_governor = bounded_growth_governor
        self.shared_state = shared_state
        self.lock = lock
        self.log = initial_log if initial_log is not None else []
        self._update_shared_state() # Initial state

    async def run(self, max_cycles: int = 1):
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

            # CPM Analysis to prioritize tasks
            tasks_to_run = self.tasks
            if self.cpm:
                cpm_analysis = self.cpm.analyze(self.tasks)
                self._add_log(f"CPM Analysis complete. Critical tasks identified.")
                # Prioritize critical tasks first
                critical_tasks = [t['task'] for t in cpm_analysis if t['critical']]
                non_critical_tasks = [t['task'] for t in cpm_analysis if not t['critical']]
                tasks_to_run = critical_tasks + non_critical_tasks

            # Use Parallel Universes if available, otherwise standard Mobius Loop
            if self.universes:
                # Example strategies for parallel exploration
                strategies = ["aggressive", "conservative", "balanced"]
                results = await self.universes.run_parallel_simulations(tasks_to_run, strategies, self.mobius)
            else:
                results = await self.mobius.mobius_loop(tasks_to_run)

            self._add_log(f"Mobius loop completed with {len(results)} results.")
            self.reflection.after_task([], results) # Plan is now implicit to the Mobius loop

            # Synthesize Results
            if self.meta_synthesizer:
                synthesis = self.meta_synthesizer.synthesize(results)
                self._add_log(f"Meta-Synthesis: {synthesis}")

            # Calculate ZPE Score
            if self.zpe:
                zpe_score = self.zpe.score(results)
                self._add_log(f"ZPE Score for cycle: {zpe_score:.2f}")

            # Record usage for billing
            if self.billing_engine:
                self.billing_engine.record_usage(results)

            # Run Compliance Checks
            if self.compliance:
                for res in results:
                    self.compliance.check_compliance(res.task_name, res)
            
            # Gather Intelligence
            if self.intel:
                intel_report = self.intel.gather_intel(results)
                self._add_log(f"Competitive Intel: {intel_report}")
                recommendation = intel_report.get("recommendation", "")
                if recommendation.startswith("switch_to_provider:"):
                    provider_to_switch_to = recommendation.split(":")[1]
                    self._add_log(f"Intel recommends switching to provider: {provider_to_switch_to}. Updating router.")
                    self.mobius.provider_router.set_strategy('fixed_provider', provider_name=provider_to_switch_to)

            # ACT on the recommendation from the expansion manager
            if self.expansion_manager.should_expand(results):
                # Use the 3-6-9 expansion logic
                num_to_add_base = self.expansion_manager.get_expansion_count()
                
                # Apply Bounded Growth Governor
                if self.bounded_growth_governor:
                    current_population = len(self.agents)
                    governed_next_population = self.bounded_growth_governor.next_population(current_population)
                    max_agents_to_add = governed_next_population - current_population
                    num_to_add = min(num_to_add_base, max_agents_to_add)
                    if num_to_add < num_to_add_base:
                        self._add_log(f"Growth Governor: Capping expansion from {num_to_add_base} to {num_to_add} agents.")
                else:
                    num_to_add = num_to_add_base

                if num_to_add > 0:
                    self._add_log(f"Army expanding by {num_to_add} agents...")
                    current_agent_count = len(self.agents)
                    for i in range(num_to_add):
                        new_agent_name = f"agent_{current_agent_count + i + 1}"
                        self.agents.append(new_agent_name)
                        self._add_log(f"New agent '{new_agent_name}' created.")
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
