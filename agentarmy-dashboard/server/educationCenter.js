const crypto = require('node:crypto');

const EDUCATION_STATE_KEY = 'education_center_v1';

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function normalizeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function ageBand(age) {
  if (age <= 0) return 'unknown';
  if (age < 13) return 'child';
  if (age < 18) return 'teen';
  return 'adult';
}

function topicSafety(topic = '') {
  const lower = normalizeText(topic).toLowerCase();
  const restricted = ['exploit', 'malware', 'weapon', 'self-harm', 'fraud', 'illegal'];
  const mature = ['violence', 'sexual', 'substance', 'gambling'];
  if (restricted.some((k) => lower.includes(k))) return { level: 'blocked', reason: 'restricted topic' };
  if (mature.some((k) => lower.includes(k))) return { level: 'mature', reason: 'mature topic' };
  return { level: 'safe', reason: 'no restrictions' };
}

function loadState(db) {
  return db.config.get(EDUCATION_STATE_KEY) || {
    version: '1.0.0',
    learners: {},
    sessions: [],
    reward_ledger: [],
    updated_at: nowIso(),
  };
}

function saveState(db, state) {
  db.config.set(EDUCATION_STATE_KEY, {
    ...state,
    updated_at: nowIso(),
  });
}

function getOrCreateLearner(state, profile, actor = 'unknown') {
  const learnerId = normalizeText(profile?.learner_id, actor);
  const existing = state.learners[learnerId];
  if (existing) return existing;
  const created = {
    learner_id: learnerId,
    age: normalizeNumber(profile?.age, 18),
    age_band: ageBand(normalizeNumber(profile?.age, 18)),
    mode: normalizeText(profile?.mode, 'general'),
    level: normalizeText(profile?.level, 'beginner'),
    style: normalizeText(profile?.style, 'mixed'),
    mastery_by_topic: {},
    completed_sessions: 0,
    qubitcoin_balance: 0,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  state.learners[learnerId] = created;
  return created;
}

function buildLearningPath(topic, level = 'beginner') {
  const base = normalizeText(topic, 'general literacy');
  const lvl = normalizeText(level, 'beginner').toLowerCase();
  const first = `Foundations of ${base}`;
  const second = lvl === 'advanced' ? `Applied systems in ${base}` : `Guided practice in ${base}`;
  const third = lvl === 'advanced' ? `Research-grade synthesis for ${base}` : `Capstone for ${base}`;
  return [
    { step_id: 's1', title: first, agent: 'CurriculumAgent', difficulty: 'baseline' },
    { step_id: 's2', title: second, agent: 'KnowledgeAgent', difficulty: lvl === 'advanced' ? 'high' : 'medium' },
    { step_id: 's3', title: third, agent: 'AssessmentAgent', difficulty: lvl === 'advanced' ? 'high' : 'medium' },
  ];
}

function buildLessonCard(session, learner) {
  const modality = learner.style === 'visual' ? 'diagram + examples' : learner.style === 'audio' ? 'spoken walkthrough' : 'mixed text + practice';
  return {
    lesson_id: `lesson-${crypto.randomUUID()}`,
    topic: session.topic,
    explanation: `KnowledgeAgent explains ${session.topic} for ${learner.level} learners using ${modality}.`,
    simulation_prompt: `SimulationAgent: build a sandbox scenario for ${session.topic} with progressive hints.`,
    assessment_prompt: `AssessmentAgent: produce 5 checks focused on ${session.topic} mastery gaps.`,
    generated_at: nowIso(),
  };
}

function startSession(db, payload = {}, actor = 'unknown', options = {}) {
  const state = loadState(db);
  const role = normalizeText(options?.role, 'user');
  const requestedLearnerId = normalizeText(payload?.learner?.learner_id);
  if (role !== 'admin' && requestedLearnerId && requestedLearnerId !== actor) {
    return {
      status: 'blocked',
      message: 'learner scope violation',
    };
  }
  const learnerProfile = {
    ...(payload.learner || {}),
    learner_id: role === 'admin' ? (requestedLearnerId || actor) : actor,
  };
  const learner = getOrCreateLearner(state, learnerProfile, actor);
  const topic = normalizeText(payload.topic, 'general problem solving');
  const safety = topicSafety(topic);

  if (safety.level === 'blocked') {
    return {
      status: 'blocked',
      safety,
      learner,
      message: 'Topic blocked by EducationCenter safety policy.',
    };
  }

  if ((learner.age_band === 'child' || learner.age_band === 'teen') && safety.level === 'mature') {
    return {
      status: 'pending_approval',
      safety,
      learner,
      message: 'Mature topic requires parent/teacher approval.',
    };
  }

  const path = buildLearningPath(topic, learner.level);
  const session = {
    session_id: `edu-${crypto.randomUUID()}`,
    learner_id: learner.learner_id,
    topic,
    goal: normalizeText(payload.goal, `Build usable skill in ${topic}`),
    mode: learner.mode,
    status: 'active',
    path,
    progress_index: 0,
    mastery_estimate: normalizeNumber(learner.mastery_by_topic[topic], 0),
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  const lesson = buildLessonCard(session, learner);
  state.sessions = [session, ...state.sessions].slice(0, 500);
  learner.updated_at = nowIso();
  saveState(db, state);

  return {
    status: 'active',
    safety,
    session,
    lesson,
    hooks: {
      defensive: ['age_filter', 'content_sensitivity', 'safe_mode'],
      governance: ['parent_teacher_approval', 'policy_override_controls'],
      economic: ['qubitcoin_rewards', 'streak_bonus'],
      swarm: ['multi_agent_teaching_team'],
    },
    team: ['KnowledgeAgent', 'CurriculumAgent', 'AssessmentAgent', 'SimulationAgent', 'LearningStyleAgent', 'ProgressAgent', 'SafetyAgent'],
  };
}

function submitAssessment(db, payload = {}, actor = 'unknown', options = {}) {
  const state = loadState(db);
  const role = normalizeText(options?.role, 'user');
  const sessionId = normalizeText(payload.session_id);
  const score = Math.max(0, Math.min(100, normalizeNumber(payload.score, 0)));
  const session = state.sessions.find((s) => s.session_id === sessionId);
  if (!session) throw new Error('session not found');
  if (role !== 'admin' && session.learner_id !== actor) {
    throw new Error('forbidden session access');
  }

  const learner = state.learners[session.learner_id] || getOrCreateLearner(state, { learner_id: session.learner_id }, actor);
  const priorMastery = normalizeNumber(learner.mastery_by_topic[session.topic], 0);
  const delta = Math.round((score / 100) * 20);
  const nextMastery = Math.max(0, Math.min(100, priorMastery + delta));
  learner.mastery_by_topic[session.topic] = nextMastery;
  learner.completed_sessions += score >= 60 ? 1 : 0;

  const reward = score >= 60 ? 10 + Math.round(score / 10) : 0;
  learner.qubitcoin_balance += reward;
  learner.updated_at = nowIso();

  session.mastery_estimate = nextMastery;
  session.progress_index = Math.min(session.path.length, session.progress_index + 1);
  session.status = session.progress_index >= session.path.length ? 'completed' : 'active';
  session.updated_at = nowIso();

  state.reward_ledger = [
    {
      id: `rew-${crypto.randomUUID()}`,
      learner_id: learner.learner_id,
      session_id: session.session_id,
      amount: reward,
      reason: reward > 0 ? 'assessment_mastery' : 'no_reward',
      issued_at: nowIso(),
    },
    ...state.reward_ledger,
  ].slice(0, 1000);

  saveState(db, state);

  return {
    status: 'recorded',
    learner_id: learner.learner_id,
    session_id: session.session_id,
    score,
    mastery_before: priorMastery,
    mastery_after: nextMastery,
    reward_issued: reward,
    session_status: session.status,
    next_step: session.path[session.progress_index] || null,
  };
}

function buildSimulation(payload = {}) {
  const topic = normalizeText(payload.topic, 'general problem solving');
  const level = normalizeText(payload.level, 'beginner');
  return {
    simulation_id: `sim-${crypto.randomUUID()}`,
    topic,
    level,
    scenario: `SimulationAgent scenario: learner navigates a live case on ${topic} at ${level} complexity.`,
    objectives: [
      `Apply core concept of ${topic}`,
      'Make one decision under constraints',
      'Reflect and revise strategy',
    ],
    generated_at: nowIso(),
  };
}

function getStateView(db, options = {}) {
  const state = loadState(db);
  const role = normalizeText(options?.viewerRole, 'user');
  const viewerId = normalizeText(options?.viewerId, 'unknown');
  const allLearners = Object.values(state.learners || {});
  const allSessions = Array.isArray(state.sessions) ? state.sessions : [];
  const allRewards = Array.isArray(state.reward_ledger) ? state.reward_ledger : [];
  const learners = role === 'admin'
    ? allLearners
    : allLearners.filter((l) => normalizeText(l.learner_id) === viewerId);
  const sessions = role === 'admin'
    ? allSessions
    : allSessions.filter((s) => normalizeText(s.learner_id) === viewerId);
  const rewards = role === 'admin'
    ? allRewards
    : allRewards.filter((r) => normalizeText(r.learner_id) === viewerId);
  const active = sessions.filter((s) => s.status === 'active').length;
  const completed = sessions.filter((s) => s.status === 'completed').length;
  return {
    generated_at: nowIso(),
    domain: 'EducationCenter',
    mission: 'Universal adaptive learning domain',
    summary: {
      learners_total: learners.length,
      sessions_total: sessions.length,
      sessions_active: active,
      sessions_completed: completed,
      qubitcoin_issued: rewards.reduce((sum, r) => sum + normalizeNumber(r.amount, 0), 0),
    },
    policies: {
      age_policies: ['child', 'teen', 'adult'],
      safety_policy: 'restricted topics blocked, mature topics require approval for minors',
      progress_policy: 'mastery tracked per topic and advanced via assessments',
      reward_policy: 'QubitCoin issued for passing assessments',
    },
    learners: learners.slice(0, 100),
    recent_sessions: sessions.slice(0, 50),
    recent_rewards: rewards.slice(0, 50),
  };
}

module.exports = {
  startSession,
  submitAssessment,
  buildSimulation,
  getStateView,
  topicSafety,
  ageBand,
};
