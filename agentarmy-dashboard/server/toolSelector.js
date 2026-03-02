/**
 * Advanced Tool Selector for AgentArmy
 * Implements hybrid routing: semantic similarity (embeddings) + LLM decision making
 * Optimized for fast, accurate tool selection with fallback mechanisms
 */

const toolRegistry = require('./tools');
const adapters = require('./adapters');

class AdvancedToolSelector {
  constructor() {
    this.cache = new Map(); // Cache for embedding similarities
    this.routingStats = {
      totalRequests: 0,
      cacheHits: 0,
      routingErrors: 0,
      toolAccuracy: {},
    };
  }

  /**
   * Simple cosine similarity (inline for no dependencies on embedding libraries)
   * For production, use sentence-transformers or OpenAI embeddings
   */
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
  }

  /**
   * Generate simple embedding for text (keyword frequency vector)
   * In production, use real embedding model (Sentence Transformers, OpenAI embeddings)
   */
  generateEmbedding(text) {
    const normalized = text.toLowerCase();

    // Create vector based on keyword matches
    return toolRegistry.tools.map((tool) => {
      let score = 0;
      tool.keywords.forEach((kw) => {
        if (normalized.includes(kw)) score += 1;
      });
      return score;
    });
  }

  /**
   * Semantic filtering: Find candidate tools via similarity
   * Returns top N tools that match the query Intent
   */
  semanticFilter(query, topN = 5) {
    const queryEmbedding = this.generateEmbedding(query);
    const similarities = toolRegistry.tools.map((tool, idx) => ({
      tool,
      similarity: this.cosineSimilarity(queryEmbedding, toolRegistry.tools.map((t, i) => (i === idx ? 1 : 0))),
    }));

    // Sort by similarity and filter by threshold
    const candidates = similarities
      .filter((item) => item.similarity > 0.3) // Threshold to avoid noise
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN)
      .map((item) => item.tool);

    // If semantic filtering finds nothing, fall back to keyword matching
    if (candidates.length === 0) {
      const keywordMatches = toolRegistry.findToolsByKeywords(query.split(' '));
      return keywordMatches.slice(0, topN);
    }

    return candidates;
  }

  /**
   * LLM-based final decision
   * Takes candidate tools and uses Claude to pick the best one
   */
  async llmDecide(query, candidates) {
    if (candidates.length === 0) {
      return { tool: null, reason: 'No matching tools found' };
    }

    if (candidates.length === 1) {
      return { tool: candidates[0], reason: 'Only candidate' };
    }

    // Format candidates for Claude
    const candidatesList = candidates.map((t) => `- ${t.id}: ${t.description}`).join('\n');

    const prompt = `You are a tool router for an AI agent system. 
Query: "${query}"

Available tools:
${candidatesList}

Select the BEST tool for this query. Respond with ONLY: <route tool="tool_id">reason</route>
Where tool_id is one of: ${candidates.map((t) => t.id).join(', ')}`;

    try {
      const messages = [{ role: 'user', content: prompt }];
      const response = await adapters.callAnthropic(messages);
      const content = response.content || '';

      // Parse Claude's response
      const match = content.match(/<route tool="([^"]+)">([^<]*)<\/route>/);
      if (match) {
        const selectedId = match[1];
        const reason = match[2];
        const selected = candidates.find((t) => t.id === selectedId);
        if (selected) {
          return { tool: selected, reason, model: 'claude-haiku' };
        }
      }

      // Fallback: pick highest complexity match
      return { tool: candidates[0], reason: 'LLM parse error, using first candidate', model: 'fallback' };
    } catch (err) {
      console.error('[ToolSelector] LLM decision error:', err.message);
      return { tool: candidates[0], reason: 'LLM error, using first candidate', model: 'error' };
    }
  }

  /**
   * Hybrid routing: Semantic filter + LLM decision
   * Main entry point for intelligent tool selection
   */
  async selectTool(query) {
    this.routingStats.totalRequests += 1;

    // Check cache
    const cacheKey = `route:${query}`;
    if (this.cache.has(cacheKey)) {
      this.routingStats.cacheHits += 1;
      return this.cache.get(cacheKey);
    }

    // Step 1: Semantic filtering (fast, no LLM needed)
    const candidates = this.semanticFilter(query, 5);

    // Step 2: LLM decision (only if multiple candidates)
    const decision = await this.llmDecide(query, candidates);

    // Cache result
    this.cache.set(cacheKey, decision);

    // Update stats
    if (decision.tool) {
      if (!this.routingStats.toolAccuracy[decision.tool.id]) {
        this.routingStats.toolAccuracy[decision.tool.id] = { selected: 0, success: 0 };
      }
      this.routingStats.toolAccuracy[decision.tool.id].selected += 1;
    }

    return decision;
  }

  /**
   * Hierarchical routing: Route based on task category first
   * Reduces decision space for complex systems
   */
  async hierarchicalRoute(query) {
    // Step 1: Classify category
    const categoryPrompt = `Classify this query into one category:
Query: "${query}"

Categories:
- code_analysis: Reviewing, understanding, analyzing code
- code_modification: Editing, updating, creating files
- environment_setup: Setting up env vars, configuration
- verification: Testing, validating, checking
- workflow_execution: Running AI workflows
- prompt_management: Managing prompts, templates
- monitoring: Logging, auditing, tracking

Respond with ONLY: <category>category_name</category>`;

    try {
      const categoryResponse = await adapters.callAnthropic([{ role: 'user', content: categoryPrompt }]);
      const categoryMatch = categoryResponse.content.match(/<category>([^<]+)<\/category>/);
      const category = categoryMatch ? categoryMatch[1] : 'code_analysis';

      // Step 2: Get tools in that category
      const categoryTools = toolRegistry.getToolsByCategory(category);

      // Step 3: LLM picks best from category
      if (categoryTools.length > 0) {
        return await this.llmDecide(query, categoryTools);
      }

      // Fallback: standard semantic routing
      return await this.selectTool(query);
    } catch (err) {
      console.error('[ToolSelector] Hierarchical routing error:', err.message);
      return await this.selectTool(query);
    }
  }

  /**
   * Get routing statistics
   */
  getStats() {
    return {
      ...this.routingStats,
      cacheSize: this.cache.size,
      cacheHitRate: (this.routingStats.cacheHits / Math.max(1, this.routingStats.totalRequests) * 100).toFixed(2) + '%',
    };
  }

  /**
   * Clear cache (for reset between test runs)
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = AdvancedToolSelector;
