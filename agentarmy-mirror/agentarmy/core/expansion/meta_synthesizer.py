"""MetaSynthesizer - combines universe outputs into higher-order synthesis"""
class MetaSynthesizer:
    def synthesize(self, results):
        if isinstance(results, list):
            return {"synthesized": True, "outputs": results}
        return results

