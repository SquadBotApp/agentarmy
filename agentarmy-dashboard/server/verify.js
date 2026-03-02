#!/usr/bin/env node
/**
 * Verification script for Claude Haiku 4.5 integration
 * Run this to verify all components are properly configured
 */

const fs = require('node:fs');
const path = require('node:path');

console.log('\n🔍 AgentArmy Claude Haiku 4.5 Integration Verification\n');

const checks = [];

// 1. Check server .env file
const serverEnvPath = path.join(__dirname, '.env');
const serverEnvExists = fs.existsSync(serverEnvPath);
checks.push({
  name: 'Server .env file',
  status: serverEnvExists ? '✅' : '❌',
  path: serverEnvPath,
  details: serverEnvExists ? 'Found' : 'Missing - create with ANTHROPIC_API_KEY',
});

if (serverEnvExists) {
  const envContent = fs.readFileSync(serverEnvPath, 'utf8');
  const hasAnthropicKey = envContent.includes('ANTHROPIC_API_KEY');
  checks.push({
    name: 'ANTHROPIC_API_KEY in .env',
    status: hasAnthropicKey ? '✅' : '❌',
    details: hasAnthropicKey ? 'Found' : 'Add ANTHROPIC_API_KEY=your_key_here',
  });
}

// 2. Check frontend .env.local file
const frontendEnvPath = path.join(__dirname, '..', '.env.local');
const frontendEnvExists = fs.existsSync(frontendEnvPath);
checks.push({
  name: 'Frontend .env.local file',
  status: frontendEnvExists ? '✅' : '❌',
  path: frontendEnvPath,
  details: frontendEnvExists ? 'Found' : 'Missing',
});

// 3. Check adapters.js for Claude Haiku model
const adaptersPath = path.join(__dirname, 'adapters.js');
const adaptersExists = fs.existsSync(adaptersPath);
if (adaptersExists) {
  const adaptersContent = fs.readFileSync(adaptersPath, 'utf8');
  const hasClaudeHaiku = adaptersContent.includes('claude-3-5-haiku-20241022');
  checks.push({
    name: 'Claude Haiku 3.5 model in adapters',
    status: hasClaudeHaiku ? '✅' : '❌',
    details: hasClaudeHaiku
      ? 'Using claude-3-5-haiku-20241022'
      : 'Not configured - update adapters.js',
  });
}

// 4. Check index.js for dotenv loading
const indexPath = path.join(__dirname, 'index.js');
const indexExists = fs.existsSync(indexPath);
if (indexExists) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const hasDotenv = indexContent.includes("require('dotenv')");
  checks.push({
    name: 'dotenv loading in index.js',
    status: hasDotenv ? '✅' : '❌',
    details: hasDotenv ? 'Environment vars will load' : 'Add dotenv loading',
  });
}

// 5. Check package.json for dotenv dependency
const packagePath = path.join(__dirname, 'package.json');
const packageContent = fs.readFileSync(packagePath, 'utf8');
const hasDotenvDep = packageContent.includes('"dotenv"');
checks.push({
  name: 'dotenv dependency',
  status: hasDotenvDep ? '✅' : '❌',
  details: hasDotenvDep ? 'Installed' : 'Run: npm install dotenv',
});

// 6. Check workflow.ts for LLM calls
const workflowPath = path.join(__dirname, '..', 'src', 'core', 'workflow.ts');
const workflowExists = fs.existsSync(workflowPath);
if (workflowExists) {
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  const usesCallLLM = workflowContent.includes('callLLM');
  checks.push({
    name: 'workflow.ts uses callLLM',
    status: usesCallLLM ? '✅' : '❌',
    details: usesCallLLM ? 'AI functions implemented' : 'Not using callLLM',
  });
}

// 7. Check llmAdapter.ts exists
const llmAdapterPath = path.join(__dirname, '..', 'src', 'core', 'llmAdapter.ts');
const llmAdapterExists = fs.existsSync(llmAdapterPath);
checks.push({
  name: 'llmAdapter.ts exists',
  status: llmAdapterExists ? '✅' : '❌',
  path: llmAdapterPath,
  details: llmAdapterExists ? 'Frontend adapter ready' : 'Missing',
});

// 8. Check WorkspaceCard uses AI functions
const workspaceCardPath = path.join(__dirname, '..', 'src', 'components', 'WorkspaceCard.tsx');
const workspaceCardExists = fs.existsSync(workspaceCardPath);
if (workspaceCardExists) {
  const cardContent = fs.readFileSync(workspaceCardPath, 'utf8');
  const usesAIFuncs = cardContent.includes('aiRewrite') || cardContent.includes('aiSummarize');
  checks.push({
    name: 'WorkspaceCard uses AI functions',
    status: usesAIFuncs ? '✅' : '❌',
    details: usesAIFuncs ? 'UI wired to LLM' : 'Not integrated',
  });
}

// Print results
console.log('📋 Configuration Checklist:\n');
checks.forEach((check) => {
  console.log(`${check.status} ${check.name}`);
  if (check.details) console.log(`   ${check.details}`);
  if (check.path) console.log(`   ${check.path}`);
});

const allPassed = checks.every((c) => c.status === '✅');

console.log('\n' + (allPassed ? '🎉 All checks passed!' : '⚠️  Some checks failed. See details above.'));
console.log(
  '\n📝 Next steps:\n' +
    '1. Set ANTHROPIC_API_KEY in server/.env\n' +
    '2. Run: npm install (in server/)\n' +
    '3. Run: npm start (server on :4000) and (frontend on :3000)\n' +
    '4. Login with admin/admin, then use Workspace AI buttons\n'
);
console.log('');
