import {
  AgentEnforcementStatus,
  SwarmDomain,
  SwarmIntelligenceEngine,
  SwarmTier,
} from '../swarmIntelligenceEngine';

const knownAgentId = `${SwarmDomain.ForceField}-agent-0`;

describe('SwarmIntelligenceEngine enforcement hardening', () => {
  it('rejects belief propagation for unknown agent, blank content, and non-finite confidence', () => {
    const engine = new SwarmIntelligenceEngine(SwarmTier.Standard);

    expect(engine.propagateBelief('missing-agent', SwarmDomain.Sensor, 'x', 0.5)).toBeNull();
    expect(engine.propagateBelief(knownAgentId, SwarmDomain.Sensor, '   ', 0.5)).toBeNull();
    expect(engine.propagateBelief(knownAgentId, SwarmDomain.Sensor, 'valid', Number.NaN)).toBeNull();
    expect(engine.getCollectiveBeliefs()).toHaveLength(0);
  });

  it('trims belief content and corroborates same normalized belief', () => {
    const engine = new SwarmIntelligenceEngine(SwarmTier.Standard);

    const first = engine.propagateBelief(knownAgentId, SwarmDomain.Sensor, '  signal-quality-high  ', 0.7);
    const second = engine.propagateBelief(knownAgentId, SwarmDomain.Sensor, 'signal-quality-high', 0.9);

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(engine.getCollectiveBeliefs()).toHaveLength(1);
    expect(engine.getCollectiveBeliefs()[0].content).toBe('signal-quality-high');
    expect(engine.getCollectiveBeliefs()[0].corroborations).toBe(2);
  });

  it('blocks constitutional violation reporting for unknown agents', () => {
    const engine = new SwarmIntelligenceEngine(SwarmTier.Standard);

    expect(engine.reportConstitutionalViolation('missing-agent', 'rule-1', 'bad behavior')).toBe(false);
    expect(engine.getEnforcementSummary().constitutionalViolations).toBe(0);
    expect(engine.getEnforcementLog()).toHaveLength(0);
  });

  it('validates contribution proof agent and value', () => {
    const engine = new SwarmIntelligenceEngine(SwarmTier.Standard);

    expect(() => engine.recordContributionProof('missing-agent', 'proof-of-contribution', 10)).toThrow('Unknown agent');
    expect(() => engine.recordContributionProof(knownAgentId, 'proof-of-contribution', 0)).toThrow('positive');
    expect(() => engine.recordContributionProof(knownAgentId, 'proof-of-contribution', Number.POSITIVE_INFINITY)).toThrow('finite');

    const proof = engine.recordContributionProof(knownAgentId, 'proof-of-reliability', 5, 'task-42');
    expect(proof.agentId).toBe(knownAgentId);
    expect(engine.getContributionProofs()).toHaveLength(1);
  });

  it('prevents neutralized agents from propagating beliefs', () => {
    const engine = new SwarmIntelligenceEngine(SwarmTier.Standard);

    expect(engine.rootOwnerNeutralize(knownAgentId, 'manual override')).toBe(true);
    expect(engine.getAgentEnforcementStatus(knownAgentId)).toBe(AgentEnforcementStatus.Neutralized);
    expect(engine.propagateBelief(knownAgentId, SwarmDomain.Governance, 'should-not-write', 0.9)).toBeNull();
    expect(engine.getCollectiveBeliefs()).toHaveLength(0);
  });
});
