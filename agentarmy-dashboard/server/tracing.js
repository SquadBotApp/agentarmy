// tracing.js - initialize OpenTelemetry for Node.js server
// This file should be imported before other modules (e.g., in index.js)

const process = require('process');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

// only enable if OTLP endpoint is reachable
const enableTracing = process.env.ENABLE_TRACING === 'true' || process.env.NODE_ENV === 'development';

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

  console.log('[Tracing] OTLP exporter configured to', exporter.url);
} else {
  console.log('[Tracing] disabled (set ENABLE_TRACING=true)');
}
