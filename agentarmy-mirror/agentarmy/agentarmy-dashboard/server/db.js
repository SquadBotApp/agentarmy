/**
 * SQLite Persistence Layer for AgentArmy
 * Stores jobs, tasks, decisions, agent performance, and learned config
 */

const Database = require('better-sqlite3');
const path = require('node:path');
const crypto = require('node:crypto');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'agentarmy.db');

// Ensure data directory exists
const fs = require('node:fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Better concurrency

const SENSITIVE_KEY_RE = /(password|passphrase|secret|token|apikey|api_key|authorization|cookie|private.?key|ssh_key)/i;
const MAX_KERNEL_EVENT_ROWS = Number.parseInt(process.env.KERNEL_EVENT_MAX_ROWS || '5000', 10);
const KERNEL_EVENT_RETENTION_DAYS = Number.parseInt(process.env.KERNEL_EVENT_RETENTION_DAYS || '30', 10);

function redactForAudit(value, key = '', depth = 0) {
  if (depth > 6) return '[TRUNCATED_DEPTH]';
  if (SENSITIVE_KEY_RE.test(String(key || ''))) return '[REDACTED]';

  if (value == null) return value;
  if (typeof value === 'string') {
    if (/^bearer\s+[a-z0-9\-._~+/]+=*$/i.test(value) || value.length > 4096) {
      return '[REDACTED]';
    }
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redactForAudit(item, key, depth + 1));
  }
  if (typeof value === 'object') {
    const out = {};
    const entries = Object.entries(value).slice(0, 100);
    for (const [k, v] of entries) {
      out[k] = redactForAudit(v, k, depth + 1);
    }
    return out;
  }
  return String(value);
}

function pruneKernelEvents() {
  if (Number.isFinite(MAX_KERNEL_EVENT_ROWS) && MAX_KERNEL_EVENT_ROWS > 0) {
    db.prepare(`
      DELETE FROM kernel_events
      WHERE id NOT IN (
        SELECT id
        FROM kernel_events
        ORDER BY id DESC
        LIMIT ?
      )
    `).run(MAX_KERNEL_EVENT_ROWS);
  }
  if (Number.isFinite(KERNEL_EVENT_RETENTION_DAYS) && KERNEL_EVENT_RETENTION_DAYS > 0) {
    db.prepare(`
      DELETE FROM kernel_events
      WHERE julianday(created_at) < julianday('now') - ?
    `).run(KERNEL_EVENT_RETENTION_DAYS);
  }
}

// ============================================
// Schema Migrations
// ============================================

function initSchema() {
  db.exec(`
    -- Jobs: each orchestration run
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      workspace_id TEXT,
      goal TEXT NOT NULL,
      constraints TEXT, -- JSON
      risk_tolerance REAL DEFAULT 0.5,
      status TEXT DEFAULT 'pending', -- pending, running, completed, failed
      started_at TEXT,
      finished_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Tasks: the task graph for each job
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      duration REAL,
      depends_on TEXT, -- JSON array
      status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
      assigned_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    -- Decisions: every orchestrator step
    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL,
      task_id TEXT,
      agent_id TEXT NOT NULL,
      zpe_total REAL,
      zpe_components TEXT, -- JSON
      is_critical INTEGER DEFAULT 0,
      rationale TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    -- Agent Performance: outcome metrics per agent
    CREATE TABLE IF NOT EXISTS agent_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      task_id TEXT,
      success INTEGER NOT NULL, -- 1 = success, 0 = failure
      latency_ms REAL,
      cost_estimate REAL,
      zpe_at_decision REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    -- Config: evolving weights and learned parameters
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL, -- JSON
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Profile store: persisted operational profiles/templates
    CREATE TABLE IF NOT EXISTS profile_store (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL, -- social|ssh|comms
      name TEXT NOT NULL,
      data TEXT NOT NULL, -- JSON payload
      created_by TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(kind, name)
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_job_id ON tasks(job_id);
    CREATE INDEX IF NOT EXISTS idx_decisions_job_id ON decisions(job_id);
    CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_id ON agent_performance(agent_id);
    CREATE INDEX IF NOT EXISTS idx_profile_store_kind ON profile_store(kind);

    -- Kernel event chain: audit trail for policy decisions and command execution
    CREATE TABLE IF NOT EXISTS kernel_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL, -- policy_decision|command_execute
      action TEXT NOT NULL,
      actor TEXT,
      payload TEXT, -- JSON
      decision TEXT, -- JSON
      prev_hash TEXT,
      event_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_kernel_events_created_at ON kernel_events(created_at DESC);
  `);

  // Initialize default config if not exists
  const existingWeights = db.prepare('SELECT key FROM config WHERE key = ?').get('agent_weights');
  if (!existingWeights) {
    db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run(
      'agent_weights',
      JSON.stringify({})
    );
  }

  const existingZpeWeights = db.prepare('SELECT key FROM config WHERE key = ?').get('zpe_weights');
  if (!existingZpeWeights) {
    db.prepare('INSERT INTO config (key, value) VALUES (?, ?)').run(
      'zpe_weights',
      JSON.stringify({
        usefulness: 0.3,
        coherence: 0.2,
        cost: 0.2,
        risk: 0.15,
        alignment: 0.15,
      })
    );
  }

  console.log('[DB] Schema initialized at', DB_PATH);
}

// ============================================
// Job Operations
// ============================================

const jobOps = {
  create(job) {
    const stmt = db.prepare(`
      INSERT INTO jobs (id, workspace_id, goal, constraints, risk_tolerance, status, started_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    stmt.run(
      job.id,
      job.workspaceId || null,
      job.goal,
      job.constraints ? JSON.stringify(job.constraints) : null,
      job.riskTolerance || 0.5,
      'running',
      now,
      now
    );
    return job.id;
  },

  update(jobId, updates) {
    const fields = [];
    const values = [];
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.finishedAt !== undefined) {
      fields.push('finished_at = ?');
      values.push(updates.finishedAt);
    }
    if (fields.length === 0) return;
    values.push(jobId);
    db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  get(jobId) {
    return db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  },

  list(status = null) {
    if (status) {
      return db.prepare('SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC').all(status);
    }
    return db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all();
  },
};

// ============================================
// Task Operations
// ============================================

const taskOps = {
  create(task) {
    const stmt = db.prepare(`
      INSERT INTO tasks (id, job_id, name, description, duration, depends_on, status, assigned_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    stmt.run(
      task.id,
      task.jobId,
      task.name,
      task.description || null,
      task.duration || null,
      task.dependsOn ? JSON.stringify(task.dependsOn) : '[]',
      task.status || 'pending',
      task.assignedAgent || null,
      now
    );
    return task.id;
  },

  createBatch(tasks) {
    const stmt = db.prepare(`
      INSERT INTO tasks (id, job_id, name, description, duration, depends_on, status, assigned_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    const insertMany = db.transaction((items) => {
      for (const task of items) {
        stmt.run(
          task.id,
          task.jobId,
          task.name,
          task.description || null,
          task.duration || null,
          task.dependsOn ? JSON.stringify(task.dependsOn) : '[]',
          task.status || 'pending',
          task.assignedAgent || null,
          now
        );
      }
    });
    insertMany(tasks);
  },

  update(taskId, updates) {
    const fields = ['updated_at = ?'];
    const values = [new Date().toISOString()];
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.assignedAgent !== undefined) {
      fields.push('assigned_agent = ?');
      values.push(updates.assignedAgent);
    }
    values.push(taskId);
    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  },

  getByJob(jobId) {
    return db.prepare('SELECT * FROM tasks WHERE job_id = ?').all(jobId);
  },
};

// ============================================
// Decision Operations
// ============================================

const decisionOps = {
  create(decision) {
    const stmt = db.prepare(`
      INSERT INTO decisions (job_id, task_id, agent_id, zpe_total, zpe_components, is_critical, rationale, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      decision.jobId,
      decision.taskId || null,
      decision.agentId,
      decision.zpeTotal || null,
      decision.zpeComponents ? JSON.stringify(decision.zpeComponents) : null,
      decision.isCritical ? 1 : 0,
      decision.rationale || null,
      new Date().toISOString()
    );
    return result.lastInsertRowid;
  },

  getByJob(jobId) {
    return db.prepare('SELECT * FROM decisions WHERE job_id = ? ORDER BY created_at').all(jobId);
  },

  getRecent(limit = 100) {
    return db.prepare('SELECT * FROM decisions ORDER BY created_at DESC LIMIT ?').all(limit);
  },
};

// ============================================
// Agent Performance Operations
// ============================================

const performanceOps = {
  record(perf) {
    const stmt = db.prepare(`
      INSERT INTO agent_performance (agent_id, job_id, task_id, success, latency_ms, cost_estimate, zpe_at_decision, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      perf.agentId,
      perf.jobId,
      perf.taskId || null,
      perf.success ? 1 : 0,
      perf.latencyMs || null,
      perf.costEstimate || null,
      perf.zpeAtDecision || null,
      new Date().toISOString()
    );
    return result.lastInsertRowid;
  },

  getByAgent(agentId) {
    return db.prepare('SELECT * FROM agent_performance WHERE agent_id = ? ORDER BY created_at DESC').all(agentId);
  },

  /**
   * Get aggregated stats per agent for learning loops
   */
  getAgentStats() {
    return db.prepare(`
      SELECT 
        agent_id,
        COUNT(*) as total_runs,
        SUM(success) as successes,
        ROUND(AVG(success) * 100, 2) as success_rate,
        ROUND(AVG(latency_ms), 2) as avg_latency_ms,
        ROUND(AVG(cost_estimate), 4) as avg_cost,
        ROUND(AVG(zpe_at_decision), 4) as avg_zpe
      FROM agent_performance
      GROUP BY agent_id
      ORDER BY success_rate DESC
    `).all();
  },
};

// ============================================
// Config Operations
// ============================================

const configOps = {
  get(key) {
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : null;
  },

  set(key, value) {
    const stmt = db.prepare(`
      INSERT INTO config (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    stmt.run(key, JSON.stringify(value), new Date().toISOString());
  },

  getAgentWeights() {
    return this.get('agent_weights') || {};
  },

  setAgentWeights(weights) {
    this.set('agent_weights', weights);
  },

  getZpeWeights() {
    return this.get('zpe_weights') || {
      usefulness: 0.3,
      coherence: 0.2,
      cost: 0.2,
      risk: 0.15,
      alignment: 0.15,
    };
  },

  setZpeWeights(weights) {
    this.set('zpe_weights', weights);
  },
};

// ============================================
// Profile Store Operations
// ============================================

const profileOps = {
  upsert(kind, name, data, createdBy = null) {
    const stmt = db.prepare(`
      INSERT INTO profile_store (kind, name, data, created_by, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(kind, name) DO UPDATE SET
        data = excluded.data,
        created_by = excluded.created_by,
        updated_at = excluded.updated_at
    `);
    stmt.run(
      kind,
      name,
      JSON.stringify(data || {}),
      createdBy,
      new Date().toISOString()
    );
    return { kind, name };
  },

  list(kind) {
    return db.prepare(`
      SELECT kind, name, data, created_by, updated_at, created_at
      FROM profile_store
      WHERE kind = ?
      ORDER BY name ASC
    `).all(kind).map((row) => ({
      kind: row.kind,
      name: row.name,
      data: row.data ? JSON.parse(row.data) : {},
      created_by: row.created_by,
      updated_at: row.updated_at,
      created_at: row.created_at,
    }));
  },
};

// ============================================
// Kernel Event Operations (hash-chained)
// ============================================

const kernelEventOps = {
  record(event) {
    const now = new Date().toISOString();
    const payloadRedacted = redactForAudit(event.payload || {});
    const decisionRedacted = redactForAudit(event.decision || {});
    const payloadJson = JSON.stringify(payloadRedacted);
    const decisionJson = JSON.stringify(decisionRedacted);
    const last = db.prepare('SELECT event_hash FROM kernel_events ORDER BY id DESC LIMIT 1').get();
    const prevHash = last?.event_hash || '';
    const hashInput = [prevHash, now, event.event_type || '', event.action || '', event.actor || '', payloadJson, decisionJson].join('|');
    const eventHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    const stmt = db.prepare(`
      INSERT INTO kernel_events (event_type, action, actor, payload, decision, prev_hash, event_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      event.event_type || 'policy_decision',
      event.action || 'unknown',
      event.actor || null,
      payloadJson,
      decisionJson,
      prevHash || null,
      eventHash,
      now
    );
    pruneKernelEvents();
    return { id: result.lastInsertRowid, event_hash: eventHash, prev_hash: prevHash || null };
  },

  list(limit = 100) {
    return db.prepare(`
      SELECT id, event_type, action, actor, payload, decision, prev_hash, event_hash, created_at
      FROM kernel_events
      ORDER BY id DESC
      LIMIT ?
    `).all(limit).map((row) => ({
      ...row,
      payload: (() => {
        try {
          return row.payload ? JSON.parse(row.payload) : {};
        } catch {
          return {};
        }
      })(),
      decision: (() => {
        try {
          return row.decision ? JSON.parse(row.decision) : {};
        } catch {
          return {};
        }
      })(),
    }));
  },
};

// ============================================
// Learning Loop: Compute Agent Weights
// ============================================

function computeAgentWeights() {
  const stats = performanceOps.getAgentStats();
  const weights = {};

  for (const agent of stats) {
    if (agent.total_runs < 3) {
      // Not enough data, use neutral weight
      weights[agent.agent_id] = 1;
      continue;
    }

    // Weight formula: success_rate * (1 / (1 + normalized_cost)) * (1 / (1 + normalized_latency))
    const successFactor = agent.success_rate / 100;
    const costFactor = agent.avg_cost ? 1 / (1 + agent.avg_cost / 10) : 1;
    const latencyFactor = agent.avg_latency_ms ? 1 / (1 + agent.avg_latency_ms / 1000) : 1;

    weights[agent.agent_id] = Math.round(successFactor * costFactor * latencyFactor * 100) / 100;
  }

  configOps.setAgentWeights(weights);
  console.log('[Learning] Updated agent weights:', weights);
  return weights;
}

// ============================================
// Export
// ============================================

// Initialize schema on module load
initSchema();

module.exports = {
  db,
  jobs: jobOps,
  tasks: taskOps,
  decisions: decisionOps,
  performance: performanceOps,
  config: configOps,
  profiles: profileOps,
  kernelEvents: kernelEventOps,
  computeAgentWeights,
  _internals: {
    redactForAudit,
  },
};
