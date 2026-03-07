# Make core.universes a package
# Import from the actual location: core.expansion.universes
from core.expansion.universes import Universe, UniverseManager, UniverseState, ReasoningStyle

# Alias for backwards compatibility
Universes = UniverseManager

__all__ = ["Universe", "UniverseManager", "Universes", "UniverseState", "ReasoningStyle"]
