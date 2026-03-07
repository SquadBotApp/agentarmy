const crypto = require('node:crypto');

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(v) {
  return String(v || '').trim();
}

function readJsonConfig(db, key, fallback) {
  const value = db.config.get(key);
  if (value == null) return fallback;
  return value;
}

function writeJsonConfig(db, key, value) {
  db.config.set(key, value);
}

function loadMemory(db) {
  return readJsonConfig(db, 'superpower_memory', []);
}

function redact(db, value) {
  const fn = db?._internals?.redactForAudit;
  return typeof fn === 'function' ? fn(value) : value;
}

function appendMemory(db, entry) {
  const existing = loadMemory(db);
  const safeEntry = redact(db, entry);
  const next = [safeEntry, ...existing].slice(0, 500);
  writeJsonConfig(db, 'superpower_memory', next);
  return next;
}

function compileToolGraph(goal) {
  const g = normalizeText(goal).toLowerCase();
  const nodes = [
    { id: 'n1', tool: 'planner', purpose: 'decompose_goal' },
    { id: 'n2', tool: 'executor', purpose: 'implement_changes', depends_on: ['n1'] },
    { id: 'n3', tool: 'test_runner', purpose: 'validate', depends_on: ['n2'] },
    { id: 'n4', tool: 'critic', purpose: 'evaluate_quality', depends_on: ['n3'] },
  ];
  if (g.includes('deploy') || g.includes('release')) {
    nodes.push({ id: 'n5', tool: 'governor', purpose: 'release_gate', depends_on: ['n4'] });
  }
  return {
    graph_id: `graph-${crypto.randomUUID()}`,
    goal,
    nodes,
    strategy: 'deterministic-with-fallback',
    generated_at: nowIso(),
  };
}

function buildPairSuggestion(filePath, intent) {
  const i = normalizeText(intent) || 'improve code quality';
  return {
    file: normalizeText(filePath) || 'unknown',
    intent: i,
    suggested_edits: [
      'Add explicit input validation before core logic.',
      'Extract repeated branches into a pure helper for testability.',
      'Add one regression test for the failure mode.',
    ],
    estimated_impact: {
      risk_reduction: 0.2,
      maintainability_gain: 0.25,
      expected_test_delta: '+1 to +3 tests',
    },
    generated_at: nowIso(),
  };
}

function loadInstalledSkills(db) {
  return readJsonConfig(db, 'superpower_marketplace_skills', []);
}

function installSkill(db, skillId, metadata) {
  const id = normalizeText(skillId);
  if (!id) throw new Error('skill_id is required');
  const current = loadInstalledSkills(db);
  const exists = current.find((s) => s.skill_id === id);
  if (exists) return exists;
  const entry = {
    skill_id: id,
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
    installed_at: nowIso(),
  };
  writeJsonConfig(db, 'superpower_marketplace_skills', [entry, ...current]);
  return entry;
}

function parseDsl(command) {
  const text = normalizeText(command);
  if (!text) throw new Error('dsl command required');
  const lower = text.toLowerCase();
  if (lower.startsWith('ship ')) {
    return {
      intent: 'ship',
      goal: text.slice(5),
      pipeline: ['plan', 'implement', 'test', 'governance_gate', 'release'],
    };
  }
  if (lower.startsWith('harden ')) {
    return {
      intent: 'harden',
      goal: text.slice(7),
      pipeline: ['scan', 'patch', 'test', 'governance_gate'],
    };
  }
  return {
    intent: 'generic',
    goal: text,
    pipeline: ['plan', 'execute', 'test'],
  };
}

function buildControlTower(db) {
  const agentStats = db.performance.getAgentStats();
  const decisions = db.decisions.getRecent(50);
  const jobs = db.jobs.list();
  const skills = loadInstalledSkills(db);
  const memory = loadMemory(db).slice(0, 20).map((item) => redact(db, item));

  const completed = jobs.filter((j) => j.status === 'completed').length;
  const failed = jobs.filter((j) => j.status === 'failed').length;

  return {
    generated_at: nowIso(),
    summary: {
      jobs_total: jobs.length,
      jobs_completed: completed,
      jobs_failed: failed,
      recent_decisions: decisions.length,
      installed_skills: skills.length,
      memory_items: memory.length,
    },
    agent_stats: agentStats,
    installed_skills: redact(db, skills),
    recent_memory: memory,
  };
}

module.exports = {
  compileToolGraph,
  buildPairSuggestion,
  installSkill,
  loadInstalledSkills,
  parseDsl,
  buildControlTower,
  appendMemory,
};
