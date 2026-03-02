# Advanced Tool Selection & Optimized Routing Guide

## Overview

AgentArmy now implements **advanced tool selection** using a hybrid approach combining **semantic similarity** (via embeddings) and **LLM-based decision making** (Claude Haiku). This ensures:

- ✅ **Accurate tool selection** for complex, ambiguous queries
- ✅ **Fast routing** with semantic pre-filtering (reduces LLM load)
- ✅ **Hierarchical routing** for scalable, multi-level task dispatch
- ✅ **Cost optimization** with caching and intelligent provider selection
- ✅ **Comprehensive monitoring** of routing accuracy, latency, and costs
- ✅ **Audit trail** for compliance and debugging

---

## Architecture

### Components

1. **Tool Registry** (`tools.js`)
   - Centralized definition of all tools with structured metadata
   - Indexed by ID, category, and keywords
   - Supports multi-level filtering

2. **Advanced Tool Selector** (`toolSelector.js`)
   - Hybrid routing: semantic filtering + LLM decision
   - Hierarchical routing for complex task decomposition
   - Caching for repeated queries
   - Fallback mechanisms for robustness

3. **Router Agent** (`router_agent.js`)
   - Dispatches requests to LLM providers
   - Integrates tool selection with provider selection
   - Manages multi-provider redundancy and failover

4. **Monitoring System** (`monitoring.js`)
   - Logs all routing decisions, LLM calls, and errors
   - Tracks performance metrics and costs
   - Generates optimization reports

---

## Tool Registry

### Defining Tools

Each tool is defined with:

```javascript
{
  id: 'unique_tool_id',
  name: 'human_readable_name',
  category: 'code_analysis', // Or: code_modification, environment_setup, etc.
  description: 'What this tool does...',
  examples: ['Example 1', 'Example 2'],
  parameters: {
    type: 'object',
    properties: { /* ... */ },
    required: ['field1']
  },
  complexity: 'low', // or 'medium', 'high'
  cost: 0.01, // Approximate cost in USD
  latency_ms: 500, // Expected latency in milliseconds
  keywords: ['keyword1', 'keyword2'] // For semantic matching
}
```

### Accessing Tools

```javascript
const toolRegistry = require('./tools');

// Get all tools
const allTools = toolRegistry.tools;

// Get tool by ID
const tool = toolRegistry.getTool('review_files');

// Get tools in a category
const codeTools = toolRegistry.getToolsByCategory('code_analysis');

// Find tools by keywords
const matches = toolRegistry.findToolsByKeywords(['review', 'analyze']);
```

---

## Hybrid Routing (Semantic + LLM)

### How It Works

1. **Semantic Filtering** (Fast, no LLM cost)
   - User query → embedded as vector
   - Compare against tool keyword embeddings
   - Return top N candidates (usually 3-5)

2. **LLM Decision** (Uses Claude Haiku)
   - Present candidates to Claude
   - Claude picks best with reasoning
   - Cache result for future similar queries

### Usage

```javascript
const AdvancedToolSelector = require('./toolSelector');
const selector = new AdvancedToolSelector();

// Hybrid routing for a query
const decision = await selector.selectTool('Review adapters.js for LLM integration');
// Returns: { tool: {...}, reason: '...', model: 'claude-haiku' }

// Access statistics
const stats = selector.getStats();
console.log(stats.cacheHitRate); // e.g., "65.42%"
```

---

## Hierarchical Routing

### How It Works

For complex tasks, route in two levels:

1. **Category Classification**
   - Claude classifies query intent (code_analysis, environment_setup, etc.)
   - Reduces decision space by ~75%

2. **Tool Selection Within Category**
   - Pick best tool from the category
   - Faster and more accurate than flat routing

### Usage

```javascript
// Advanced routing with hierarchy
const decision = await selector.hierarchicalRoute('Setup environment and verify Claude');
// First: "environment_setup" category detected
// Then: "create_env_file" and "verify_env" tools evaluated
// Returns best tool from category
```

---

## Integration with Router Agent

### Basic Usage

```javascript
const RouterAgent = require('./router_agent');
const router = new RouterAgent();

// Select a tool for a query
const { tool, reason, latencyMs } = await router.selectTool('Review my code');
console.log(`Selected: ${tool.id} (${reason}) - ${latencyMs}ms`);

// Hierarchical routing
const { tool: hierarchicalTool } = await router.hierarchicalRoute('Setup and verify');
```

### Provider Selection

Router automatically selects the best provider based on:
- Recent latency (40% weight)
- Cost (30% weight)
- Failure rate (30% weight)

```javascript
// Multi-provider consensus
const result = await router.route(messages, 'consensus', ['openai', 'anthropic', 'groq']);
// Calls all providers, returns best result
```

---

## Monitoring & Metrics

### Logging LLM Calls

```javascript
const monitor = router.monitor;

monitor.logLLMCall('anthropic', 'claude-3-haiku', 450, 0.008, 100, true);
// Parameters: provider, model, latencyMs, cost, tokensUsed, success
```

### Logging Tool Selections

```javascript
monitor.logToolSelection(
  'Review adapters.js',        // query
  'review_files',              // selectedToolId
  [],                          // candidates
  0.95,                        // confidence
  'hybrid'                     // routingMethod
);
```

### Getting Metrics

```javascript
const summary = monitor.getSummary();
console.log(summary);
// {
//   summary: {
//     totalLLMCalls: 42,
//     successRate: "97.61%",
//     avgLatencyMs: 523,
//     totalCost: 0.34,
//     costByProvider: { anthropic: 0.20, openai: 0.14 }
//   },
//   toolSelection: {
//     totalSelections: 28,
//     avgConfidence: 0.89
//   },
//   ...
// }
```

### Optimization Report

```javascript
const report = monitor.generateOptimizationReport();
// Identifies bottlenecks, slow tools, expensive providers
// Generates actionable recommendations
```

---

## Performance Optimization Tips

### 1. Keyword Tuning

Add relevant keywords to tools for better semantic matching:

```javascript
{
  ...tool,
  keywords: ['update', 'modify', 'file', 'patch', 'edit', 'code']
  // More keywords = faster matching for relevant queries
}
```

### 2. Caching

Tool selector caches decisions automatically:

```javascript
// First call: hits semantic filter + LLM (slower)
const result1 = await selector.selectTool('Review adapters');

// Second identical call: cache hit (10ms)
const result2 = await selector.selectTool('Review adapters');

// Check hit rate
console.log(selector.getStats().cacheHitRate); // "60.00%"
```

### 3. Category-Based Filtering

Use hierarchical routing for 50%+ faster decisions on complex tasks:

```javascript
// Flat routing: 1500-2000ms (semantic + LLM)
await selector.selectTool('complex query...');

// Hierarchical routing: 800-1000ms (category + LLM)
await selector.hierarchicalRoute('complex query...');
```

### 4. Cost Optimization

Monitor provider costs and filter providers per task:

```javascript
const { costs } = router.monitor.getSummary();
// If Groq is fastest for simple queries, use it:
await router.route(messages, 'groq');
// For complex tasks, use Haiku for balance
await router.route(messages, 'anthropic');
```

---

## Advanced Features

### Intent-Based Routing

Classify user intent before routing:

```javascript
const intentPrompt = `Classify this intent: "${userQuery}"
Options: review, modify, setup, test, execute, manage
Respond: <intent>...</intent>`;

const response = await adapters.callAnthropic([
  { role: 'user', content: intentPrompt }
]);
// Parse intent and route to matching tool category
```

### Auction-Based Selection

Have multiple tools "bid" on confidence:

```javascript
const candidates = [tool1, tool2, tool3];
const scores = await Promise.all(
  candidates.map(t => evaluateToolConfidence(query, t))
);
const winner = candidates[scores.indexOf(Math.max(...scores))];
```

### Dynamic Tool Filtering

Filter tools based on context:

```javascript
function dynamicFilter(tools, context) {
  return tools.filter(tool => {
    // Exclude complex tools if time is limited
    if (context.timeLimit < 2000 && tool.complexity === 'high') return false;
    // Exclude expensive tools if budget is tight
    if (context.budget < 0.05 && tool.cost > 0.01) return false;
    return true;
  });
}
```

---

## Running Tests

```bash
# Run comprehensive test suite
node server/test_advanced_routing.js

# Expected output:
# - Tool registry display
# - Semantic routing tests
# - LLM routing tests (if API key set)
# - Hierarchical routing tests
# - Monitoring summary
# - Routing statistics
```

---

## Troubleshooting

### Issue: Slow routing (>3s)

**Solution:** Use hierarchical routing or cache results

```javascript
// Instead of semantic + LLM every time:
const result = await selector.selectTool(query);

// Use hierarchical routing for better performance:
const result = await selector.hierarchicalRoute(query);

// Or check cache hit rate:
const stats = selector.getStats();
if (stats.cacheHitRate < "50%") {
  // Consider expanding keywords or improving queries
}
```

### Issue: Incorrect tool selection

**Solution:** Improve tool descriptions and keywords

```javascript
{
  ...tool,
  // Better descriptions reduce ambiguity
  description: 'Specific, clear description of what tool does',
  // More keywords = better matching
  keywords: ['specific', 'keywords', 'that', 'users', 'might', 'search']
}
```

### Issue: High LLM costs

**Solution:** Increase cache hit rate or use faster providers for simple queries

```javascript
// Route simple queries to Groq (cheapest)
if (confidence > 0.95) {
  await router.route(messages, 'groq');
} else {
  // Use Haiku for decision making
  await router.route(messages, 'anthropic');
}
```

---

## Next Steps

1. **Test the system:**
   ```bash
   node server/test_advanced_routing.js
   ```

2. **Integrate with Express endpoints:**
   ```javascript
   app.post('/api/select-tool', async (req, res) => {
     const { query } = req.body;
     const decision = await router.selectTool(query);
     res.json(decision);
   });
   ```

3. **Monitor in production:**
   ```javascript
   // Auto-generate reports daily
   const report = router.monitor.generateOptimizationReport();
   // Send to dashboard or logging service
   ```

4. **Optimize based on metrics:**
   - Review weekly routing accuracy reports
   - Tune tool keywords based on misclassifications
   - Adjust provider selection weights based on performance

---

## References

- **Tool Registry:** `server/tools.js` - All tool definitions
- **Selector Implementation:** `server/toolSelector.js` - Hybrid routing logic
- **Monitoring:** `server/monitoring.js` - Metrics and logging
- **Router Integration:** `server/router_agent.js` - Provider dispatch
- **Tests:** `server/test_advanced_routing.js` - Full test suite
