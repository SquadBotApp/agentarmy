/**
 * End-to-end orchestration test
 * Tests Node orchestration client → Python FastAPI service roundtrip
 * 
 * Run this after starting the Python service:
 *   python app.py
 *   node orchestration-e2e.test.mjs
 */

import axios from 'axios';

// The orchestration service URL
const ORCHESTRATION_URL = process.env.ORCHESTRATION_SERVICE_URL || 'http://localhost:5000';
const TEST_TOKEN = 'test-token-for-e2e';

// Simple test runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('AgentArmy Orchestration E2E Tests');
  console.log('='.repeat(60) + '\n');

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✓ PASS: ${t.name}`);
      passed++;
    } catch (e) {
      console.log(`✗ FAIL: ${t.name}`);
      console.log(`  Error: ${e.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// ============ Tests ============

test('Health check returns enabled providers', async () => {
  const response = await axios.get(`${ORCHESTRATION_URL}/health`, {
    headers: { 'Authorization': `Bearer ${TEST_TOKEN}` },
  });
  if (!response.data.status || response.data.status !== 'healthy') {
    throw new Error(`Expected healthy status, got ${response.data.status}`);
  }
  if (!Array.isArray(response.data.enabled_providers)) {
    throw new TypeError('enabled_providers should be an array');
  }
});

test('POST /orchestrate with legacy task format', async () => {
  const response = await axios.post(
    `${ORCHESTRATION_URL}/orchestrate`,
    {
      task: 'Create a marketing plan',
      priority: 'normal',
      context: {},
    },
    { headers: { 'Authorization': `Bearer ${TEST_TOKEN}` } }
  );

  if (!response.data.job_id) {
    throw new Error('Expected job_id in response');
  }
  if (response.data.status !== 'completed') {
    throw new Error(`Expected status=completed, got ${response.data.status}`);
  }
  if (!response.data.result || !response.data.result.decision) {
    throw new Error('Expected result.decision in response');
  }
});

test('POST /orchestrate with orchestrator payload format', async () => {
  const response = await axios.post(
    `${ORCHESTRATION_URL}/orchestrate`,
    {
      job: {
        goal: 'Complete research task',
        constraints: { budget: 100 },
        deadline_hours: 8,
        risk_tolerance: 0.5,
      },
      state: {
        tasks: [
          {
            id: 't1',
            name: 'Research',
            description: 'Gather data',
            duration: 2,
            depends_on: [],
          },
          {
            id: 't2',
            name: 'Analyze',
            description: 'Process findings',
            duration: 3,
            depends_on: ['t1'],
          },
        ],
        history: [],
      },
      previous_zpe: 0.5,
    },
    { headers: { 'Authorization': `Bearer ${TEST_TOKEN}` } }
  );

  if (!response.data.job_id) {
    throw new Error('Expected job_id in response');
  }
  if (!response.data.result.decision) {
    throw new Error('Expected result.decision in response');
  }

  const { decision } = response.data.result;
  if (decision.nextTaskId !== 't1') {
    throw new Error(`Expected nextTaskId=t1, got ${decision.nextTaskId}`);
  }
  if (!decision.nextAgentId) {
    throw new Error('Expected nextAgentId in decision');
  }
  if (!decision.zpe || decision.zpe.total == null) {
    throw new Error('Expected zpe.total in decision');
  }
  if (!decision.cpm || decision.cpm.project_duration == null) {
    throw new Error('Expected cpm.project_duration in decision');
  }
});

test('Job polling returns correct status', async () => {
  // First, submit a task
  const submitResponse = await axios.post(
    `${ORCHESTRATION_URL}/orchestrate`,
    {
      task: 'Quick task',
      priority: 'high',
    },
    { headers: { 'Authorization': `Bearer ${TEST_TOKEN}` } }
  );

  const jobId = submitResponse.data.job_id;

  // Then poll the job
  const statusResponse = await axios.get(
    `${ORCHESTRATION_URL}/jobs/${jobId}`,
    { headers: { 'Authorization': `Bearer ${TEST_TOKEN}` } }
  );

  if (statusResponse.data.job_id !== jobId) {
    throw new Error('Job ID mismatch');
  }
  if (statusResponse.data.status !== 'completed') {
    throw new Error(`Expected completed status, got ${statusResponse.data.status}`);
  }
});

// ============ Run tests ============

// Test if service is reachable first
try {
  console.log(`Attempting to connect to ${ORCHESTRATION_URL}...\n`);
  await axios.get(`${ORCHESTRATION_URL}/health`, {
    headers: { 'Authorization': `Bearer ${TEST_TOKEN}` },
    timeout: 5000,
  });
  console.log('✓ Service is reachable.\n');
} catch (e) {
  console.error(`✗ Cannot connect to ${ORCHESTRATION_URL}`);
  console.error(`  Error: ${e.message}`);
  console.error('\nMake sure the Python service is running:');
  console.error('  cd orchestration');
  console.error('  python app.py\n');
  process.exit(1);
}

await runTests();
