// ---------------------------------------------------------------------------
// Cosmic Abstraction Layer
// ---------------------------------------------------------------------------
// Ultimate abstraction layer that maps every OS concept — agents, missions,
// resources, constraints — to universal mathematical structures (groups,
// rings, lattices, categories).  Enables formal reasoning about the system
// using algebraic invariants and category‑theoretic morphisms.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export type AlgebraicStructure = 'group' | 'ring' | 'lattice' | 'category' | 'topos' | 'monad';
export type MorphismKind = 'identity' | 'composition' | 'functor' | 'natural-transformation' | 'adjunction';

export interface CosmicObject {
  readonly id: string;
  readonly label: string;
  readonly structure: AlgebraicStructure;
  readonly invariant: string;          // human‑readable invariant description
  readonly dimensionality: number;
  readonly createdAt: string;
}

export interface CosmicMorphism {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly kind: MorphismKind;
  readonly preservesInvariant: boolean;
  readonly composable: boolean;
  readonly createdAt: string;
}

export interface AbstractionLevel {
  readonly depth: number;
  readonly objects: number;
  readonly morphisms: number;
  readonly dominantStructure: AlgebraicStructure;
}

export interface UniversalProperty {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly holds: boolean;
  readonly verifiedAt: string;
}

export interface CosmicAbstractionSummary {
  readonly totalObjects: number;
  readonly totalMorphisms: number;
  readonly structures: Record<string, number>;
  readonly maxAbstractionDepth: number;
  readonly universalProperties: number;
  readonly propertiesHolding: number;
  readonly invariantPreservationRate: number;
}

// ---- Layer ----------------------------------------------------------------

export class CosmicAbstraction {
  private readonly objects: CosmicObject[] = [];
  private readonly morphisms: CosmicMorphism[] = [];
  private readonly properties: UniversalProperty[] = [];

  // ---- Object management --------------------------------------------------

  defineObject(label: string, structure: AlgebraicStructure, invariant: string, dimensionality = 1): CosmicObject {
    const obj: CosmicObject = {
      id: `co-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      structure,
      invariant,
      dimensionality,
      createdAt: new Date().toISOString(),
    };
    this.objects.push(obj);
    return obj;
  }

  // ---- Morphism management ------------------------------------------------

  defineMorphism(sourceId: string, targetId: string, kind: MorphismKind): CosmicMorphism | null {
    const src = this.objects.find((o) => o.id === sourceId);
    const tgt = this.objects.find((o) => o.id === targetId);
    if (!src || !tgt) return null;

    const m: CosmicMorphism = {
      id: `cm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      sourceId,
      targetId,
      kind,
      preservesInvariant: src.structure === tgt.structure,
      composable: kind !== 'identity',
      createdAt: new Date().toISOString(),
    };
    this.morphisms.push(m);
    return m;
  }

  compose(morphismA: string, morphismB: string): CosmicMorphism | null {
    const a = this.morphisms.find((m) => m.id === morphismA);
    const b = this.morphisms.find((m) => m.id === morphismB);
    if (!a || !b || a.targetId !== b?.sourceId) return null;
    return this.defineMorphism(a.sourceId, b.targetId, 'composition');
  }

  // ---- Universal properties -----------------------------------------------

  assertProperty(name: string, description: string, holds: boolean): UniversalProperty {
    const prop: UniversalProperty = {
      id: `up-${Date.now().toString(36)}`,
      name,
      description,
      holds,
      verifiedAt: new Date().toISOString(),
    };
    this.properties.push(prop);
    return prop;
  }

  verifyProperty(propertyId: string, holds: boolean): boolean {
    const idx = this.properties.findIndex((p) => p.id === propertyId);
    if (idx < 0) return false;
    this.properties[idx] = { ...this.properties[idx], holds, verifiedAt: new Date().toISOString() };
    return true;
  }

  // ---- Query --------------------------------------------------------------

  getAbstractionLevels(): AbstractionLevel[] {
    const depthMap = new Map<number, { objects: CosmicObject[]; morphisms: CosmicMorphism[] }>();
    for (const obj of this.objects) {
      const entry = depthMap.get(obj.dimensionality) ?? { objects: [], morphisms: [] };
      entry.objects.push(obj);
      depthMap.set(obj.dimensionality, entry);
    }
    return Array.from(depthMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([depth, { objects: objs }]) => {
        const structCounts: Record<string, number> = {};
        for (const o of objs) structCounts[o.structure] = (structCounts[o.structure] ?? 0) + 1;
        const dominant = Object.entries(structCounts).sort(([, a], [, b]) => b - a)[0];
        return {
          depth,
          objects: objs.length,
          morphisms: this.morphisms.filter(
            (m) => objs.some((o) => o.id === m.sourceId) || objs.some((o) => o.id === m.targetId),
          ).length,
          dominantStructure: (dominant?.[0] ?? 'category') as AlgebraicStructure,
        };
      });
  }

  // ---- Summary ------------------------------------------------------------

  getSummary(): CosmicAbstractionSummary {
    const structures: Record<string, number> = {};
    for (const o of this.objects) structures[o.structure] = (structures[o.structure] ?? 0) + 1;
    const invariantPreservation = this.morphisms.length > 0
      ? this.morphisms.filter((m) => m.preservesInvariant).length / this.morphisms.length
      : 0;
    return {
      totalObjects: this.objects.length,
      totalMorphisms: this.morphisms.length,
      structures,
      maxAbstractionDepth: this.objects.length > 0 ? Math.max(...this.objects.map((o) => o.dimensionality)) : 0,
      universalProperties: this.properties.length,
      propertiesHolding: this.properties.filter((p) => p.holds).length,
      invariantPreservationRate: Number(invariantPreservation.toFixed(3)),
    };
  }
}
