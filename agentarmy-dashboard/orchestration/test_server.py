#!/usr/bin/env python3
"""Quick test of the lightweight Flask orchestration server"""
import requests
import json

BASE_URL = 'http://127.0.0.1:5000'
TEST_TOKEN = 'test-token'

headers = {'Authorization': f'Bearer {TEST_TOKEN}'}

print("\n" + "="*60)
print("Flask Orchestration Server Test")
print("="*60 + "\n")

# Test 1: Health check
print("[Test 1] Health check...")
try:
    resp = requests.get(f'{BASE_URL}/health', headers=headers)
    print(f"  Status: {resp.status_code}")
    print(f"  Response: {json.dumps(resp.json(), indent=2)}")
except Exception as e:
    print(f"  Error: {e}")

# Test 2: Legacy task submission
print("\n[Test 2] Legacy task submission...")
try:
    payload = {
        'task': 'Create marketing plan',
        'priority': 'normal',
        'context': {}
    }
    resp = requests.post(f'{BASE_URL}/orchestrate', json=payload, headers=headers)
    result = resp.json()
    print(f"  Status: {resp.status_code}")
    print(f"  Job ID: {result.get('job_id')}")
    print(f"  Job Status: {result.get('status')}")
    if result.get('result') and result['result'].get('decision'):
        dec = result['result']['decision']
        print(f"  Decision:")
        print(f"    - Next Task: {dec.get('nextTaskId')}")
        print(f"    - Next Agent: {dec.get('nextAgentId')}")
        print(f"    - ZPE Score: {dec.get('zpe', {}).get('total', 0):.3f}")
except Exception as e:
    print(f"  Error: {e}")

# Test 3: Advanced payload
print("\n[Test 3] Advanced payload (full orchestrator format)...")
try:
    payload = {
        'job': {
            'goal': 'Complete research task',
            'constraints': {},
            'deadline_hours': 8,
            'risk_tolerance': 0.5
        },
        'state': {
            'tasks': [
                {
                    'id': 't1',
                    'name': 'Research',
                    'description': 'Gather data',
                    'duration': 2.0,
                    'depends_on': []
                },
                {
                    'id': 't2',
                    'name': 'Analyze',
                    'description': 'Process findings',
                    'duration': 3.0,
                    'depends_on': ['t1']
                }
            ],
            'history': []
        },
        'previous_zpe': 0.5
    }
    resp = requests.post(f'{BASE_URL}/orchestrate', json=payload, headers=headers)
    result = resp.json()
    print(f"  Status: {resp.status_code}")
    print(f"  Job ID: {result.get('job_id')}")
    if result.get('result') and result['result'].get('decision'):
        dec = result['result']['decision']
        print(f"  Decision:")
        print(f"    - Next Task: {dec.get('nextTaskId')}")
        print(f"    - Next Agent: {dec.get('nextAgentId')}")
        print(f"    - Rationale: {dec.get('rationale', '')[:80]}...")
except Exception as e:
    print(f"  Error: {e}")

# Test 4: Job polling
print("\n[Test 4] Job polling...")
try:
    # First submit a task
    payload = {'task': 'Quick test', 'priority': 'normal', 'context': {}}
    resp = requests.post(f'{BASE_URL}/orchestrate', json=payload, headers=headers)
    job_id = resp.json()['job_id']
    
    # Then poll it
    resp = requests.get(f'{BASE_URL}/jobs/{job_id}', headers=headers)
    result = resp.json()
    print(f"  Status: {resp.status_code}")
    print(f"  Job Status: {result.get('status')}")
    print(f"  Job ID: {result.get('job_id')}")
except Exception as e:
    print(f"  Error: {e}")

print("\n" + "="*60 + "\n")
