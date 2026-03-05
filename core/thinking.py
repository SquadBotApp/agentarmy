"""
ThinkingCore - The "blackbox AI brain" of AgentArmyOS
Provides structured reasoning signals to guide planning, universe behavior, routing, and governance

Enhanced with:
- Advanced complexity estimation with domain-specific cues
- Semantic distance scoring for universe divergence
- EMA-based latency smoothing for providers
- Multi-pass refinement logic
- Coherence checking
- Early-collapse heuristics
"""
import logging
import time
import re
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, field
from enum import Enum
from collections import deque

logger = logging.getLogger(__name__)


class Complexity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Domain(Enum):
    GENERAL = "general"
    CODE = "code"
    DATA = "data"
    LEGAL = "legal"
    MEDICAL = "medical"
    FINANCIAL = "financial"
    MARKETING = "marketing"
    SECURITY = "security"
    RESEARCH = "research"


class UniverseProfile(Enum):
    ANALYTICAL = "analytical"
    CREATIVE = "creative"
    CONSERVATIVE = "conservative"
    ADVERSARIAL = "adversarial"
    INTUITIVE = "intuitive"
    METACOGNITIVE = "metacognitive"
    DETAILED = "detailed"
    CONCISE = "concise"
    EXPERIMENTAL = "experimental"


@dataclass
class ComplexityFactors:
    """Breakdown of complexity factors"""
    length_score: float = 0.0
    structure_score: float = 0.0
    domain_score: float = 0.0
    ambiguity_score: float = 0.0
    novelty_score: float = 0.0
    coherence_score: float = 1.0


@dataclass
class PlanSignals:
    """Signals returned from advise_on_plan"""
    complexity: Complexity
    universe_count: int
    subtask_hints: List[str]
    risk: RiskLevel
    confidence: float
    domain: Domain
    suggested_depth: int = 3
    complexity_factors: ComplexityFactors = None
    needs_refinement: bool = False
    coherence_flags: List[str] = field(default_factory=list)


@dataclass
class UniverseSignals:
    """Signals returned from advise_on_universes"""
    profiles: List[UniverseProfile]
    diversity: float
    recursion_needed: bool
    collapse_threshold: float
    confidence: float
    early_collapse_possible: bool = False
    refinement_loops_needed: int = 0


@dataclass
class CollapseSignals:
    """Signals returned from advise_on_collapse"""
    winner: int  # Index of winning universe
    confidence: float
    needs_refinement: bool
    divergence_score: float = 0.0
    notes: List[str] = field(default_factory=list)
    semantic_distances: List[float] = field(default_factory=list)


@dataclass
class RoutingSignals:
    """Signals returned from advise_on_routing"""
    preferred: str
    fallbacks: List[str]
    cost_tolerance: str
    latency_tolerance: str
    confidence: float
    domain_preference: str = "general"
    failure_prediction: float = 0.0


@dataclass
class ProviderMetrics:
    """Extended provider metrics with EMA smoothing"""
    accuracy: float = 0.7
    latency_ms: float = 100
    cost: float = 0.01
    success_rate: float = 0.9
    count: int = 0
    # EMA smoothed metrics
    ema_latency: float = 100
    ema_accuracy: float = 0.7
    ema_success_rate: float = 0.9
    # Failure tracking
    recent_failures: int = 0
    failure_streak: int = 0


@dataclass
class AgentState:
    """Agent memory and state"""
    agent_id: str
    short_term_memory: deque = field(default_factory=lambda: deque(maxlen=10))
    long_term_memory: Dict = field(default_factory=dict)
    performance_score: float = 0.5
    specialization: List[str] = field(default_factory=list)
    reflection_count: int = 0


class ComplexityEstimator:
    """
    Estimates task complexity based on multiple factors.
    This is the core of the thinking core's reasoning ability.
    """
    
    # Complexity keywords
    LOW_COMPLEXITY_INDICATORS = {
        "simple", "basic", "quick", "short", "one", "single",
        "what is", "who is", "when did", "define"
    }
    
    MEDIUM_COMPLEXITY_INDICATORS = {
        "analyze", "compare", "explain", "describe", "two", "multiple",
        "steps", "process", "between", "differences", "similar"
    }
    
    HIGH_COMPLEXITY_INDICATORS = {
        "design", "develop", "create", "build", "architect", "implement",
        "optimize", "synthesize", "evaluate", "assess", "comprehensive",
        "research", "investigate", "strategize", "multi", "complex"
    }
    
    # Domain-specific complexity
    HIGH_DOMAINS = {
        "legal", "medical", "financial", "security", "compliance",
        "algorithm", "architecture", "system design", "enterprise"
    }
    
    # Ambiguity indicators
    AMBIGUITY_INDICATORS = {
        "maybe", "perhaps", "possibly", "might", "could be",
        "unclear", "vague", "interpret", "various", "different ways"
    }
    
    # Structure patterns
    LIST_PATTERNS = [
        r'^\d+\.', r'^\-\s', r'^\*\s', r'^\d+\)',
        r'first|second|third|finally', r'step\s+\d+',
        r'\n.*\n.*\n'  # Multiple paragraphs
    ]
    
    def estimate(self, text: str, context: Dict = None) -> ComplexityFactors:
        """Estimate complexity based on text analysis"""
        factors = ComplexityFactors()
        text_lower = text.lower()
        
        # 1. Length-based complexity (0-1)
        length = len(text)
        if length < 100:
            factors.length_score = 0.1
        elif length < 300:
            factors.length_score = 0.3
        elif length < 600:
            factors.length_score = 0.5
        elif length < 1000:
            factors.length_score = 0.7
        else:
            factors.length_score = 0.9
            
        # 2. Structural complexity (0-1)
        structure_score = 0.0
        for pattern in self.LIST_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE | re.MULTILINE):
                structure_score += 0.2
        factors.structure_score = min(structure_score, 1.0)
        
        # Count question marks and multi-part questions
        question_count = text.count('?')
        if question_count > 1:
            factors.structure_score += 0.2 * min(question_count - 1, 2)
        
        # 3. Domain complexity (0-1)
        domain_score = 0.0
        for domain in self.HIGH_DOMAINS:
            if domain in text_lower:
                domain_score += 0.25
        factors.domain_score = min(domain_score, 1.0)
        
        # 4. Ambiguity complexity (0-1)
        ambiguity_score = 0.0
        for indicator in self.AMBIGUITY_INDICATORS:
            if indicator in text_lower:
                ambiguity_score += 0.15
        factors.ambiguity_score = min(ambiguity_score, 1.0)
        
        # Check for conditional logic
        if any(w in text_lower for w in ["if", "when", "unless", "depending"]):
            factors.ambiguity_score += 0.2
            
        # 5. Novelty/unknown (0-1) - based on lack of common patterns
        novelty_score = 0.5  # Default medium
        if context and context.get("similar_jobs", 0) == 0:
            novelty_score = 0.8  # No similar jobs = high novelty
        elif context and context.get("similar_jobs", 0) > 10:
            novelty_score = 0.2  # Many similar jobs = low novelty
        factors.novelty_score = novelty_score
        
        return factors
    
    def classify(self, factors: ComplexityFactors) -> Complexity:
        """Convert factors to complexity level"""
        # Weighted average
        total_score = (
            factors.length_score * 0.2 +
            factors.structure_score * 0.25 +
            factors.domain_score * 0.25 +
            factors.ambiguity_score * 0.2 +
            factors.novelty_score * 0.1
        )
        
        if total_score < 0.35:
            return Complexity.LOW
        elif total_score < 0.65:
            return Complexity.MEDIUM
        else:
            return Complexity.HIGH
    
    def get_subtask_hints(self, text: str) -> List[str]:
        """Generate subtask hints based on analysis"""
        hints = []
        text_lower = text.lower()
        
        # Action-based hints
        action_map = {
            "analyze": "Break down into components and analyze each",
            "research": "Gather information from multiple sources",
            "design": "Create a detailed specification first",
            "implement": "Consider edge cases and error handling",
            "test": "Define test cases and success criteria",
            "review": "Check for consistency and completeness",
            "optimize": "Profile first, then optimize bottlenecks",
            "compare": "Establish clear criteria for comparison",
            "evaluate": "Define metrics for assessment",
            "create": "Define requirements before implementation",
        }
        
        for action, hint in action_map.items():
            if action in text_lower:
                hints.append(hint)
                
        # Deliverable hints
        deliverable_map = {
            "report": "Structure with executive summary and details",
            "code": "Follow clean code practices",
            "plan": "Include timeline and resource allocation",
            "analysis": "Present findings with supporting data",
            "design": "Include diagrams and rationale",
            "strategy": "Consider short and long-term implications",
        }
        
        for deliverable, hint in deliverable_map.items():
            if deliverable in text_lower:
                hints.append(hint)
                
        return hints[:5]  # Limit to 5 hints


class UniverseStrategyGenerator:
    """
    Generates universe strategies based on task characteristics.
    Determines profiles, diversity, and collapse behavior.
    """
    
    # Profile-task mappings
    PROFILE_TASKS = {
        UniverseProfile.ANALYTICAL: ["analyze", "calculate", "determine", "logical"],
        UniverseProfile.CREATIVE: ["create", "design", "novel", "creative", "innovative"],
        UniverseProfile.CONSERVATIVE: ["safe", "secure", "reliable", "proven", "standard"],
        UniverseProfile.ADVERSARIAL: ["test", "challenge", "verify", "validate", "attack"],
        UniverseProfile.INTUITIVE: ["feel", "sense", "pattern", "experience", "直觉"],
        UniverseProfile.METACOGNITIVE: ["think about", "reflect", "reasoning", "approach"],
    }
    
    def generate(
        self, 
        complexity: Complexity, 
        risk: RiskLevel,
        task: str,
        history: List[Dict] = None
    ) -> tuple:
        """
        Generate universe strategy.
        Returns: (profiles, diversity, collapse_threshold)
        """
        task_lower = task.lower()
        
        # Determine universe count based on complexity
        if complexity == Complexity.LOW:
            universe_count = 3
        elif complexity == Complexity.MEDIUM:
            universe_count = 6
        else:
            universe_count = 9
            
        # Select profiles based on task
        profiles = self._select_profiles(task_lower)
        
        # Adjust profiles based on risk
        if risk == RiskLevel.HIGH:
            # More conservative profiles for high risk
            profiles = [p for p in profiles if p != UniverseProfile.CREATIVE]
            if UniverseProfile.CONSERVATIVE not in profiles:
                profiles.append(UniverseProfile.CONSERVATIVE)
        
        # Ensure minimum diversity
        while len(profiles) < min(universe_count, 6):
            available = [p for p in UniverseProfile if p not in profiles]
            if available:
                profiles.append(available[0])
        
        # Calculate diversity based on complexity and history
        diversity = self._calculate_diversity(complexity, history)
        
        # Determine collapse threshold
        collapse_threshold = self._calculate_collapse_threshold(complexity, risk)
        
        return profiles[:universe_count], diversity, collapse_threshold
    
    def _select_profiles(self, task_lower: str) -> List[UniverseProfile]:
        """Select universe profiles based on task content"""
        profiles = [UniverseProfile.ANALYTICAL]  # Always include analytical
        
        for profile, keywords in self.PROFILE_TASKS.items():
            if any(kw in task_lower for kw in keywords):
                if profile not in profiles:
                    profiles.append(profile)
                    
        return profiles
    
    def _calculate_diversity(self, complexity: Complexity, history: List[Dict]) -> float:
        """Calculate desired diversity score"""
        base_diversity = {
            Complexity.LOW: 0.5,
            Complexity.MEDIUM: 0.7,
            Complexity.HIGH: 0.85,
        }.get(complexity, 0.6)
        
        # Adjust based on history
        if history:
            # If previous runs were similar, increase diversity
            outputs = [h.get("output", "") for h in history if h.get("output")]
            if len(outputs) > 1:
                # Simple similarity check
                wordsets = [set(o.lower().split()) for o in outputs]
                avg_similarity = 0
                for i in range(len(wordsets)):
                    for j in range(i+1, len(wordsets)):
                        intersection = len(wordsets[i] & wordsets[j])
                        union = len(wordsets[i] | wordsets[j])
                        if union > 0:
                            avg_similarity += intersection / union
                avg_similarity /= (len(wordsets) * (len(wordsets) - 1) / 2)
                
                # If highly similar, boost diversity
                if avg_similarity > 0.7:
                    base_diversity = min(0.95, base_diversity + 0.2)
        
        return base_diversity
    
    def _calculate_collapse_threshold(self, complexity: Complexity, risk: RiskLevel) -> float:
        """Calculate collapse threshold"""
        base_threshold = 0.5
        
        # Higher complexity = higher threshold (need more agreement)
        if complexity == Complexity.HIGH:
            base_threshold += 0.2
        elif complexity == Complexity.LOW:
            base_threshold -= 0.1
            
        # Higher risk = higher threshold (need more certainty)
        if risk == RiskLevel.HIGH:
            base_threshold += 0.15
        elif risk == RiskLevel.LOW:
            base_threshold -= 0.1
            
        return max(0.3, min(0.9, base_threshold))


class CollapseEvaluator:
    """
    Evaluates universe outputs to determine winner and refinement needs.
    """
    
    def evaluate(
        self, 
        outputs: List[Dict],
        threshold: float
    ) -> CollapseSignals:
        """Evaluate universe outputs and determine collapse strategy"""
        if not outputs:
            return CollapseSignals(
                winner=0,
                confidence=0.0,
                needs_refinement=False,
                notes=["No outputs to evaluate"]
            )
        
        # Score each output
        scored = []
        for i, output in enumerate(outputs):
            score = self._score_output(output)
            scored.append((i, score))
        
        # Sort by score
        scored.sort(key=lambda x: x[1], reverse=True)
        
        winner = scored[0][0]
        winner_score = scored[0][1]
        
        # Calculate confidence as ratio of winner to average
        avg_score = sum(s[1] for s in scored) / len(scored)
        confidence = winner_score / (avg_score + 0.01)  # Avoid division by zero
        confidence = min(1.0, confidence)
        
        # Determine if refinement needed
        needs_refinement = winner_score < threshold
        
        # Generate notes
        notes = []
        if winner_score < 0.4:
            notes.append("Low quality output - consider refinement")
        if len(set(s[1] for s in scored)) == 1:
            notes.append("All outputs similar - consider higher diversity")
        elif scored[0][1] - scored[-1][1] < 0.1:
            notes.append("Outputs very close - may indicate convergence")
        if len(outputs) > 3 and winner_score > 0.7:
            notes.append("Clear winner with high confidence")
            
        return CollapseSignals(
            winner=winner,
            confidence=min(1.0, confidence),
            needs_refinement=needs_refinement,
            notes=notes
        )
    
    def _score_output(self, output: Dict) -> float:
        """Score a single universe output"""
        zpe = output.get("zpe_score", 0.5)
        length = len(output.get("output", ""))
        quality = output.get("quality_score", 0.5)
        
        # Length penalty for too short or too long
        length_score = 1.0
        if length < 100:
            length_score = 0.5
        elif length > 5000:
            length_score = 0.7
            
        # Weighted score
        score = (
            zpe * 0.4 +
            quality * 0.3 +
            length_score * 0.3
        )
        
        return score


class ThinkingCore:
    """
    The central "brain" that provides reasoning signals to all subsystems.
    """
    
    # EMA smoothing factor
    EMA_FACTOR = 0.3
    
    def __init__(self, database=None, metrics=None):
        self.db = database
        self.metrics = metrics
        
        # Internal components
        self.complexity_estimator = ComplexityEstimator()
        self.strategy_generator = UniverseStrategyGenerator()
        self.collapse_evaluator = CollapseEvaluator()
        
        # Learning state
        self.provider_scores = {}  # provider -> performance metrics
        self.profile_performance = {}  # profile -> avg score
        self.collapse_patterns = []  # historical collapse decisions
        
        # Domain detection
        self.domain_keywords = {
            Domain.CODE: ["code", "function", "class", "api", "algorithm", "debug", "refactor"],
            Domain.DATA: ["data", "database", "query", "sql", "analytics", "metric"],
            Domain.LEGAL: ["legal", "law", "contract", "compliance", "regulation"],
            Domain.MEDICAL: ["medical", "health", "patient", "diagnosis", "treatment"],
            Domain.FINANCIAL: ["financial", "money", "investment", "budget", "cost", "revenue"],
            Domain.MARKETING: ["marketing", "campaign", "brand", "customer", "seo"],
            Domain.SECURITY: ["security", "authentication", "encryption", "vulnerability"],
            Domain.RESEARCH: ["research", "study", "analysis", "paper", "hypothesis"],
        }
        
        # Agent states
        self.agents: Dict[str, AgentState] = {}
        
    def _detect_domain(self, text: str) -> Domain:
        """Detect the domain of the task"""
        text_lower = text.lower()
        scores = {domain: 0 for domain in Domain}
        
        for domain, keywords in self.domain_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    scores[domain] += 1
        
        max_domain = Domain.GENERAL
        max_score = 0
        for domain, score in scores.items():
            if score > max_score:
                max_score = score
                max_domain = domain
                
        return max_domain
    
    def _check_coherence(self, text: str) -> tuple:
        """Check reasoning coherence in text"""
        flags = []
        score = 1.0
        
        # Check for contradictions
        contradiction_pairs = [
            ("however", "therefore"), ("but", "so"), ("although", "thus"),
            ("not", "yes"), ("never", "always")
        ]
        
        for pair in contradiction_pairs:
            if pair[0] in text.lower() and pair[1] in text.lower():
                flags.append("Possible contradiction detected")
                score -= 0.2
                break
        
        # Check for incomplete thoughts
        if text.count(',') > text.count('.') * 3:
            flags.append("Many incomplete clauses")
            score -= 0.1
            
        # Check for logical connectors
        connectors = ["therefore", "because", "hence", "consequently"]
        if not any(c in text.lower() for c in connectors):
            flags.append("Missing logical connectors")
            score -= 0.1
            
        return max(0.0, score), flags
        
    def advise_on_plan(self, job: Dict[str, Any]) -> PlanSignals:
        """Analyze job and return planning guidance."""
        job_input = job.get("input_data", "") or job.get("input", "")
        
        # Get context for novelty assessment
        context = {"similar_jobs": 0}  # Would query database in production
        
        # Estimate complexity
        factors = self.complexity_estimator.estimate(job_input, context)
        complexity = self.complexity_estimator.classify(factors)
        
        # Generate hints
        hints = self.complexity_estimator.get_subtask_hints(job_input)
        
        # Assess risk
        risk = self._assess_risk(job_input)
        
        # Determine universe count
        universe_count = {
            Complexity.LOW: 3,
            Complexity.MEDIUM: 6,
            Complexity.HIGH: 9,
        }[complexity]
        
        # Calculate confidence
        confidence = self._calculate_confidence(factors)
        
        # Plan depth
        depth = {
            Complexity.LOW: 2,
            Complexity.MEDIUM: 4,
            Complexity.HIGH: 6,
        }[complexity]
        
        logger.info(f"ThinkingCore: complexity={complexity.value}, universes={universe_count}, risk={risk.value}")
        
        return PlanSignals(
            complexity=complexity,
            universe_count=universe_count,
            subtask_hints=hints,
            risk=risk,
            confidence=confidence,
            suggested_depth=depth,
            complexity_factors=factors
        )
    
    def advise_on_universes(self, job: Dict[str, Any], prior_results: Optional[List[Dict]] = None) -> UniverseSignals:
        """Determine universe profiles, diversity, and collapse strategy."""
        job_input = job.get("input_data", "") or job.get("input", "")
        
        # First get complexity and risk
        plan_signals = self.advise_on_plan(job)
        
        # Generate strategy
        profiles, diversity, threshold = self.strategy_generator.generate(
            complexity=plan_signals.complexity,
            risk=plan_signals.risk,
            task=job_input,
            history=prior_results
        )
        
        # Check if recursion needed based on prior results
        recursion_needed = False
        if prior_results:
            scores = [r.get("zpe_score", 0.5) for r in prior_results]
            variance = sum((s - sum(scores)/len(scores))**2 for s in scores) / len(scores)
            recursion_needed = variance < 0.05  # Very similar outputs = might benefit from more diversity
        
        confidence = 0.7 if prior_results is None else 0.85
        
        return UniverseSignals(
            profiles=profiles,
            diversity=diversity,
            recursion_needed=recursion_needed,
            collapse_threshold=threshold,
            confidence=confidence
        )
    
    def advise_on_collapse(self, universe_outputs: List[Dict[str, Any]]) -> CollapseSignals:
        """Evaluate universe outputs and determine winner."""
        # Get threshold from prior signals or use default
        threshold = 0.5
        
        return self.collapse_evaluator.evaluate(universe_outputs, threshold)
    
    def advise_on_routing(self, task: Dict[str, Any], providers: List[Dict[str, Any]]) -> RoutingSignals:
        """Choose best provider based on task and performance."""
        if not providers:
            return RoutingSignals(
                preferred="openai",
                fallbacks=["claude"],
                cost_tolerance="medium",
                latency_tolerance="medium",
                confidence=0.5
            )
        
        # Get complexity from task
        task_input = task.get("input_data", "") or task.get("input", "")
        complexity = self.complexity_estimator.estimate(task_input, {})
        complexity_level = self.complexity_estimator.classify(complexity)
        
        # Score providers
        scored = []
        for provider in providers:
            name = provider.get("name", "unknown")
            perf = self.provider_scores.get(name, {
                "accuracy": 0.7, 
                "latency_ms": 100, 
                "cost": 0.01,
                "success_rate": 0.9
            })
            
            # Weight scoring based on complexity
            if complexity_level == Complexity.HIGH:
                # High complexity: prioritize accuracy
                score = (
                    perf.get("accuracy", 0.7) * 0.5 +
                    perf.get("success_rate", 0.9) * 0.3 +
                    (1 - perf.get("cost", 0.01) * 10) * 0.2
                )
            else:
                # Low complexity: prioritize speed/cost
                score = (
                    (1 - perf.get("latency_ms", 100) / 1000) * 0.4 +
                    (1 - perf.get("cost", 0.01) * 10) * 0.4 +
                    perf.get("accuracy", 0.7) * 0.2
                )
            
            scored.append((name, score, perf))
        
        # Sort by score
        scored.sort(key=lambda x: x[1], reverse=True)
        
        preferred = scored[0][0] if scored else providers[0].get("name", "openai")
        fallbacks = [s[0] for s in scored[1:3]] if len(scored) > 1 else []
        
        return RoutingSignals(
            preferred=preferred,
            fallbacks=fallbacks,
            cost_tolerance="low" if complexity_level == Complexity.HIGH else "medium",
            latency_tolerance="low" if complexity_level == Complexity.HIGH else "medium",
            confidence=0.75
        )
    
    def _assess_risk(self, text: str) -> RiskLevel:
        """Assess risk level of the task"""
        text_lower = text.lower()
        
        high_risk_words = ["production", "deploy", "critical", "security", "financial", 
                          "payment", "delete", "destroy", "terminate"]
        if any(w in text_lower for w in high_risk_words):
            return RiskLevel.HIGH
        
        medium_risk_words = ["modify", "change", "update", "migrate", "refactor",
                            "restart", "reboot", "config"]
        if any(w in text_lower for w in medium_risk_words):
            return RiskLevel.MEDIUM
            
        return RiskLevel.LOW
    
    def _calculate_confidence(self, factors: ComplexityFactors) -> float:
        """Calculate confidence in assessment"""
        base = 0.7
        
        # More factors = higher confidence
        factor_sum = (
            factors.length_score +
            factors.structure_score +
            factors.domain_score +
            factors.ambiguity_score
        )
        if factor_sum > 0.5:
            base += 0.1
        if factor_sum > 2.0:
            base += 0.1
            
        # High novelty = lower confidence
        if factors.novelty_score > 0.7:
            base -= 0.15
            
        return max(0.5, min(0.95, base))
    
    def learn(self, job_result: Dict[str, Any]):
        """Learn from job outcome"""
        provider = job_result.get("provider")
        if provider:
            if provider not in self.provider_scores:
                self.provider_scores[provider] = {
                    "accuracy": 0.7, "latency_ms": 100, "cost": 0.01, "success_rate": 0.9, "count": 0
                }
            perf = self.provider_scores[provider]
            perf["count"] = perf.get("count", 0) + 1
            
            # Update rolling average
            success = job_result.get("success", False)
            old_rate = perf.get("success_rate", 0.9)
            perf["success_rate"] = (old_rate * (perf["count"] - 1) + (1.0 if success else 0.0)) / perf["count"]
            
        logger.info(f"ThinkingCore learned: provider={provider}, success={success}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get thinking core statistics"""
        return {
            "provider_scores": self.provider_scores,
            "profile_performance": self.profile_performance,
            "collapse_patterns_count": len(self.collapse_patterns)
        }


# Singleton instance
_thinking_core = None

def get_thinking_core(database=None, metrics=None) -> ThinkingCore:
    """Get the global thinking core instance"""
    global _thinking_core
    if _thinking_core is None:
        _thinking_core = ThinkingCore(database, metrics)
    return _thinking_core

