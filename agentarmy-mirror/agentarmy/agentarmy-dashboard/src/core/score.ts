import { AgentArmyState } from "./types";

// Simple weighted scoring function representing ZPE master equation
export function scoreUniverse(state: AgentArmyState) {
  const m = state.metrics;
  // weights (tweakable)
  const W = { zpe: 1.2, resonance: 1.5, safety: 3, cost: -1 };

  // base score: weighted sum
  let score = 0;
  score += m.zpe * W.zpe;
  score += m.resonance * W.resonance;
  score += m.safety * W.safety;
  score += (1 - m.cost) * Math.abs(W.cost);

  // small bonus for tool capability aggregate
  const toolCap = state.tools.reduce((s, t) => s + t.capability, 0) / Math.max(1, state.tools.length);
  score += toolCap * 0.5;

  // normalize roughly
  return score;
}

/**
 * Lightweight text scoring used for multi-model consensus.
 * Uses sliders as weighting to reward harmonic structure or length.
 */
export function scoreText(content: string, sliders: { z: number; p: number; e: number }) {
  // simple heuristic: base on length and punctuation frequency
  let len = content.length;
  let periods = (content.match(/\./g) || []).length;
  let commas = (content.match(/,/g) || []).length;
  let score = len * 0.1 + periods * 2 + commas;
  // apply sliders as multipliers
  score *= sliders.z * 0.6 + sliders.p * 0.3 + sliders.e * 0.1;
  return score;
}
