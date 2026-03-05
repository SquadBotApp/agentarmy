class MetaSynthesizer:
    def synthesize(self, universes):
        """Synthesizes results from multiple universes into a meta-result."""
        return f"MetaSynth({', '.join(str(u) for u in universes)})"
