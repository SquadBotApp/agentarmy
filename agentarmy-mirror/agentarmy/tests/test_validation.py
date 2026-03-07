#!/usr/bin/env python
"""Simple validation script to test the ExpansionManager logic."""

import sys
sys.path.insert(0, '.')

# Test imports
print("Testing imports...")
try:
    from core.expansion import ExpansionManager
    from core.contracts import TaskResult, SimulationMetrics
    print("✓ Imports successful")
except ImportError as e:
    print(f"✗ Import failed: {e}")
    sys.exit(1)

# Test initialization
print("\nTesting initialization...")
try:
    manager = ExpansionManager(performance_threshold=0.85, cooldown_cycles=10)
    assert manager.performance_threshold == 0.85
    assert manager.cooldown_cycles == 10
    assert manager.cycles_since_expansion >= manager.cooldown_cycles
    print("✓ Initialization successful")
except Exception as e:
    print(f"✗ Initialization failed: {e}")
    sys.exit(1)

# Test invalid threshold validation
print("\nTesting threshold validation...")
try:
    try:
        ExpansionManager(performance_threshold=1.1)
        print("✗ Should have raised ValueError for 1.1")
    except ValueError as e:
        if "performance_threshold must be between 0 and 1" in str(e):
            print("✓ Correct error for 1.1")
        else:
            print(f"✗ Wrong error message: {e}")

    try:
        ExpansionManager(performance_threshold=0)
        print("✗ Should have raised ValueError for 0")
    except ValueError:
        print("✓ Correct error for 0")
        
    try:
        ExpansionManager(performance_threshold=-0.1)
        print("✗ Should have raised ValueError for -0.1")
    except ValueError:
        print("✓ Correct error for -0.1")
except Exception as e:
    print(f"✗ Validation test failed: {e}")
    sys.exit(1)

# Test should_expand logic
print("\nTesting should_expand logic...")

GOOD_RESULTS = [
    TaskResult(task_name='task_good_1', status='completed', metrics=SimulationMetrics(accuracy=0.95)),
    TaskResult(task_name='task_good_2', status='completed', metrics=SimulationMetrics(accuracy=0.98))
]

POOR_RESULTS = [
    TaskResult(task_name='task_poor_1', status='completed', metrics=SimulationMetrics(accuracy=0.75)),
    TaskResult(task_name='task_poor_2', status='completed', metrics=SimulationMetrics(accuracy=0.80))
]

MIXED_RESULTS = [
    TaskResult(task_name='task_mixed_1', status='completed', metrics=SimulationMetrics(accuracy=0.99)),
    TaskResult(task_name='task_mixed_2', status='completed', metrics=SimulationMetrics(accuracy=0.81))
]

EMPTY_RESULTS = []

try:
    manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)
    
    # Test good performance
    result = manager.should_expand(GOOD_RESULTS)
    if result is True:
        print(f"✓ Good performance triggers expansion")
    else:
        print(f"✗ Good performance should trigger expansion, got {result}")
    
    # Reset cooldown for next test
    manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)
    
    # Test poor performance
    result = manager.should_expand(POOR_RESULTS)
    if result is False:
        print(f"✓ Poor performance does NOT trigger expansion")
    else:
        print(f"✗ Poor performance should NOT trigger expansion, got {result}")
    
    # Test exact threshold (0.9 average)
    manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)
    result = manager.should_expand(MIXED_RESULTS)
    if result is True:
        print(f"✓ Exact threshold (0.9) triggers expansion")
    else:
        print(f"✗ Exact threshold should trigger expansion, got {result}")
    
    # Test empty results
    manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)
    result = manager.should_expand(EMPTY_RESULTS)
    if result is False:
        print(f"✓ Empty results does NOT trigger expansion")
    else:
        print(f"✗ Empty results should NOT trigger expansion, got {result}")

except Exception as e:
    print(f"✗ should_expand test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test cooldown logic
print("\nTesting cooldown logic...")
try:
    manager = ExpansionManager(performance_threshold=0.9, cooldown_cycles=3)
    
    # First expansion should succeed
    r1 = manager.should_expand(GOOD_RESULTS)
    # Subsequent calls within cooldown period should fail
    r2 = manager.should_expand(GOOD_RESULTS)
    r3 = manager.should_expand(GOOD_RESULTS)
    r4 = manager.should_expand(GOOD_RESULTS)
    
    if r1 is True and r2 is False and r3 is False and r4 is False:
        print("✓ Cooldown prevents immediate re-expansion")
    else:
        print(f"✗ Cooldown logic incorrect: {r1}, {r2}, {r3}, {r4}")
        
except Exception as e:
    print(f"✗ Cooldown test failed: {e}")
    sys.exit(1)

print("\n" + "="*50)
print("All validation tests completed!")
print("="*50)

