/**
 * Tool Registry for AgentArmy
 * Defines all available tools with structured metadata for intelligent routing
 * Supports LLM-based selection, semantic similarity, and hierarchical dispatch
 */

const tools = [
  {
    id: 'review_files',
    name: 'review_files',
    category: 'code_analysis',
    description: 'Reviews and analyzes specified files in the codebase. Use for understanding structure before updates, checking syntax, or analyzing code patterns.',
    examples: [
      'Review adapters.js and index.js for LLM integration points.',
      'Check the structure of router_agent.js',
      'Analyze workflow.ts for placeholder functions',
    ],
    parameters: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of file paths to review (e.g., ["src/core/workflow.ts", "server/adapters.js"])',
        },
        depth: {
          type: 'string',
          enum: ['shallow', 'deep'],
          description: 'shallow: summary; deep: full analysis',
        },
      },
      required: ['files'],
    },
    complexity: 'low',
    cost: 0.01,
    latency_ms: 500,
    keywords: ['review', 'analyze', 'check', 'examine', 'understand', 'structure', 'syntax'],
  },
  {
    id: 'update_file',
    name: 'update_file',
    category: 'code_modification',
    description: 'Updates a file with new code. Only use after reviewing and planning. Supports partial updates and rollback.',
    examples: [
      'Update adapters.js to add Claude Haiku support',
      'Replace placeholder functions in workflow.ts',
      'Modify router_agent.js scoring logic',
    ],
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Absolute path to the file',
        },
        content: {
          type: 'string',
          description: 'New file content or code snippet',
        },
        mode: {
          type: 'string',
          enum: ['replace', 'append', 'patch'],
          description: 'replace: full file; append: add to end; patch: targeted update',
        },
      },
      required: ['filePath', 'content', 'mode'],
    },
    complexity: 'high',
    cost: 0.05,
    latency_ms: 1000,
    keywords: ['update', 'modify', 'change', 'edit', 'replace', 'patch', 'create'],
  },
  {
    id: 'verify_env',
    name: 'verify_env',
    category: 'environment_setup',
    description: 'Verifies environment variables and configuration. Checks API keys, file paths, and runtime readiness.',
    examples: [
      'Check if ANTHROPIC_API_KEY is set',
      'Verify .env.local exists and is readable',
      'Validate that all required env vars are present',
    ],
    parameters: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          enum: ['all', 'backend', 'frontend', 'integration'],
          description: 'Which environment components to verify',
        },
      },
      required: ['scope'],
    },
    complexity: 'low',
    cost: 0.005,
    latency_ms: 200,
    keywords: ['verify', 'check', 'env', 'environment', 'validate', 'config'],
  },
  {
    id: 'create_env_file',
    name: 'create_env_file',
    category: 'environment_setup',
    description: 'Creates or updates .env files with required API keys and configuration. Securely handles secrets.',
    examples: [
      'Create server/.env with ANTHROPIC_API_KEY',
      'Generate .env.local with REACT_APP_BACKEND_URL',
      'Set up environment for Groq, OpenAI, and xAI',
    ],
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          enum: ['server', 'frontend', 'both'],
          description: 'Where to create the .env file',
        },
        apiKeys: {
          type: 'object',
          description: 'Object with key-value pairs (e.g., { ANTHROPIC_API_KEY: "sk-..." })',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['location', 'apiKeys'],
    },
    complexity: 'medium',
    cost: 0.01,
    latency_ms: 300,
    keywords: ['create', 'setup', 'env', 'environment', 'keys', 'config'],
  },
  {
    id: 'test_llm_integration',
    name: 'test_llm_integration',
    category: 'verification',
    description: 'Tests LLM integration by calling the /llm endpoint. Validates routing, adapter selection, and response handling.',
    examples: [
      'Test Claude Haiku response time',
      'Verify multi-provider consensus mode',
      'Check error handling for failed requests',
    ],
    parameters: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['anthropic', 'openai', 'groq', 'xai', 'gemini', 'all'],
          description: 'Which provider to test (all for ensemble)',
        },
        query: {
          type: 'string',
          description: 'Test query to send',
        },
      },
      required: ['provider'],
    },
    complexity: 'medium',
    cost: 0.02,
    latency_ms: 2000,
    keywords: ['test', 'integration', 'verify', 'llm', 'provider', 'call'],
  },
  {
    id: 'run_workflow',
    name: 'run_workflow',
    category: 'workflow_execution',
    description: 'Executes a workflow (e.g., aiRewrite, aiSummarize, aiPlan). Chains multiple AI operations with result caching.',
    examples: [
      'Run aiPlan to break down a goal',
      'Execute aiSummarize on documentation',
      'Chain aiRewrite + aiSummarize for document refinement',
    ],
    parameters: {
      type: 'object',
      properties: {
        workflow: {
          type: 'string',
          enum: ['aiRewrite', 'aiSummarize', 'aiPlan', 'consensus', 'claudebot'],
          description: 'Which workflow to execute',
        },
        framework: {
          type: 'string',
          enum: ['native', 'langgraph', 'crewai', 'smolagents', 'autogen', 'frabric'],
          description: 'Execution framework for agent coordination',
        },
        input: {
          type: 'string',
          description: 'Input text or goal for the workflow',
        },
      },
      required: ['workflow', 'input'],
    },
    complexity: 'medium',
    cost: 0.03,
    latency_ms: 3000,
    keywords: ['run', 'workflow', 'execute', 'rewrite', 'summarize', 'plan', 'claudebot', 'claude', 'langgraph', 'crewai', 'smolagents', 'autogen', 'frabric', 'fabric'],
  },
  {
    id: 'n8n_workflow_trigger',
    name: 'n8n_workflow_trigger',
    category: 'workflow_execution',
    description: 'Triggers an external n8n automation workflow via configured webhook. Used for post-execution automations, notifications, and integrations.',
    examples: [
      'Trigger n8n workflow for release notification',
      'Send orchestration result to n8n for downstream processing',
    ],
    parameters: {
      type: 'object',
      properties: {
        workflow: {
          type: 'string',
          description: 'n8n workflow name or routing key',
        },
        payload: {
          type: 'object',
          description: 'Structured payload to forward to n8n',
          additionalProperties: true,
        },
      },
      required: ['workflow', 'payload'],
    },
    complexity: 'medium',
    cost: 0.01,
    latency_ms: 1200,
    keywords: ['n8n', 'webhook', 'automation', 'workflow', 'trigger'],
  },
  {
    id: 'platform_agent_dispatch',
    name: 'platform_agent_dispatch',
    category: 'workflow_execution',
    description: 'Dispatches workflow events to external agent platforms such as Agentforce 360, Copilot Studio, watsonx Assistant, Codex, Roo Code, Jules, Hashbrown, Astra, Yellow.ai, Moveworks, AWS Q Dev, and SAP Joule.',
    examples: [
      'Dispatch completed workflow to openai_codex and google_jules',
      'Fan out to microsoft_copilot_studio and agentforce_360',
    ],
    parameters: {
      type: 'object',
      properties: {
        targets: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'agentforce_360',
              'microsoft_copilot_studio',
              'ibm_watsonx_assistant',
              'openai_codex',
              'roo_code',
              'google_jules',
              'hashbrown',
              'project_astra',
              'yellow_ai',
              'moveworks',
              'aws_q_dev',
              'sap_joule',
              'apple_mobile',
              'samsung_mobile',
              'google_mobile',
              'amazon_mobile',
            ],
          },
          description: 'External agent platforms to receive the event',
        },
      },
      required: ['targets'],
    },
    complexity: 'medium',
    cost: 0.02,
    latency_ms: 1800,
    keywords: ['agentforce', 'copilot', 'watsonx', 'codex', 'roo', 'jules', 'hashbrown', 'astra', 'yellow', 'moveworks', 'aws q', 'joule', 'apple', 'samsung', 'google', 'amazon', 'mobile', 'download'],
  },
  {
    id: 'mobile_plugin_deploy',
    name: 'mobile_plugin_deploy',
    category: 'workflow_execution',
    description: 'Deploys mobile integrations and plugin routing for Apple, Samsung, Google, and Amazon ecosystems.',
    examples: [
      'Deploy mobile plugins for apple and google',
      'Trigger mobile rollout to samsung and amazon',
    ],
    parameters: {
      type: 'object',
      properties: {
        vendors: {
          type: 'array',
          items: { type: 'string', enum: ['apple', 'samsung', 'google', 'amazon'] },
          description: 'Target mobile ecosystems',
        },
        goal: {
          type: 'string',
          description: 'Deployment objective',
        },
      },
      required: ['vendors', 'goal'],
    },
    complexity: 'medium',
    cost: 0.02,
    latency_ms: 2000,
    keywords: ['mobile', 'plugin', 'deploy', 'apple', 'samsung', 'google', 'amazon'],
  },
  {
    id: 'manage_prompts',
    name: 'manage_prompts',
    category: 'prompt_management',
    description: 'Manages prompt templates with RBAC. Stores, retrieves, and updates prompts for AI workflows.',
    examples: [
      'Create a new rewrite prompt template',
      'Update system prompt for a specific workflow',
      'List all available prompts (admin only)',
    ],
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'create', 'update', 'delete', 'list'],
          description: 'Action to perform',
        },
        name: {
          type: 'string',
          description: 'Prompt identifier',
        },
      },
      required: ['action'],
    },
    complexity: 'medium',
    cost: 0.01,
    latency_ms: 400,
    keywords: ['prompt', 'manage', 'create', 'update', 'template'],
  },
  {
    id: 'log_and_audit',
    name: 'log_and_audit',
    category: 'monitoring',
    description: 'Logs events and maintains audit trail. Tracks user actions, system state changes, and performance metrics.',
    examples: [
      'Log file update by user@example.com',
      'Audit LLM call cost and latency',
      'Track workflow execution history',
    ],
    parameters: {
      type: 'object',
      properties: {
        eventType: {
          type: 'string',
          description: 'Type of event (e.g., "file_update", "llm_call", "workflow_executed")',
        },
        user: {
          type: 'string',
          description: 'User performing the action',
        },
        details: {
          type: 'object',
          description: 'Event-specific details',
          additionalProperties: true,
        },
      },
      required: ['eventType'],
    },
    complexity: 'low',
    cost: 0.001,
    latency_ms: 100,
    keywords: ['log', 'audit', 'track', 'event', 'history'],
  },
];

// Build metadata indices for fast lookup
const toolsByCategory = {};
const toolsById = {};
const toolsByKeyword = {};

tools.forEach((tool) => {
  // Index by ID
  toolsById[tool.id] = tool;

  // Index by category
  if (!toolsByCategory[tool.category]) toolsByCategory[tool.category] = [];
  toolsByCategory[tool.category].push(tool);

  // Index by keywords
  if (tool.keywords) {
    tool.keywords.forEach((kw) => {
      if (!toolsByKeyword[kw]) toolsByKeyword[kw] = [];
      toolsByKeyword[kw].push(tool);
    });
  }
});

/**
 * Get tool by ID
 */
function getTool(id) {
  return toolsById[id];
}

/**
 * List all tools in a category
 */
function getToolsByCategory(category) {
  return toolsByCategory[category] || [];
}

/**
 * Find tools matching keywords (case-insensitive)
 */
function findToolsByKeywords(keywords) {
  if (!Array.isArray(keywords)) keywords = [keywords];
  const results = new Set();
  keywords.forEach((kw) => {
    const normalized = kw.toLowerCase();
    if (toolsByKeyword[normalized]) {
      toolsByKeyword[normalized].forEach((t) => results.add(t));
    }
  });
  return Array.from(results);
}

/**
 * Format tool for LLM decision (used in routing)
 */
function formatToolForLLM(tool) {
  return `<tool>
  <name>${tool.name}</name>
  <description>${tool.description}</description>
  <category>${tool.category}</category>
  <complexity>${tool.complexity}</complexity>
  <keywords>${tool.keywords.join(', ')}</keywords>
</tool>`;
}

module.exports = {
  tools,
  getTool,
  getToolsByCategory,
  findToolsByKeywords,
  formatToolForLLM,
  toolsByCategory,
  toolsById,
  toolsByKeyword,
};
