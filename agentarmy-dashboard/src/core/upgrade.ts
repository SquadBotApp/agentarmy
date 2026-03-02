import { AgentArmyState, initialAgentArmyState } from "./types";
import { scoreUniverse } from "./score";

export type ScoredCandidate = {
  state: AgentArmyState;
  score: number;
  passes: boolean;
  reasons: string[];
  diff: string[];
  id?: string;
};

export function generateCandidateChanges(state: AgentArmyState): AgentArmyState[] {
  const out: AgentArmyState[] = [];
  // small tweaks to metrics (zpe adjustments)
  for (const dz of [-0.12, -0.06, 0.06, 0.12]) {
    const s = deepClone(state);
    s.metrics = { ...s.metrics, zpe: clamp(s.metrics.zpe + dz, 0.2, 2) };
    s.version = (s.version || 0) + 1;
    out.push(s);
  }

  // resonance vs cost tradeoffs
  const s2 = deepClone(state);
  s2.metrics = {
    ...s2.metrics,
    resonance: clamp(s2.metrics.resonance + 0.08, 0, 1),
    cost: clamp(s2.metrics.cost + 0.04, 0, 1),
    safety: clamp(s2.metrics.safety - 0.02, 0, 1),
  };
  s2.version = (s2.version || 0) + 1;
  out.push(s2);

  // toggle active universe options
  for (const u of state.universes.map((u) => u.name)) {
    const s3 = deepClone(state);
    s3.activeUniverse = u;
    s3.version = (s3.version || 0) + 1;
    out.push(s3);
  }

  // tool capability tweaks across several tools
  for (let i = 0; i < Math.min(3, state.tools.length); i++) {
    const s4 = deepClone(state);
    s4.tools = s4.tools.map((t, idx) => (idx === i ? { ...t, capability: clamp(t.capability + 0.05, 0, 1) } : t));
    s4.version = (s4.version || 0) + 1;
    out.push(s4);
  }

  // propose adding a tiny helper tool (simulate marketplace install)
  const s5 = deepClone(state);
  const newToolName = `helper-${(state.tools.length + 1)}`;
  const newToolId = `t${state.tools.length + 1}`;
  s5.tools = [
    ...s5.tools,
    { id: newToolId, name: newToolName, capability: 0.12 },
  ];
  s5.metrics = { ...s5.metrics, cost: clamp(s5.metrics.cost + 0.02, 0, 1) };
  s5.version = (s5.version || 0) + 1;
  out.push(s5);

  return out;
}

export function constitutionFailures(state: AgentArmyState): string[] {
  const reasons: string[] = [];
  if (state.metrics.safety < 0.2) reasons.push(`safety too low (${state.metrics.safety.toFixed(2)})`);
  if (state.metrics.cost > 0.95) reasons.push(`cost too high (${state.metrics.cost.toFixed(2)})`);
  if (state.metrics.zpe < 0.2 || state.metrics.zpe > 2) reasons.push(`zpe out of bounds (${state.metrics.zpe.toFixed(2)})`);
  // extra: disallow adding too many tools
  if (state.tools.length > 12) reasons.push(`too many tools (${state.tools.length})`);
  return reasons;
}

export function passesConstitution(state: AgentArmyState) {
  return constitutionFailures(state).length === 0;
}

export function proposeCandidates(state: AgentArmyState): ScoredCandidate[] {
  const candidates = generateCandidateChanges(state);
  const scored = candidates.map((c, i) => {
    const score = scoreUniverse(c);
    const reasons = constitutionFailures(c);
    const id = `cand-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`;
    return {
      id,
      state: c,
      score,
      passes: reasons.length === 0,
      reasons,
      diff: describeDiff(state, c),
    } as ScoredCandidate;
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function pickWithGovernance(candidates: AgentArmyState[], humanOverride = false): ScoredCandidate {
  const scored = candidates.map((c) => {
    const score = scoreUniverse(c);
    const reasons = constitutionFailures(c);
    return { state: c, score, passes: reasons.length === 0, reasons, diff: [] } as ScoredCandidate;
  });
  const filtered = scored.filter((s) => s.passes);
  if (filtered.length === 0) return { state: initialAgentArmyState, score: scoreUniverse(initialAgentArmyState), passes: false, reasons: constitutionFailures(initialAgentArmyState), diff: [] } as ScoredCandidate;
  filtered.sort((a, b) => b.score - a.score);
  return filtered[0];
}

function deepClone<T>(v: T): T {
  return structuredClone(v);
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function describeDiff(a: AgentArmyState, b: AgentArmyState): string[] {
  const out: string[] = [];
  if (a.activeUniverse !== b.activeUniverse) out.push(`universe: ${a.activeUniverse} → ${b.activeUniverse}`);
  const mkeys: (keyof AgentArmyState['metrics'])[] = ['zpe', 'resonance', 'safety', 'cost'];
  for (const k of mkeys) {
    const av = Number(a.metrics[k]);
    const bv = Number(b.metrics[k]);
    if (Math.abs(av - bv) > 0.001) out.push(`${k}: ${av.toFixed(2)} → ${bv.toFixed(2)}`);
  }
  // tools diff
  if (a.tools.length !== b.tools.length) out.push(`tools: count ${a.tools.length} → ${b.tools.length}`);
  const min = Math.min(a.tools.length, b.tools.length);
  for (let i = 0; i < min; i++) {
    const ta = a.tools[i];
    const tb = b.tools[i];
    if (ta.name !== tb.name) out.push(`tool[${i}] name: ${ta.name} → ${tb.name}`);
    if (Math.abs((ta as any).capability - (tb as any).capability) > 0.001) out.push(`tool[${i}] cap: ${(ta as any).capability.toFixed(2)} → ${(tb as any).capability.toFixed(2)}`);
  }
  // policies
  if (JSON.stringify(a.policies) !== JSON.stringify(b.policies)) out.push(`policies changed`);
  return out;
}
