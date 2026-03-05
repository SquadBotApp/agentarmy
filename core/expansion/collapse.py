"""
Collapse: merge multiple branch results into a single job output.
"""

from __future__ import annotations

from typing import List, Dict, Any

from .branch import Branch


class CollapseEngine:
    """
    Merges results from parallel branches into a single unified output.
    Uses weighted voting and quality scoring.
    """
    
    def __init__(self):
        self.vote_weights = {
            "success": 1.0,
            "zpe_score": 2.0,
            "cost": 0.5,  # Lower weight for cost
        }
    
    def merge(self, branches: List[Branch]) -> Dict[str, Any]:
        """
        Merge branch results into a single job output.
        
        Returns merged result with:
        - consolidated output (via voting)
        - aggregated metrics
        - branch contributions
        """
        
        if not branches:
            return {"output": "", "success": False, "branches_count": 0}
        
        # Separate successful and failed branches
        successful = [b for b in branches if b.success]
        failed = [b for b in branches if not b.success]
        
        # Build consensus output
        if successful:
            # Use highest ZPE score result as primary
            best_branch = max(successful, key=lambda b: b.zpe_score)
            output = best_branch.result
        else:
            # If all failed, use lowest-cost failure
            best_branch = min(branches, key=lambda b: b.cost_usd)
            output = best_branch.result
        
        # Calculate aggregated metrics
        metrics = self._aggregate_metrics(branches)
        
        # Build contribution analysis
        contributions = self._analyze_contributions(branches)
        
        return {
            "output": output,
            "consolidated": True,
            "success": len(successful) > 0,
            "success_rate": len(successful) / len(branches) if branches else 0.0,
            "metrics": metrics,
            "contributions": contributions,
            "primary_branch": best_branch.branch_id,
            "branches_count": len(branches),
            "successful_branches": len(successful),
        }
    
    def _aggregate_metrics(self, branches: List[Branch]) -> Dict[str, float]:
        """Calculate aggregate metrics across all branches."""
        
        if not branches:
            return {}
        
        total_cost = sum(b.cost_usd for b in branches)
        total_latency = sum(b.latency_ms for b in branches)
        avg_zpe = sum(b.zpe_score for b in branches) / len(branches)
        
        successful = [b for b in branches if b.success]
        success_rate = len(successful) / len(branches) if branches else 0.0
        
        return {
            "total_cost": total_cost,
            "average_cost_per_branch": total_cost / len(branches),
            "total_latency_ms": total_latency,
            "average_latency_ms": total_latency / len(branches),
            "average_zpe_score": avg_zpe,
            "success_rate": success_rate,
            "branches_executed": len(branches),
        }
    
    def _analyze_contributions(self, branches: List[Branch]) -> Dict[str, Any]:
        """Analyze each branch's contribution to final result."""
        
        contributions = {}
        
        for branch in branches:
            score = self._calculate_contribution_score(branch)
            
            contributions[branch.branch_id] = {
                "strategy": branch.strategy.value,
                "role": branch.role,
                "provider": branch.provider,
                "success": branch.success,
                "zpe_score": branch.zpe_score,
                "cost_usd": branch.cost_usd,
                "contribution_score": score,
            }
        
        return contributions
    
    def _calculate_contribution_score(self, branch: Branch) -> float:
        """
        Calculate a branch's contribution score.
        Higher score = better quality, success, and efficiency.
        """
        
        # Base score from ZPE
        score = branch.zpe_score * 100.0
        
        # Success bonus
        if branch.success:
            score *= 1.5
        else:
            score *= 0.5
        
        # Cost penalty (normalize to 0-10 range, assume max $1)
        cost_penalty = min(10.0, branch.cost_usd * 10.0)
        score -= cost_penalty
        
        # Latency penalty (normalize to 0-10 range, assume max 10s)
        latency_penalty = min(10.0, branch.latency_ms / 1000.0)
        score -= latency_penalty
        
        return max(0.0, score)  # Don't return negative scores


class VotingEngine:
    """
    Performs weighted voting across branch results.
    Useful for categorical decisions (e.g., which provider to use next).
    """
    
    def vote(
        self,
        branches: List[Branch],
        attribute: str,
        weight_by: str = "zpe_score"
    ) -> str | None:
        """
        Vote on an attribute using weighted voting.
        
        Args:
            branches: List of branches to vote from
            attribute: Attribute to vote on (e.g., "provider", "role")
            weight_by: Metric to use for weighting (default: zpe_score)
        """
        
        if not branches:
            return None
        
        votes = {}
        
        for branch in branches:
            attr_value = getattr(branch, attribute, None)
            if attr_value is None:
                continue
            
            # Get weight (ZPE score, success count, etc.)
            weight = getattr(branch, weight_by, 1.0)
            
            # Ensure weight is positive
            weight = max(0.1, weight)
            
            if attr_value not in votes:
                votes[attr_value] = 0.0
            
            votes[attr_value] += weight
        
        if not votes:
            return None
        
        # Return attribute with highest weighted votes
        return max(votes.items(), key=lambda x: x[1])[0]
