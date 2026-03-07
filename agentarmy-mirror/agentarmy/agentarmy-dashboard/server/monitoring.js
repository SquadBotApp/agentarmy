/**
 * Monitoring and Logging System for AgentArmy
 * Tracks routing accuracy, performance metrics, costs, and audit events
 */

const fs = require('node:fs');
const path = require('node:path');

class MonitoringSystem {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.ensureLogDirectory();

    this.metrics = {
      llmCalls: [],
      toolSelections: [],
      workflowExecutions: [],
      errors: [],
      costs: { total: 0, byProvider: {} },
      latencies: { average: 0, byTool: {} },
    };

    this.auditLog = [];
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  logLLMCall(provider, model, latencyMs, cost, tokensUsed, success = true) {
    const entry = {
      timestamp: new Date().toISOString(),
      provider,
      model,
      latencyMs,
      cost,
      tokensUsed,
      success,
    };

    this.metrics.llmCalls.push(entry);
    this.metrics.costs.total += cost;

    if (!this.metrics.costs.byProvider[provider]) {
      this.metrics.costs.byProvider[provider] = 0;
    }
    this.metrics.costs.byProvider[provider] += cost;

    this.persistLog('llm_calls.jsonl', entry);
  }

  logToolSelection(query, selectedToolId, candidates, confidence, routingMethod = 'hybrid') {
    const entry = {
      timestamp: new Date().toISOString(),
      query,
      selectedToolId,
      candidatesCount: candidates.length,
      confidence,
      routingMethod,
    };

    this.metrics.toolSelections.push(entry);
    this.persistLog('tool_selections.jsonl', entry);
  }

  logWorkflowExecution(workflowName, input, output, latencyMs, success = true, error = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      workflow: workflowName,
      inputLength: input.length,
      outputLength: output?.length || 0,
      latencyMs,
      success,
      error: error?.message || null,
    };

    this.metrics.workflowExecutions.push(entry);
    this.persistLog('workflow_executions.jsonl', entry);

    const existing = this.metrics.latencies.byTool[workflowName] || [];
    this.metrics.latencies.byTool[workflowName] = [...existing, latencyMs];
  }

  logError(errorType, message, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      errorType,
      message,
      context,
      stack: new Error('Logged error capture').stack,
    };

    this.metrics.errors.push(entry);
    this.persistLog('errors.jsonl', entry);

    console.error(`[ERROR] ${errorType}: ${message}`, context);
  }

  logAudit(eventType, user, action, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      eventType,
      user,
      action,
      details,
    };

    this.auditLog.push(entry);
    this.persistLog('audit.jsonl', entry);
  }

  persistLog(filename, entry) {
    const filepath = path.join(this.logDir, filename);
    const line = JSON.stringify(entry);
    fs.appendFileSync(filepath, line + '\n', 'utf8');
  }

  getSummary() {
    const totalLLMCalls = this.metrics.llmCalls.length;
    const successfulCalls = this.metrics.llmCalls.filter((c) => c.success).length;
    const avgLatency =
      this.metrics.llmCalls.length > 0
        ? this.metrics.llmCalls.reduce((sum, c) => sum + c.latencyMs, 0) / this.metrics.llmCalls.length
        : 0;

    const toolSelectionsCount = this.metrics.toolSelections.length;
    const avgConfidence =
      toolSelectionsCount > 0
        ? this.metrics.toolSelections.reduce((sum, t) => sum + t.confidence, 0) / toolSelectionsCount
        : 0;

    const workflowsCount = this.metrics.workflowExecutions.length;
    const successfulWorkflows = this.metrics.workflowExecutions.filter((w) => w.success).length;

    return {
      summary: {
        totalLLMCalls,
        successfulCalls,
        successRate: totalLLMCalls > 0 ? ((successfulCalls / totalLLMCalls) * 100).toFixed(2) + '%' : 'N/A',
        avgLatencyMs: avgLatency.toFixed(2),
        totalCost: this.metrics.costs.total.toFixed(4),
        costByProvider: this.metrics.costs.byProvider,
      },
      toolSelection: {
        totalSelections: toolSelectionsCount,
        avgConfidence: avgConfidence.toFixed(2),
      },
      workflows: {
        total: workflowsCount,
        successful: successfulWorkflows,
        successRate: workflowsCount > 0 ? ((successfulWorkflows / workflowsCount) * 100).toFixed(2) + '%' : 'N/A',
      },
      errors: this.metrics.errors.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  generateOptimizationReport() {
    const summary = this.getSummary();

    const latenciesByTool = this.metrics.latencies.byTool;
    const slowestTools = Object.entries(latenciesByTool)
      .map(([tool, latencies]) => ({
        tool,
        avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      }))
      .sort((a, b) => b.avgLatency - a.avgLatency)
      .slice(0, 3);

    const costByProvider = this.metrics.costs.byProvider;
    const mostExpensiveProvider = Object.entries(costByProvider)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1)[0];

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      bottlenecks: {
        slowestTools,
        mostExpensiveProvider: mostExpensiveProvider ? mostExpensiveProvider[0] : 'N/A',
      },
      recommendations: [],
    };

    const successRate = Number.parseFloat(summary.summary.successRate) || 0;
    const avgLatency = Number.parseFloat(summary.summary.avgLatencyMs) || 0;

    if (successRate < 95) {
      report.recommendations.push('Improve error handling: success rate below 95%');
    }
    if (avgLatency > 2000) {
      report.recommendations.push('Optimize routing latency: average above 2000ms');
    }
    if (slowestTools.length > 0 && slowestTools[0].avgLatency > 5000) {
      report.recommendations.push(`Optimize ${slowestTools[0].tool}: expected latency > 5s`);
    }

    return report;
  }

  exportMetrics(filename = 'metrics_export.json') {
    const filepath = path.join(this.logDir, filename);
    const data = {
      exportedAt: new Date().toISOString(),
      summary: this.getSummary(),
      fullMetrics: this.metrics,
    };
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    return filepath;
  }

  getRecentEvents(limit = 50) {
    return {
      llmCalls: this.metrics.llmCalls.slice(-limit),
      toolSelections: this.metrics.toolSelections.slice(-limit),
      errors: this.metrics.errors.slice(-limit),
    };
  }
}

module.exports = MonitoringSystem;
