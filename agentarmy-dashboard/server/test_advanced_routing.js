#!/usr/bin/env node
/**
 * Advanced Tool Selector and Routing Test
 * Demonstrates hybrid routing (semantic + LLM), hierarchical routing, and monitoring
 */

require('dotenv').config();
const RouterAgent = require('./router_agent');
const AdvancedToolSelector = require('./toolSelector');
const toolRegistry = require('./tools');

const router = new RouterAgent();
const selector = new AdvancedToolSelector();

async function testSemanticRouting() {
  console.log('\n=== SEMANTIC ROUTING TEST ===\n');

  const queries = [
    'I need to review the adapters.js file',
    'Update my environment variables for Claude Haiku',
    'Run the aiPlan workflow on this goal',
    'Test the LLM integration',
    'What tools are available?',
  ];

  for (const query of queries) {
    console.log(`\nQuery: "${query}"`);
    try {
      const candidates = selector.semanticFilter(query, 3);
      console.log(`  Candidates: ${candidates.map((t) => t.id).join(', ')}`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
}

async function testLLMRouting() {
  console.log('\n\n=== LLM-BASED ROUTING TEST ===\n');

  const query = 'I need to review adapters.js and then update it with Claude integration';
  console.log(`Query: "${query}"`);

  try {
    const decision = await router.selectTool(query);
    console.log(`Selected Tool: ${decision.tool?.id || 'none'}`);
    console.log(`Reason: ${decision.reason}`);
    console.log(`Latency: ${decision.latencyMs}ms`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

async function testHierarchicalRouting() {
  console.log('\n\n=== HIERARCHICAL ROUTING TEST ===\n');

  const query = 'Create the .env file with API keys';
  console.log(`Query: "${query}"`);

  try {
    const decision = await router.hierarchicalRoute(query);
    console.log(`Selected Tool: ${decision.tool?.id || 'none'}`);
    console.log(`Reason: ${decision.reason}`);
    console.log(`Latency: ${decision.latencyMs}ms`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

function displayToolRegistry() {
  console.log('\n\n=== TOOL REGISTRY ===\n');

  console.log('Available Tools:');
  toolRegistry.tools.forEach((tool) => {
    console.log(`\n  ${tool.id} [${tool.category}]`);
    console.log(`    Description: ${tool.description}`);
    console.log(`    Complexity: ${tool.complexity}, Cost: $${tool.cost}`);
    console.log(`    Keywords: ${tool.keywords.join(', ')}`);
  });
}

function displayToolsByCategory() {
  console.log('\n\n=== TOOLS BY CATEGORY ===\n');

  Object.entries(toolRegistry.toolsByCategory).forEach(([category, tools]) => {
    console.log(`\n${category}:`);
    tools.forEach((tool) => {
      console.log(`  - ${tool.id}`);
    });
  });
}

async function testMonitoring() {
  console.log('\n\n=== MONITORING SYSTEM TEST ===\n');

  const monitor = router.monitor;

  // Simulate some events
  monitor.logLLMCall('anthropic', 'claude-3-haiku', 450, 0.008, 100, true);
  monitor.logLLMCall('openai', 'gpt-4o-mini', 550, 0.015, 150, true);
  monitor.logToolSelection('review adapters', 'review_files', [], 0.92);
  monitor.logWorkflowExecution('aiPlan', 'Break down the integration', 'Step 1...\nStep 2...', 1200, true);

  const summary = monitor.getSummary();
  console.log('Monitoring Summary:');
  console.log(JSON.stringify(summary, null, 2));

  console.log('\n\nOptimization Report:');
  const report = monitor.generateOptimizationReport();
  console.log(JSON.stringify(report, null, 2));
}

async function testRoutingStats() {
  console.log('\n\n=== ROUTING STATISTICS ===\n');

  const stats = router.getMetrics();
  console.log('Current Routing Metrics:');
  console.log(JSON.stringify(stats, null, 2));
}

async function main() {
  console.log('🚀 AgentArmy Advanced Tool Selection & Routing Test Suite\n');

  displayToolRegistry();
  displayToolsByCategory();

  // Run tests
  testSemanticRouting();

  // Only run LLM tests if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    await testLLMRouting();
    await testHierarchicalRouting();
  } else {
    console.log(
      '\n⚠️  Skipping LLM-based tests (ANTHROPIC_API_KEY not configured). Run with API key to test full routing.'
    );
  }

  await testMonitoring();
  testRoutingStats();

  console.log('\n✅ Test suite complete!\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
