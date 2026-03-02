// tracing.js - initialize OpenTelemetry for Node.js server
// This file should be imported before other modules (e.g., in index.js)

const process = require('node:process');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { BatchSpanProcessor, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const api = require('@opentelemetry/api');

// only enable if OTLP endpoint is reachable
const enableTracing = process.env.ENABLE_TRACING === 'true' || process.env.NODE_ENV === 'development';

let tracer = null;

if (enableTracing) {
  const provider = new NodeTracerProvider();
  const exporter = new OTLPTraceExporter({
    url: process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  });
  // NodeTracerProvider no longer exposes addSpanProcessor publicly; tack the span
  // processor onto the private field so it will be used when registering.
  provider._activeSpanProcessor = new BatchSpanProcessor(exporter);
  provider.register();

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
  });

  tracer = api.trace.getTracer('agentarmy.server', '1.0.0');
  console.log('[Tracing] OTLP exporter configured to', exporter.url);
} else {
  console.log('[Tracing] disabled (set ENABLE_TRACING=true)');
}

/**
 * Check if tracing is enabled
 * @returns {boolean}
 */
function isTracingEnabled() {
  return enableTracing && tracer !== null;
}

/**
 * Create a custom span for a given operation
 * @param {string} name - Span name
 * @param {Object} attributes - Key-value attributes
 * @param {Function} fn - Async function to execute within the span
 * @returns {Promise<any>} - Result of the function
 */
async function withSpan(name, attributes, fn) {
  if (arguments.length === 2) {
    fn = attributes;
    attributes = {};
  }
  if (!tracer) {
    return fn({ setAttribute: () => {}, addEvent: () => {} });
  }
  
  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Set initial attributes
      Object.entries(attributes).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          span.setAttribute(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
      });
      
      const result = await fn(span);
      span.setStatus({ code: api.SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Create a span for LLM/AI model calls
 * @param {string} provider - Provider name (openai, anthropic, etc.)
 * @param {string} model - Model name
 * @param {Array} messages - Input messages
 * @param {Function} fn - Async function to execute
 * @returns {Promise<any>}
 */
async function withLLMSpan(provider, model, messages, fn) {
  const promptTokens = messages.reduce((acc, m) => acc + (m.content?.length || 0) / 4, 0);
  
  return withSpan('gen_ai.chat', {
    'gen_ai.system': provider,
    'gen_ai.request.model': model,
    'gen_ai.usage.prompt_tokens': Math.ceil(promptTokens),
  }, async (span) => {
    const result = await fn(span);
    
    // Add completion metrics
    if (result?.content) {
      span.setAttribute('gen_ai.usage.completion_tokens', Math.ceil(result.content.length / 4));
    }
    
    return result;
  });
}

/**
 * Create a span for router operations
 * @param {string} operation - Operation name (route, fallback, etc.)
 * @param {Object} attrs - Additional attributes
 * @param {Function} fn - Async function to execute
 * @returns {Promise<any>}
 */
async function withRouterSpan(operation, attrs, fn) {
  if (arguments.length === 2) {
    fn = attrs;
    attrs = {};
  }
  return withSpan(`router.${operation}`, {
    'router.operation': operation,
    ...attrs,
  }, fn);
}

/**
 * Create a span for tool selection
 * @param {string} toolName - Selected tool name
 * @param {number} confidence - Selection confidence score
 * @param {Function} fn - Async function to execute
 * @returns {Promise<any>}
 */
async function withToolSpan(toolName, confidence, fn) {
  return withSpan('tool.select', {
    'tool.name': toolName,
    'tool.confidence': confidence,
  }, fn);
}

module.exports = {
  isTracingEnabled,
  withSpan,
  withLLMSpan,
  withRouterSpan,
  withToolSpan,
};
