/**
 * Orchestration Adapter
 * Node.js client for calling the Python orchestration service (CrewAI)
 * Handles Job submission, polling, and result retrieval
 */

// axios is imported lazily to avoid ESM parsing issues in Jest
const ORCHESTRATION_SERVICE_URL = process.env.ORCHESTRATION_SERVICE_URL || 'http://localhost:5000';
const ORCHESTRATION_SERVICE_FALLBACK_URLS = (process.env.ORCHESTRATION_SERVICE_FALLBACK_URLS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

function unique(values) {
  return [...new Set(values)];
}

function normalizeBaseUrls(baseUrls) {
  const urls = Array.isArray(baseUrls) && baseUrls.length > 0
    ? baseUrls
    : [ORCHESTRATION_SERVICE_URL, ...ORCHESTRATION_SERVICE_FALLBACK_URLS];
  return unique(urls.map((v) => String(v || '').trim()).filter(Boolean));
}

function makeAxios(token, baseURL) {
  // require inside function so tests can stub client without loading axios
  const a = require('axios');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return (a.default || a).create({
    baseURL,
    headers,
    timeout: 30000,
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertSubmitPayload(payload) {
  if (!isObject(payload)) throw new Error('submit payload must be an object');

  if (typeof payload.task === 'string') {
    return;
  }

  if (!isObject(payload.job)) {
    throw new Error('advanced payload must include job object');
  }

  if (payload.job.goal != null && typeof payload.job.goal !== 'string') {
    throw new Error('job.goal must be a string');
  }
}

function assertHasObject(data, contextLabel = 'request') {
  if (!isObject(data)) {
    throw new Error(`${contextLabel} returned invalid response shape`);
  }
}

function assertJobStatus(data) {
  assertHasObject(data, 'job status');
  if (typeof data.status !== 'string') {
    throw new Error('job status response missing status field');
  }
}

function assertEfficiencyPlan(data) {
  assertHasObject(data, 'efficiency plan');
  if (typeof data.recommended_framework !== 'string') {
    throw new Error('efficiency plan missing recommended_framework');
  }
}

function assertSocialIntel(data) {
  assertHasObject(data, 'social intel');
  if (!Array.isArray(data.profiles)) {
    throw new Error('social intel missing profiles array');
  }
  if (!isObject(data.credibility_summary)) {
    throw new Error('social intel missing credibility_summary object');
  }
}

function assertSshPlan(data) {
  assertHasObject(data, 'ssh plan');
  if (!Array.isArray(data.profiles)) {
    throw new Error('ssh plan missing profiles array');
  }
  if (!isObject(data.summary)) {
    throw new Error('ssh plan missing summary object');
  }
}

function assertCommsBroadcast(data) {
  assertHasObject(data, 'comms broadcast');
  if (!Array.isArray(data.targets)) {
    throw new Error('comms broadcast missing targets array');
  }
  if (!isObject(data.results)) {
    throw new Error('comms broadcast missing results object');
  }
}

function isRetryableError(err) {
  const status = err?.response?.status;
  if (status == null) return true;
  return [408, 425, 429, 500, 502, 503, 504].includes(status);
}

class OrchestrationClient {
  constructor(token, options = {}) {
    this.token = token;
    this.baseUrls = normalizeBaseUrls(options.baseUrls);
    this.retryAttempts = Number.isFinite(options.retryAttempts) ? options.retryAttempts : 2;
    this.baseRetryDelayMs = Number.isFinite(options.baseRetryDelayMs) ? options.baseRetryDelayMs : 250;
    this.clients = this.baseUrls.map((url) => makeAxios(token, url));
    this.client = this.clients[0];
    this.connectorHealth = {};
    this.baseUrls.forEach((url) => {
      this.connectorHealth[url] = {
        healthy: true,
        success_count: 0,
        failure_count: 0,
        last_error: null,
        last_checked_at: null,
      };
    });
  }

  _recordConnectorSuccess(baseUrl) {
    const target = this.connectorHealth[baseUrl];
    if (!target) return;
    target.healthy = true;
    target.success_count += 1;
    target.last_error = null;
    target.last_checked_at = new Date().toISOString();
  }

  _recordConnectorFailure(baseUrl, err) {
    const target = this.connectorHealth[baseUrl];
    if (!target) return;
    target.healthy = false;
    target.failure_count += 1;
    target.last_error = err?.message || String(err);
    target.last_checked_at = new Date().toISOString();
  }

  async _requestWithResilience(request, validateResponse) {
    const failures = [];

    for (let clientIndex = 0; clientIndex < this.clients.length; clientIndex += 1) {
      const client = this.clients[clientIndex];
      const baseUrl = this.baseUrls[clientIndex];

      for (let attempt = 0; attempt <= this.retryAttempts; attempt += 1) {
        try {
          const response = await request(client);
          const data = response?.data;
          if (validateResponse) validateResponse(data);
          this._recordConnectorSuccess(baseUrl);
          return data;
        } catch (err) {
          this._recordConnectorFailure(baseUrl, err);
          failures.push({ baseUrl, attempt: attempt + 1, message: err?.message || String(err) });

          if (!isRetryableError(err)) {
            throw err;
          }

          const isLastAttemptForConnector = attempt >= this.retryAttempts;
          if (!isLastAttemptForConnector) {
            const delayMs = this.baseRetryDelayMs * (2 ** attempt);
            await wait(delayMs);
          }
        }
      }
    }

    const details = failures.map((f) => `${f.baseUrl}#${f.attempt}: ${f.message}`).join(' | ');
    const err = new Error(`orchestration request failed after retries/failover: ${details}`);
    err.failures = failures;
    throw err;
  }

  /**
   * Submit a task for orchestration
   * Returns immediately with job ID for polling
   */
  async submitTask(taskOrPayload, options = {}) {
    if (taskOrPayload == null) {
      throw new Error('submitTask requires task or payload');
    }

    // taskOrPayload may be a simple string (legacy) or a full orchestrator payload object
    let payload;
    if (typeof taskOrPayload === 'object' && taskOrPayload !== null && taskOrPayload.job) {
      // assume caller constructed the advanced payload already
      payload = taskOrPayload;
    } else {
      // legacy form - translate into minimal orchestrator request
      payload = {
        task: taskOrPayload,
        priority: options.priority || 'normal',
        context: options.context || {},
        model_preferences: options.model_preferences || {},
        integrations: options.integrations || {},
        framework: options.framework || 'native',
      };
    }

    try {
      assertSubmitPayload(payload);
      return await this._requestWithResilience((client) => client.post('/orchestrate', payload), assertHasObject);
    } catch (err) {
      const message = err?.message || String(err);
      console.error('[OrchestrationClient] Submit failed:', message);
      throw err;
    }
  }

  /**
   * Poll job status
   */
  async getJobStatus(jobId) {
    if (!jobId) throw new Error('getJobStatus requires jobId');
    try {
      return await this._requestWithResilience((client) => client.get(`/jobs/${jobId}`), assertJobStatus);
    } catch (err) {
      const message = err?.message || String(err);
      console.error('[OrchestrationClient] Get status failed:', message);
      throw err;
    }
  }

  /**
   * List all jobs (with optional filter)
   */
  async listJobs(status = null) {
    try {
      const url = status ? `/jobs?status=${encodeURIComponent(status)}` : '/jobs';
      return await this._requestWithResilience((client) => client.get(url), (data) => {
        if (!Array.isArray(data)) {
          throw new Error('list jobs returned invalid response shape');
        }
      });
    } catch (err) {
      const message = err?.message || String(err);
      console.error('[OrchestrationClient] List failed:', message);
      throw err;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const data = await this._requestWithResilience((client) => client.get('/health'), assertHasObject);
      return data;
    } catch (err) {
      const message = err?.message || String(err);
      console.error('[OrchestrationClient] Health check failed:', message);
      return { status: 'unhealthy', error: message, connector_health: this.getConnectorHealth() };
    }
  }

  /**
   * Discover backend orchestration capabilities.
   */
  async getCapabilities() {
    try {
      return await this._requestWithResilience((client) => client.get('/capabilities'), assertHasObject);
    } catch (err) {
      const message = err?.message || String(err);
      console.error('[OrchestrationClient] Capabilities failed:', message);
      throw err;
    }
  }

  /**
   * Build an optimized execution/integration plan from a goal payload.
   */
  async getEfficiencyPlan(payload) {
    try {
      return await this._requestWithResilience((client) => client.post('/efficiency/plan', payload || {}), assertEfficiencyPlan);
    } catch (err) {
      const message = err?.message || String(err);
      console.error('[OrchestrationClient] Efficiency plan failed:', message);
      throw err;
    }
  }

  /**
   * Analyze social intelligence signals with credibility scoring.
   */
  async getSocialIntel(payload) {
    try {
      return await this._requestWithResilience((client) => client.post('/social/intel/analyze', payload || {}), assertSocialIntel);
    } catch (err) {
      const message = err?.message || String(err);
      console.error('[OrchestrationClient] Social intel failed:', message);
      throw err;
    }
  }

  /**
   * Build SSH integration and hardening plan.
   */
  async getSshPlan(payload) {
    try {
      return await this._requestWithResilience((client) => client.post('/ssh/plan', payload || {}), assertSshPlan);
    } catch (err) {
      const message = err?.message || String(err);
      console.error('[OrchestrationClient] SSH plan failed:', message);
      throw err;
    }
  }

  /**
   * Broadcast one message to configured comms channels (e.g. 3CX/Claude/Copilot).
   */
  async broadcastComms(payload) {
    try {
      return await this._requestWithResilience((client) => client.post('/comms/broadcast', payload || {}), assertCommsBroadcast);
    } catch (err) {
      const message = err?.message || String(err);
      console.error('[OrchestrationClient] Comms broadcast failed:', message);
      throw err;
    }
  }

  getConnectorHealth() {
    return {
      base_urls: this.baseUrls,
      connectors: this.baseUrls.map((baseUrl) => ({
        base_url: baseUrl,
        ...(this.connectorHealth[baseUrl] || {}),
      })),
    };
  }

  /**
   * Poll job until completion (with timeout)
   */
  async waitForCompletion(jobId, maxWaitMs = 300000, pollIntervalMs = 2000) {
    if (!jobId) throw new Error('waitForCompletion requires jobId');
    if (!Number.isFinite(maxWaitMs) || maxWaitMs <= 0) throw new Error('maxWaitMs must be a positive finite number');
    if (!Number.isFinite(pollIntervalMs) || pollIntervalMs <= 0) throw new Error('pollIntervalMs must be a positive finite number');

    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      const job = await this.getJobStatus(jobId);
      
      if (!job || !job.status) {
        throw new Error(`Job ${jobId} returned invalid status payload`);
      }

      if (job.status === 'completed' || job.status === 'failed') {
        return job;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    
    throw new Error(`Job ${jobId} did not complete within ${maxWaitMs}ms`);
  }
}

// Singleton instance factory
let clientInstance = null;

function getOrchestrationClient(token) {
  if (!clientInstance || clientInstance.token !== token) {
    clientInstance = new OrchestrationClient(token);
  }
  return clientInstance;
}

module.exports = {
  OrchestrationClient,
  getOrchestrationClient,
};
