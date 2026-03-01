/**
 * Orchestration Adapter
 * Node.js client for calling the Python orchestration service (CrewAI)
 * Handles Job submission, polling, and result retrieval
 */

// axios is imported lazily to avoid ESM parsing issues in Jest
const ORCHESTRATION_SERVICE_URL = process.env.ORCHESTRATION_SERVICE_URL || 'http://localhost:5000';

function makeAxios(token) {
  // require inside function so tests can stub client without loading axios
  const a = require('axios');
  const instance = (a.default || a).create({
    baseURL: ORCHESTRATION_SERVICE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
  return instance;
}

class OrchestrationClient {
  constructor(token) {
    this.token = token;
    this.client = makeAxios(token);
  }

  /**
   * Submit a task for orchestration
   * Returns immediately with job ID for polling
   */
  async submitTask(taskOrPayload, options = {}) {
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
      };
    }

    try {
      const response = await this.client.post('/orchestrate', payload);
      return response.data;
    } catch (err) {
      console.error('[OrchestrationClient] Submit failed:', err.message);
      throw err;
    }
  }

  /**
   * Poll job status
   */
  async getJobStatus(jobId) {
    try {
      const response = await this.client.get(`/jobs/${jobId}`);
      return response.data;
    } catch (err) {
      console.error('[OrchestrationClient] Get status failed:', err.message);
      throw err;
    }
  }

  /**
   * List all jobs (with optional filter)
   */
  async listJobs(status = null) {
    try {
      const url = status ? `/jobs?status=${status}` : '/jobs';
      const response = await this.client.get(url);
      return response.data;
    } catch (err) {
      console.error('[OrchestrationClient] List failed:', err.message);
      throw err;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (err) {
      console.error('[OrchestrationClient] Health check failed:', err.message);
      return { status: 'unhealthy', error: err.message };
    }
  }

  /**
   * Poll job until completion (with timeout)
   */
  async waitForCompletion(jobId, maxWaitMs = 300000, pollIntervalMs = 2000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      const job = await this.getJobStatus(jobId);
      
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
