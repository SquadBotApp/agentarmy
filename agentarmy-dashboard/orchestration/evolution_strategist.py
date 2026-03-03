"""
Evolution Strategist for AgentArmyOS
------------------------------------
Connects agent performance in competitions to the lifecycle manager,
enabling a dynamic, self-improving agent society.
- Promotes winning agents by forking them into new "champion" versions.
- Sends underperforming agents to the EducationCenter for retraining.
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Dict

if TYPE_CHECKING:
    from .competition_arena import CompetitionArena
    from .lifecycle_manager import LifecycleManager, ManagedAgent
    from .education_center import EducationCenter

logger = logging.getLogger(__name__)


class EvolutionStrategist:
    def __init__(
        self,
        competition_arena: "CompetitionArena",
        lifecycle_manager: "LifecycleManager",
        education_center: "EducationCenter" | None,
    ):
        self.arena = competition_arena
        self.lifecycle = lifecycle_manager
        self.education_center = education_center

    def register_hooks(self):
        """Register listeners for performance events."""
        self.arena.register_listener(self.on_competition_complete)
        logger.info("[EvolutionStrategist] Registered hooks with CompetitionArena.")

    def on_competition_complete(self, event: Dict[str, Any]):
        """Handles the 'competition_complete' event."""
        if event.get("type") != "competition_complete":
            return

        competition_name = event.get("competition")
        leaderboard = event.get("leaderboard")
        if not competition_name or not leaderboard or len(leaderboard) < 2:
            return

        logger.info(f"[EvolutionStrategist] Processing results for competition '{competition_name}'.")

        # --- Strategy 1: Evolve the winner ---
        winner_stats = leaderboard[0]
        winner_name = winner_stats.get("agent")
            if winner_agent := self._find_agent_by_name(winner_name):

        if winner_agent:
            try:
                # 1. Fork the winner
                forked, _ = self.lifecycle.fork_agent(
                    agent_id=winner_agent.agent_id,
                    new_name=f"{winner_name}-Champion",
                    actor="evolution_strategist",
                )
                logger.info(f"🏆 Winner '{winner_name}' forked into new agent: '{forked.name}'")

                # 2. Deploy the new agent to make it ACTIVE
                self.lifecycle.deploy_agent(forked.agent_id, actor="evolution_strategist")
                logger.info(f"🚀 Deployed new agent '{forked.name}'.")

                # 3. Promote the now-ACTIVE agent to Champion
                self.lifecycle.promote_to_champion(forked.agent_id, actor="evolution_strategist")
                logger.info(f"👑 Promoted '{forked.name}' to Champion status with special privileges.")

            except Exception as e:
                logger.error(f"Failed to fork, deploy, and promote winner '{winner_name}': {e}")

        # --- Strategy 2: Retrain the underperformer ---
        loser_stats = leaderboard[-1]
        if self.education_center and winner_stats.get("total_score", 0) > loser_stats.get("total_score", 0):
            loser_name = loser_stats.get("agent")
            try:
                logger.info(f"🎓 Sending underperformer '{loser_name}' for retraining.")
                self.education_center.start_session({
                    "learner_id": loser_name, "topic": f"Improving performance in {competition_name}"
                })
            except Exception as e:
                logger.error(f"Failed to start education session for '{loser_name}': {e}")

    def _find_agent_by_name(self, name: str) -> "ManagedAgent" | None:
        """Finds a managed agent by its name."""
        return next((agent for agent in self.lifecycle.agents.values() if agent.name == name), None)