# AgentArmy 3-6-9-12-15-18 Expansion Fix TODO

## Objective
Fix the agent army to properly scale from 3 to 6 to 9 to 12 to 15 to 18+ agents using the 3-6-9 recursive expansion strategy, allowing up to 200 agents to solve complex problems.

## Tasks

### Phase 1: Fix Core Expansion Logic
- [ ] 1.1 Fix ExpansionManager.get_expansion_count() to cycle through 3-6-9-12-15-18 pattern
- [ ] 1.2 Update main.py to set BoundedGrowthGovernor max_population=200
- [ ] 1.3 Update expansion_369.py to properly expand tasks

### Phase 2: Add Army Victory Logic
- [ ] 2.1 Modify Orchestrator to treat partial failures as learning opportunities
- [ ] 2.2 Add "war not battle" logic - aggregate success from multiple agents
- [ ] 2.3 Implement failure-to-strength conversion in RecursiveEngine

### Phase 3: Git Automation & Testing
- [ ] 3.1 Add git auto-commit after each test run
- [ ] 3.2 Run tests and verify expansion works
- [ ] 3.3 Iterate and improve based on results

## Implementation Plan
1. First fix ExpansionManager to properly cycle through 3-6-9
2. Update main.py to allow 200 agents
3. Add the army-level victory logic
4. Test and auto-commit

