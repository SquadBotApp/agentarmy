#!/usr/bin/env python3
"""Debug the legacy task submission issue"""
import requests
import json

BASE_URL = 'http://127.0.0.1:5000'
TEST_TOKEN = 'test-token'

headers = {'Authorization': f'Bearer {TEST_TOKEN}'}

print("[Debug] Legacy task submission...")
payload = {
    'task': 'Create marketing plan',
    'priority': 'normal',
    'context': {}
}

print(f"Sending payload: {json.dumps(payload, indent=2)}")

resp = requests.post(f'{BASE_URL}/orchestrate', json=payload, headers=headers, timeout=10)
result = resp.json()

print(f"\nResponse status: {resp.status_code}")
print(f"Response body: {json.dumps(result, indent=2)}")

if result.get('error'):
    print(f"\nError message: {result['error']}")
