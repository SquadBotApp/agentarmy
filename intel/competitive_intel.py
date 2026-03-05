"""
Competitive Intelligence Module for AgentArmyOS
Aggregates, analyzes, and scores agent/model/provider performance for competitive selection and optimization.
"""

from typing import List, Dict, Any

class CompetitiveIntel:
    def __init__(self):
        self.history = []  # Store past results for analysis

    def record_result(self, agent: str, provider: str, result: Dict[str, Any]):
        self.history.append({
            'agent': agent,
            'provider': provider,
            'result': result
        })

    def top_performers(self, metric: str = 'score', top_n: int = 3) -> List[Dict[str, Any]]:
        # Return top N performers by metric (descending)
        scored = [h for h in self.history if metric in h['result']]
        scored.sort(key=lambda x: x['result'][metric], reverse=True)
        return scored[:top_n]

    def provider_stats(self) -> Dict[str, Any]:
        # Aggregate stats by provider
        stats = {}
        for h in self.history:
            p = h['provider']
            stats.setdefault(p, {'count': 0, 'success': 0, 'fail': 0})
            stats[p]['count'] += 1
            if h['result'].get('status') == 'success':
                stats[p]['success'] += 1
            else:
                stats[p]['fail'] += 1
        return stats

    def recommend_provider(self) -> str:
        # Recommend provider with highest success rate
        stats = self.provider_stats()
        best = None
        best_rate = 0.0
        for p, s in stats.items():
            rate = s['success'] / s['count'] if s['count'] else 0
            if rate > best_rate:
                best = p
                best_rate = rate
        return best or 'unknown'
