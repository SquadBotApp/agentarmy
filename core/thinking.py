"""
ThinkingCore - The "blackbox AI brain" of AgentArmyOS
Provides structured reasoning signals to guide planning, universe behavior, routing, and governance
"""
import logging
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class Complexity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class UniverseProfile(Enum):
    ANALYTICAL = "analytical"
    CREATIVE = "creative"
    CONSERVATIVE = "conservative"
    ADVERSARIAL = "adversarial"
    INTUITIVE = "intuitive"
    METACOGNITIVE = "metacognitive"


@dataclass
class PlanSignals:
    """Signals returned from advise_on_plan"""
    complexity: Complexity
    universe_count: int
    subtask_hints: List[str]
    risk: RiskLevel
    confidence: float
    suggested_depth: int = 3


@dataclass
class UniverseSignals:
    """Signals returned from advise_on_universes"""
    profiles: List[UniverseProfile]
    diversity: float
    recursion_needed: bool
    collapse_threshold: float
    confidence: float


@dataclass
class CollapseSignals:
    """Signals returned from advise_on_collapse"""
    winner: int  # Index of winning universe
    confidence: float
    needs_refinement: bool
    notes: List[str] = field(default_factory=list)


@dataclass
class RoutingSignals:
    """Signals returned from advise_on_routing"""
    preferred: str
    fallbacks: List[str]
    cost_tolerance: str
    latency_tolerance: str
    confidence: float


class ThinkingCore:
    """
    The central "brain" that provides reasoning signals to all subsystems.
    Maintains internal state and learns from past outcomes.
    """
    
    def __init__(self, database=None, metrics=None):
        self.db = database
        self.metrics = metrics
        
        # Learning state
        self.learned_profiles = {}  # task_type -> preferred_profiles
        self.learned_thresholds = {}  # collapse thresholds by task type
        self.provider_preferences = {}  # provider -> performance score
        self.complexity_patterns = {}  # task patterns -> complexity
        
        # Internal weights (can be adjusted by learning)
        self.weights = {
            "speed_weight": 0.3,
            "cost_weight": 0.3,
            "accuracy_weight": 0.4,
            "diversity_boost": 0.2,
        }
        
    def advise_on_plan(self, job: Dict[str, Any]) -> PlanSignals:
        """
        Analyze job and return planning guidance.
        
        This is the first thinking step - understanding what we're dealing with.
        """
        job_input = job.get("input_data", "") or job.get("input", "")
        
        # Analyze complexity
        complexity = self._assess_complexity(job_input)
        
        # Determine universe count based on complexity
        universe_count = self._universe_count_for_complexity(complexity)
        
        # Generate subtask hints
        subtask_hints = self._decompose_task(job_input)
        
        # Assess risk
        risk = self._assess_risk(job_input)
        
        # Calculate confidence based on pattern match
        confidence = self._calculate_confidence(job_input, complexity)
        
        # Suggested plan depth
        depth = 3 if complexity == Complexity.LOW else (6 if complexity == Complexity.MEDIUM else 9)
        
        logger.info(f"ThinkingCore: complexity={complexity.value}, universes={universe_count}, risk={risk.value}")
        
        return PlanSignals(
            complexity=complexity,
            universe_count=universe_count,
            subtask_hints=subtask_hints,
            risk=risk,
            confidence=confidence,
            suggested_depth=depth
        )
    
    def advise_on_universes(self, job: Dict[str, Any], prior_results: Optional[List[Dict]] = None) -> UniverseSignals:
        """
        Determine universe profiles, diversity, and whether to recurse.
        """
        job_input = job.get("input_data", "") or job.get("input", "")
        
        # Select profiles based on task type
        profiles = self._select_universe_profiles(job_input, prior_results)
        
        # Determine diversity level
        diversity = self._calculate_diversity(job_input, prior_results)
        
        # Decide if recursion is needed
        recursion_needed = self._should_recurse(prior_results)
        
        # Determine collapse threshold
        collapse_threshold = self._get_collapse_threshold(job_input)
        
        confidence = 0.7 if prior_results is None else 0.85
        
        return UniverseSignals(
            profiles=profiles,
            diversity=diversity,
            recursion_needed=recursion_needed,
            collapse_threshold=collapse_threshold,
            confidence=confidence
        )
    
    def advise_on_collapse(self, universe_outputs: List[Dict[str, Any]]) -> CollapseSignals:
        """
        Evaluate universe outputs and determine winner + whether to refine.
        """
        if not universe_outputs:
            return CollapseSignals(
                winner=0,
                confidence=0.0,
                needs_refinement=False,
                notes=["No outputs to evaluate"]
            )
        
        # Score each universe
        scores = []
        for i, output in enumerate(universe_outputs):
            zpe = output.get("zpe_score", 0.5)
            length = len(output.get("output", ""))
            quality = output.get("quality_score", 0.5)
            
            # Weighted score
            score = (zpe * 0.5) + (min(length / 1000, 1.0) * 0.2) + (quality * 0.3)
            scores.append(score)
        
        # Find winner
        winner = scores.index(max(scores))
        confidence = max(scores)
        
        # Decide if refinement needed
        needs_refinement = confidence < 0.6 or len(scores) > 1
        
        # Generate notes
        notes = []
        if confidence < 0.6:
            notes.append("Low confidence - recommend refinement")
        if len(set(scores)) == 1:
            notes.append("Universes converged - no clear winner")
        
        return CollapseSignals(
            winner=winner,
            confidence=confidence,
            needs_refinement=needs_refinement,
            notes=notes
        )
    
    def advise_on_routing(self, task: Dict[str, Any], providers: List[Dict[str, Any]]) -> RoutingSignals:
        """
        Choose best provider based on task and provider performance.
        """
        if not providers:
            return RoutingSignals(
                preferred="openai",
                fallbacks=["claude"],
                cost_tolerance="medium",
                latency_tolerance="medium",
                confidence=0.5
            )
        
        # Assess task requirements
        task_complexity = task.get("complexity", "medium")
        
        # Match providers to task
        scored_providers = []
        for provider in providers:
            name = provider.get("name", "unknown")
            perf = self.provider_preferences.get(name, {})
            
            # Score based on performance history
            accuracy = perf.get("accuracy", 0.7)
            latency = perf.get("latency", 100)
            cost = perf.get("cost", 0.01)
            
            # Weight based on task
            if task_complexity == "high":
                score = (accuracy * 0.5) + ((1 - latency/1000) * 0.3) + ((1 - cost) * 0.2)
            else:
                score = ((1 - cost) * 0.4) + (accuracy * 0.3) + ((1 - latency/1000) * 0.3)
            
            scored_providers.append((name, score, cost, latency))
        
        # Sort by score
        scored_providers.sort(key=lambda x: x[1], reverse=True)
        
        preferred = scored_providers[0][0] if scored_providers else providers[0].get("name", "openai")
        fallbacks = [p[0] for p in scored_providers[1:3]] if len(scored_providers) > 1 else []
        
        return RoutingSignals(
            preferred=preferred,
            fallbacks=fallbacks,
            cost_tolerance="low" if task_complexity == "high" else "medium",
            latency_tolerance="low" if task_complexity == "high" else "medium",
            confidence=0.75
        )
    
    # --- Internal analysis methods ---
    
    def _assess_complexity(self, text: str) -> Complexity:
        """Assess task complexity from input text"""
        text_lower = text.lower()
        
        # Complexity indicators
        complex_verbs = ["analyze", "design", "develop", "create", "build", "architect", "implement", "optimize"]
        multi_step = ["first", "then", "next", "finally", "step", "phase", "stage"]
        decision = ["choose", "which", "best", "compare", "decide"]
        
        score = 0
        
        if len(text) > 500:
            score += 2
        elif len(text) > 200:
            score += 1
            
        score += sum(1 for v in complex_verbs if v in text_lower)
        score += sum(1 for m in multi_step if m in text_lower)
        score += sum(1 for d in decision if d in text_lower)
        
        if score >= 5:
            return Complexity.HIGH
        elif score >= 2:
            return Complexity.MEDIUM
        else:
            return Complexity.LOW
    
    def _universe_count_for_complexity(self, complexity: Complexity) -> int:
        """Map complexity to universe count"""
        if complexity == Complexity.HIGH:
            return 9
        elif complexity == Complexity.MEDIUM:
            return 6
        else:
            return 3
    
    def _decompose_task(self, text: str) -> List[str]:
        """Generate subtask hints from task text"""
        hints = []
        
        # Look for action words
        actions = ["analyze", "research", "design", "implement", "test", "review", "optimize"]
        for action in actions:
            if action in text.lower():
                hints.append(f"Include {action} step")
        
        # Look for deliverable types
        deliverables = ["report", "code", "plan", "analysis", "design", "prototype"]
        for deliverable in deliverables:
            if deliverable in text.lower():
                hints.append(f"Produce {deliverable}")
        
        return hints[:5]  # Limit to 5 hints
    
    def _assess_risk(self, text: str) -> RiskLevel:
        """Assess risk level of the task"""
        text_lower = text.lower()
        
        # High risk indicators
        high_risk = ["production", "deploy", "critical", "security", "financial", "payment"]
        if any(word in text_lower for word in high_risk):
            return RiskLevel.HIGH
        
        # Medium risk indicators
        medium_risk = ["modify", "change", "update", "migrate", "refactor"]
        if any(word in text_lower for word in medium_risk):
            return RiskLevel.MEDIUM
        
        return RiskLevel.LOW
    
    def _calculate_confidence(self, text: str, complexity: Complexity) -> float:
        """Calculate confidence in our assessment"""
        base_confidence = 0.7
        
        # More context = higher confidence
        if len(text) > 100:
            base_confidence += 0.1
            
        # Clear instructions = higher confidence
        if "?" in text or "please" in text.lower():
            base_confidence += 0.1
            
        # High complexity = lower confidence
        if complexity == Complexity.HIGH:
            base_confidence -= 0.1
            
        return max(0.5, min(0.95, base_confidence))
    
    def _select_universe_profiles(self, task: str, prior_results: Optional[List]) -> List[UniverseProfile]:
        """Select universe profiles based on task"""
        task_lower = task.lower()
        
        # Always include analytical
        profiles = [UniverseProfile.ANALYTICAL]
        
        # Add based on task type
        if "creative" in task_lower or "novel" in task_lower or "design" in task_lower:
            profiles.append(UniverseProfile.CREATIVE)
            
        if "compare" in task_lower or "evaluate" in task_lower or "assess" in task_lower:
            profiles.append(UniverseProfile.CONSERVATIVE)
            
        if "challenge" in task_lower or "test" in task_lower or "verify" in task_lower:
            profiles.append(UniverseProfile.ADVERSARIAL)
        
        # Ensure we have at least 3
        while len(profiles) < 3:
            profiles.append(UniverseProfile.INTUITIVE)
            
        return profiles[:6]  # Max 6 profiles
    
    def _calculate_diversity(self, task: str, prior_results: Optional[List]) -> float:
        """Calculate desired diversity between universes"""
        if prior_results is None:
            return 0.7  # Default high diversity
            
        # If prior results are similar, reduce diversity
        if len(prior_results) > 1:
            outputs = [r.get("output", "") for r in prior_results]
            # Simple similarity check
            words = [set(o.lower().split()) for o in outputs if o]
            if words:
                intersections = sum(len(words[i] & words[j]) for i in range(len(words)) for j in range(i+1, len(words)))
                avg_intersection = intersections / (len(words) * (len(words) - 1) / 2) if len(words) > 1 else 0
                return max(0.3, 1.0 - avg_intersection)
                
        return 0.6
    
    def _should_recurse(self, prior_results: Optional[List]) -> bool:
        """Decide if recursive refinement is needed"""
        if not prior_results:
            return False
            
        # Check if outputs are diverse enough
        scores = [r.get("zpe_score", 0.5) for r in prior_results]
        if scores:
            variance = sum((s - sum(scores)/len(scores))**2 for s in scores) / len(scores)
            return variance < 0.05  # Low variance = converged, no need to recurse
            
        return False
    
    def _get_collapse_threshold(self, task: str) -> float:
        """Get collapse threshold based on task"""
        # Check for learned threshold
        task_type = self._categorize_task(task)
        if task_type in self.learned_thresholds:
            return self.learned_thresholds[task_type]
            
        # Default threshold
        return 0.5
    
    def _categorize_task(self, text: str) -> str:
        """Categorize task type"""
        text_lower = text.lower()
        if any(w in text_lower for w in ["code", "implement", "debug"]):
            return "coding"
        if any(w in text_lower for w in ["analyze", "research", "investigate"]):
            return "analysis"
        if any(w in text_lower for w in ["design", "create", "build"]):
            return "creative"
        return "general"
    
    # --- Learning methods ---
    
    def learn(self, job_result: Dict[str, Any]):
        """
        Learn from job outcome to improve future decisions.
        Called after job completion.
        """
        # Extract metrics from result
        complexity = job_result.get("complexity")
        universe_count = job_result.get("universe_count")
        success = job_result.get("success", False)
        cost = job_result.get("cost", 0)
        time_taken = job_result.get("time_taken", 0)
        
        # Update provider preferences
        provider = job_result.get("provider")
        if provider and success:
            perf = self.provider_preferences.get(provider, {
                "accuracy": 0.7, "latency": 100, "cost": 0.01, "count": 0
            })
            perf["count"] = perf.get("count", 0) + 1
            perf["accuracy"] = (perf["accuracy"] * (perf["count"] - 1) + 1.0) / perf["count"]
            self.provider_preferences[provider] = perf
        
        logger.info(f"ThinkingCore learned from job: success={success}, provider={provider}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get thinking core statistics"""
        return {
            "provider_preferences": self.provider_preferences,
            "learned_thresholds": self.learned_thresholds,
            "weights": self.weights,
            "complexity_patterns": len(self.complexity_patterns)
        }


# Singleton instance
_thinking_core = None

def get_thinking_core(database=None, metrics=None) -> ThinkingCore:
    """Get the global thinking core instance"""
    global _thinking_core
    if _thinking_core is None:
        _thinking_core = ThinkingCore(database, metrics)
    return _thinking_core

